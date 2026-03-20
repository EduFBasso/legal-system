"""
Views para API de Publications.
"""
import re
import time
import unicodedata
import logging
from datetime import datetime, timedelta
from django.db import models, IntegrityError
from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from apps.accounts.permissions import is_master_user
from apps.accounts.scope import apply_user_owned_or_shared, build_owner_scope_q

from services.pje_comunica import PJeComunicaService
from apps.notifications.models import Notification
from apps.cases.models import Case, CaseMovement
from .models import Publication, SearchHistory


logger = logging.getLogger(__name__)


def _get_user_publication_identity(user):
    profile = getattr(user, 'profile', None)
    # Para usuário autenticado, priorizar APENAS os dados do perfil.
    # O fallback global (settings/.env) é usado somente quando não há profile (ex.: chamadas anônimas).
    if profile is not None and getattr(user, 'is_authenticated', False):
        oab_number = profile.oab_number or ''
        advogado_nome = profile.full_name_oab or ''
    else:
        oab_number = settings.OAB_NUMBER
        advogado_nome = settings.ADVOGADA_NOME
    tribunais = (profile.monitored_tribunais if profile else None) or getattr(
        settings,
        'PJE_COMUNICA_DEFAULT_TRIBUNAIS',
        ['TJSP', 'TRF3', 'TRT2', 'TRT15'],
    )
    return oab_number, advogado_nome, tribunais


def _get_user_publication_exclusion_rules(user):
    profile = getattr(user, 'profile', None)
    excluded_oabs = getattr(profile, 'publications_excluded_oabs', None) if profile else None
    excluded_keywords = getattr(profile, 'publications_excluded_keywords', None) if profile else None
    return excluded_oabs or [], excluded_keywords or []


def _apply_owner_filter(queryset, user, owner_field='owner'):
    if not user or not user.is_authenticated:
        return queryset
    if is_master_user(user):
        return queryset.filter(build_owner_scope_q(user, owner_field=owner_field, include_ownerless=False))
    return queryset.filter(build_owner_scope_q(user, owner_field=owner_field, include_ownerless=False))


def normalize_string(text):
    """
    Normaliza string removendo acentos para busca.
    Ex: 'Vitória' -> 'vitoria'
    """
    if not text:
        return ''
    # NFD = Normalização de decomposição canônica (separa caractere base + acento)
    # Depois remove categoria Mn (Nonspacing Mark = acentos)
    nfd = unicodedata.normalize('NFD', text)
    return ''.join(char for char in nfd if unicodedata.category(char) != 'Mn').lower()


def normalize_processo_numero(numero_processo):
    """Remove caracteres nao numericos do numero do processo."""
    if not numero_processo:
        return ''
    return ''.join(char for char in str(numero_processo) if char.isdigit())


def _find_case_by_numero_processo(numero_processo, user=None):
    """
    Busca um caso pelo número do processo com fallback robusto.

    Ordem de tentativa:
    1) Match exato em numero_processo_unformatted (mais eficiente)
    2) Match exato em numero_processo (formatado)
    3) Fallback em Python normalizando ambos os formatos

    O fallback cobre casos legados/manuais onde numero_processo_unformatted
    possa estar vazio ou inconsistente.
    """
    numero_limpo = normalize_processo_numero(numero_processo)
    if not numero_limpo:
        return None

    case_queryset = Case.objects.all()
    if user is not None and user.is_authenticated:
        if is_master_user(user):
            case_queryset = case_queryset.filter(build_owner_scope_q(user, include_ownerless=False))
        else:
            case_queryset = case_queryset.filter(build_owner_scope_q(user, include_ownerless=True))

    case = case_queryset.filter(numero_processo_unformatted=numero_limpo).first()
    if case:
        return case

    case = case_queryset.filter(numero_processo=numero_processo).first()
    if case:
        return case

    for candidate in case_queryset.only('id', 'numero_processo', 'numero_processo_unformatted', 'titulo'):
        candidate_numero = candidate.numero_processo_unformatted or candidate.numero_processo
        if normalize_processo_numero(candidate_numero) == numero_limpo:
            return candidate

    return None


def _to_bool(value, default=False):
    """Converte valores de request para boolean de forma previsível."""
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {'1', 'true', 'yes', 'on'}
    return bool(value)


def _extract_prazo_days(texto_publicacao):
    """Extrai prazo em dias do texto da publicação (ex: 'prazo de 15 dias')."""
    if not texto_publicacao:
        return None

    patterns = [
        r'prazo\s+de\s+(\d{1,3})\s*\([^\)]*\)\s*dias?',
        r'prazo\s+de\s+(\d{1,3})\s*dias?',
        r'no\s+prazo\s+de\s+(\d{1,3})\s*dias?',
        r'em\s+(\d{1,3})\s*dias?',
    ]

    for pattern in patterns:
        match = re.search(pattern, texto_publicacao, re.IGNORECASE)
        if not match:
            continue

        try:
            prazo = int(match.group(1))
        except (TypeError, ValueError):
            continue

        if 1 <= prazo <= 365:
            return prazo

    return None


@api_view(['GET'])
def fetch_today_publications(request):
    """
    Busca publicações do dia atual, com opção de incluir dias anteriores.
    
    GET /api/publications/today?lookback_days=1
    
    Response:
    {
        "success": true,
        "data": "2026-02-16",
        "total_publicacoes": 5,
        "total_tribunais_consultados": 4,
        "publicacoes": [
            {
                "id_api": 516309493,
                "numero_processo": "1003498-11.2021.8.26.0533",
                "tribunal": "TJSP",
                "data_disponibilizacao": "2026-02-16",
                "tipo_comunicacao": "Intimação",
                "orgao": "30ª Câmara de Direito Privado",
                "meio": "D",
                "texto_resumo": "DESPACHO...",
                "texto_completo": "full text..."
            }
        ],
        "erros": null
    }
    """
    try:
        user = request.user
        owner = user if user.is_authenticated else None
        oab_number, advogada_nome, tribunais_configurados = _get_user_publication_identity(user)
        excluded_oabs, excluded_keywords = _get_user_publication_exclusion_rules(user)

        if not (str(oab_number).strip() or str(advogada_nome).strip()):
            return Response(
                {
                    'success': False,
                    'error': 'Para buscar publicações, configure o Nome completo e/ou o Número da OAB no seu perfil (Meu Acesso).'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        lookback_days = request.query_params.get('lookback_days')
        try:
            lookback_days = int(lookback_days) if lookback_days is not None else 0
        except (TypeError, ValueError):
            lookback_days = 0
        lookback_days = max(0, min(lookback_days, 30))

        # Iniciar cronômetro
        start_time = time.time()
        
        # Janela de data (hoje com retrocesso opcional)
        hoje = datetime.now().date()
        data_inicio = hoje - timedelta(days=lookback_days)
        data_fim = hoje
        
        # Busca publicações usando o service
        result = PJeComunicaService.fetch_publications(
            oab=oab_number,
            nome_advogado=advogada_nome,
            data_inicio=data_inicio.isoformat(),
            data_fim=data_fim.isoformat(),
            tribunais=tribunais_configurados,
            excluded_oabs=excluded_oabs,
            excluded_keywords=excluded_keywords,
        )
        
        # Salvar publicações no banco e criar histórico
        total_novas = 0
        if result.get('success') and result.get('total_publicacoes', 0) > 0:
            publicacoes = result.get('publicacoes', [])
            
            # Salvar cada publicação (deduplicação automática via id_api unique)
            total_novas = _save_publications_to_db(publicacoes, owner=owner)
            
            # Enriquecer publicações com dados do banco (integration_status, case_id, etc)
            result['publicacoes'] = _enrich_publications_with_db_data(publicacoes, owner=owner)
            
            # Criar notificações para novas publicações (7 dias retroativos)
            _create_publication_notifications(publicacoes, retroactive_days=7, owner=owner)
        
        # Calcular duração
        duration = time.time() - start_time
        
        # Criar histórico de busca
        SearchHistory.objects.create(
            owner=owner,
            data_inicio=data_inicio,
            data_fim=data_fim,
            tribunais=tribunais_configurados,
            total_publicacoes=result.get('total_publicacoes', 0),
            total_novas=total_novas,
            duration_seconds=round(duration, 2),
            search_params={
                'retroactive_days': 7,
                'lookback_days': lookback_days,
                'oab': oab_number,
                'nome_advogado': advogada_nome,
            }
        )
        
        # Adicionar info de novas publicações na resposta
        result['total_novas_salvas'] = total_novas
        result['duration_seconds'] = round(duration, 2)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': f'Erro ao buscar publicações: {str(e)}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def search_publications(request):
    """
    Busca publicações com filtros personalizados.
    
    GET /api/publications/search?data_inicio=2026-02-01&data_fim=2026-02-16&tribunais=TJSP&tribunais=TRF3
    
    Query Parameters:
        - data_inicio (required): Data inicial (YYYY-MM-DD)
        - data_fim (required): Data final (YYYY-MM-DD)
        - tribunais (optional, multi): Lista de tribunais (ex: TJSP, TRF3)
        
    Response: Similar to fetch_today_publications
    """
    try:
        user = request.user
        owner = user if user.is_authenticated else None
        oab_number, advogada_nome, tribunais_configurados = _get_user_publication_identity(user)
        excluded_oabs, excluded_keywords = _get_user_publication_exclusion_rules(user)

        if not (str(oab_number).strip() or str(advogada_nome).strip()):
            return Response(
                {
                    'success': False,
                    'error': 'Para buscar publicações, configure o Nome completo e/ou o Número da OAB no seu perfil (Meu Acesso).'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar parâmetros obrigatórios
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        
        if not data_inicio or not data_fim:
            return Response(
                {
                    'success': False,
                    'error': 'Parâmetros data_inicio e data_fim são obrigatórios'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tribunais selecionados (opcional)
        tribunais = request.query_params.getlist('tribunais')
        if not tribunais:
            tribunais = tribunais_configurados
        
        # Dias retroativos para notificações (padrão: 7 dias)
        retroactive_days = int(request.query_params.get('retroactive_days', 7))
        
        # Iniciar cronômetro
        start_time = time.time()
        
        # Busca publicações usando o service com método genérico
        result = PJeComunicaService.fetch_publications(
            oab=oab_number,
            nome_advogado=advogada_nome,
            data_inicio=data_inicio,
            data_fim=data_fim,
            tribunais=tribunais,
            excluded_oabs=excluded_oabs,
            excluded_keywords=excluded_keywords,
        )
        
        # Salvar publicações no banco e criar histórico
        total_novas = 0
        if result.get('success') and result.get('total_publicacoes', 0) > 0:
            publicacoes = result.get('publicacoes', [])
            
            # Salvar cada publicação (deduplicação automática via id_api unique)
            total_novas = _save_publications_to_db(publicacoes, owner=owner)
            
            # Enriquecer publicações com dados do banco (integration_status, case_id, etc)
            result['publicacoes'] = _enrich_publications_with_db_data(publicacoes, owner=owner)
            
            # Criar notificações para novas publicações
            _create_publication_notifications(
                publicacoes,
                retroactive_days=retroactive_days,
                owner=owner,
            )
        
        # Calcular duração
        duration = time.time() - start_time
        
        # Criar histórico de busca
        SearchHistory.objects.create(
            owner=owner,
            data_inicio=datetime.fromisoformat(data_inicio).date(),
            data_fim=datetime.fromisoformat(data_fim).date(),
            tribunais=tribunais,
            total_publicacoes=result.get('total_publicacoes', 0),
            total_novas=total_novas,
            duration_seconds=round(duration, 2),
            search_params={
                'retroactive_days': retroactive_days,
                'oab': oab_number,
                'nome_advogado': advogada_nome,
            }
        )
        
        # Adicionar info de novas publicações na resposta
        result['total_novas_salvas'] = total_novas
        result['duration_seconds'] = round(duration, 2)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {
                'success': False,
                'error': f'Erro ao buscar publicações: {str(e)}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def debug_search(request):
    import requests
    if not getattr(settings, 'DEBUG', False):
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if not request.user or not request.user.is_authenticated:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_403_FORBIDDEN)

    if not is_master_user(request.user):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    tribunal = request.query_params.get('tribunal', 'TJSP')
    oab = request.query_params.get('oab', '')
    nome = request.query_params.get('nome', '')
    data_inicio = request.query_params.get('data_inicio')
    data_fim = request.query_params.get('data_fim')
    if not data_inicio or not data_fim:
        return Response({'error': 'datas obrigatorias'}, status=400)
    params_oab = {'siglaTribunal': tribunal, 'numeroOab': oab, 'dataDisponibilizacaoInicio': data_inicio, 'dataDisponibilizacaoFim': data_fim}
    params_nome = {'siglaTribunal': tribunal, 'nomeAdvogado': nome, 'dataDisponibilizacaoInicio': data_inicio, 'dataDisponibilizacaoFim': data_fim}
    api_url = getattr(settings, 'PJE_COMUNICA_API_URL', 'https://comunicaapi.pje.jus.br/api/v1/comunicacao')
    try:
        response_oab = requests.get(api_url, params=params_oab, timeout=15)
        response_nome = requests.get(api_url, params=params_nome, timeout=15)
        return Response({
            'oab': {
                'url': response_oab.url,
                'status': response_oab.status_code,
                'data': response_oab.json() if response_oab.status_code == 200 else response_oab.text
            },
            'nome': {
                'url': response_nome.url,
                'status': response_nome.status_code,
                'data': response_nome.json() if response_nome.status_code == 200 else response_nome.text
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


def _create_publication_notifications(publicacoes, retroactive_days=7, owner=None):
    """
    Helper para criar notificações de novas publicações.
    Cria apenas se não existir notificação para aquela publicação específica
    E se a data de disponibilização for dentro do período retroativo.
    
    Args:
        publicacoes: Lista de publicações
        retroactive_days: Número de dias retroativos (padrão: 7)
                         Se 0, nenhuma notificação é criada
    """
    from datetime import datetime, timedelta, timezone
    
    # Se retroactive_days for 0, não criar notificações
    if retroactive_days == 0:
        return
    
    # Calcular data limite (hoje - retroactive_days)
    cutoff_date = datetime.now(timezone.utc).date() - timedelta(days=retroactive_days)
    
    max_per_search = getattr(settings, 'PUBLICATIONS_NOTIFICATION_MAX_PER_SEARCH', 5)
    try:
        max_per_search = int(max_per_search)
    except (TypeError, ValueError):
        max_per_search = 5
    max_per_search = max(0, min(max_per_search, 50))

    notifications_created = 0
    for pub in publicacoes[:max_per_search]:
        # Filtrar por data de disponibilização
        data_disp = pub.get('data_disponibilizacao')
        if data_disp:
            try:
                # Converter string YYYY-MM-DD para date
                pub_date = datetime.fromisoformat(data_disp).date()
                # Pular se for muito antiga
                if pub_date < cutoff_date:
                    continue
            except (ValueError, TypeError) as e:
                # Se não conseguir parsear, pular
                continue
        
        # Verificar se já existe notificação para esta publicação
        notification_exists = Notification.objects.filter(
            type='publication',
            metadata__id_api=pub.get('id_api')
        )
        if owner is not None:
            notification_exists = notification_exists.filter(owner=owner)
        notification_exists = notification_exists.exists()
        
        if notification_exists:
            continue
        
        # Determinar prioridade baseada no tipo de comunicação
        tipo_comunicacao = pub.get('tipo_comunicacao', '').lower()
        if 'intimação' in tipo_comunicacao or 'citação' in tipo_comunicacao:
            priority = 'high'
        elif 'despacho' in tipo_comunicacao:
            priority = 'medium'
        else:
            priority = 'low'
        
        # Criar notificação
        numero_processo = pub.get('numero_processo', 'Sem número')
        tribunal = pub.get('tribunal', '')
        link_oficial = pub.get('link_oficial')  # Link para site oficial
        
        Notification.objects.create(
            owner=owner,
            type='publication',
            priority=priority,
            title=f'Nova Publicação - {tribunal}',
            message=f'Processo: {numero_processo}\nTipo: {pub.get("tipo_comunicacao", "N/A")}\nÓrgão: {pub.get("orgao", "N/A")}',
            link=link_oficial if link_oficial else '/publications',  # Link oficial ou fallback
            metadata={
                'id_api': pub.get('id_api'),
                'numero_processo': numero_processo,
                'tribunal': tribunal,
                'data_disponibilizacao': pub.get('data_disponibilizacao'),
                'tipo_comunicacao': pub.get('tipo_comunicacao'),
                'link_oficial': link_oficial,  # Guardar link no metadata também
            }
        )
        notifications_created += 1


def _save_publications_to_db(publicacoes, owner=None):
    """
    Salva publicações no banco de dados local.
    Retorna quantidade de publicações novas salvas (ignora duplicadas).
    """
    total_novas = 0
    
    for pub in publicacoes:
        id_api = pub.get('id_api')
        if not id_api:
            continue
        
        # Tentar criar (unique constraint previne duplicatas)
        try:
            Publication.objects.create(
                owner=owner,
                id_api=id_api,
                numero_processo=pub.get('numero_processo'),
                tribunal=pub.get('tribunal', ''),
                tipo_comunicacao=pub.get('tipo_comunicacao', ''),
                data_disponibilizacao=datetime.fromisoformat(pub.get('data_disponibilizacao')).date(),
                orgao=pub.get('orgao', ''),
                meio=pub.get('meio', ''),
                texto_resumo=pub.get('texto_resumo', ''),
                texto_completo=pub.get('texto_completo', ''),
                link_oficial=pub.get('link_oficial'),
                hash_pub=pub.get('hash'),
                integration_status='PENDING',
                search_metadata={
                    'original_data': pub
                }
            )
            total_novas += 1
        except IntegrityError:
            # Publicação já existe (duplicate id_api)
            continue
        except Exception as error:
            logger.warning(
                'Erro ao salvar publicação id_api=%s: %s',
                id_api,
                str(error),
            )
    
    return total_novas


def _enrich_publications_with_db_data(publicacoes, owner=None):
    """
    Enriquece a lista de publicações com dados do banco de dados.
    Adiciona campos: integration_status, case_id, id (pk do banco).
    
    Args:
        publicacoes: Lista de dicts com publicações da API externa
        
    Returns:
        Lista de dicts enriquecida com dados do banco
    """
    if not publicacoes:
        return []
    
    # Buscar todas as publicações do banco por id_api
    id_apis = [pub.get('id_api') for pub in publicacoes if pub.get('id_api')]
    db_pubs = Publication.objects.filter(id_api__in=id_apis)
    if owner is not None:
        db_pubs = db_pubs.filter(owner=owner)
    db_pubs = db_pubs.values('id', 'id_api', 'integration_status', 'case_id')
    
    # Criar mapa id_api -> dados do banco
    db_map = {pub['id_api']: pub for pub in db_pubs}
    
    # Enriquecer cada publicação
    enriched = []
    for pub in publicacoes:
        id_api = pub.get('id_api')
        db_data = db_map.get(id_api, {})
        
        # Criar cópia com dados do banco
        enriched_pub = {**pub}
        enriched_pub['integration_status'] = db_data.get('integration_status', 'PENDING')
        enriched_pub['case_id'] = db_data.get('case_id')
        enriched_pub['id'] = db_data.get('id')
        
        enriched.append(enriched_pub)
    
    return enriched


@api_view(['GET'])
def get_last_search(request):
    """
    Retorna informações da última busca realizada.
    Valida se publicações ainda existem no banco (proteção contra deleção manual).
    
    GET /api/publications/last-search
    
    Response:
    {
        "success": true,
        "last_search": {
            "id": 5,
            "executed_at": "2026-02-17T14:48:00Z",
            "data_inicio": "2026-02-11",
            "data_fim": "2026-02-17",
            "tribunais": ["TJSP"],
            "total_publicacoes": 4,
            "total_novas": 2,
            "duration_seconds": 3.45
        }
    }
    """
    try:
        user = request.user
        oab_number, advogada_nome, _tribunais_configurados = _get_user_publication_identity(user)

        if not (str(oab_number).strip() or str(advogada_nome).strip()):
            return Response(
                {
                    'success': False,
                    'error': 'Para buscar publicações, configure o Nome completo e/ou o Número da OAB no seu perfil (Meu Acesso).'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        last_search = _apply_owner_filter(SearchHistory.objects.all(), user).first()  # Ordenado por -executed_at
        
        if not last_search:
            return Response({
                'success': True,
                'last_search': None
            })
        
        # VALIDAÇÃO: Contar quantas publicações ainda existem no banco para esse período
        current_pubs_count = _apply_owner_filter(Publication.objects.filter(
            tribunal__in=last_search.tribunais,
            data_disponibilizacao__gte=last_search.data_inicio,
            data_disponibilizacao__lte=last_search.data_fim
        ), user).count()
        
        # Se não há mais publicações no banco, retornar None (lastSearch inválido)
        if current_pubs_count == 0:
            return Response({
                'success': True,
                'last_search': None
            })
        
        # Retornar com contagem REAL do banco (não do histórico)
        return Response({
            'success': True,
            'last_search': {
                'id': last_search.id,
                'executed_at': last_search.executed_at.isoformat(),
                'data_inicio': last_search.data_inicio.isoformat(),
                'data_fim': last_search.data_fim.isoformat(),
                'tribunais': last_search.tribunais,
                'total_publicacoes': current_pubs_count,  # Contagem REAL
                'total_novas': 0,  # Resetar (não sabemos quais são novas após deleção)
                'duration_seconds': last_search.duration_seconds,
            }
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def retrieve_last_search_publications(request):
    """
    Recupera as publicações da última busca diretamente do banco SQLite.
    Evita requisições ao PJe, retornando dados já salvos.
    
    Returns:
    - success: bool
    - publicacoes: list[dict] - Publicações no formato idêntico à API
    - total_publicacoes: int
    - search_info: dict - Informações da busca (período, tribunais, etc)
    - from_database: bool - Indica que veio do banco
    
    Example response:
    {
        "success": true,
        "total_publicacoes": 4,
        "publicacoes": [...],
        "search_info": {
            "data_inicio": "2026-02-11",
            "data_fim": "2026-02-17",
            "tribunais": ["TJSP"],
            "executed_at": "2026-02-17T14:48:00"
        },
        "from_database": true
    }
    """
    try:
        user = request.user
        oab_number, advogada_nome, _tribunais_configurados = _get_user_publication_identity(user)

        if not (str(oab_number).strip() or str(advogada_nome).strip()):
            return Response(
                {
                    'success': False,
                    'error': 'Para buscar publicações, configure o Nome completo e/ou o Número da OAB no seu perfil (Meu Acesso).'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Buscar última pesquisa
        last_search = _apply_owner_filter(SearchHistory.objects.all(), user).first()
        
        if not last_search:
            return Response({
                'success': False,
                'error': 'Nenhuma busca anterior encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Filtrar publicações do banco de dados
        publicacoes_db = _apply_owner_filter(Publication.objects.filter(
            tribunal__in=last_search.tribunais,
            data_disponibilizacao__gte=last_search.data_inicio,
            data_disponibilizacao__lte=last_search.data_fim
        ), user).order_by('-data_disponibilizacao', '-created_at')
        
        # Serializar publicações no formato idêntico à API
        publicacoes_json = []
        for pub in publicacoes_db:
            case_suggestion = _build_case_suggestion(pub.numero_processo, user=user)
            publicacoes_json.append({
                'id_api': pub.id_api,
                'id': pub.id,
                'numero_processo': pub.numero_processo,
                'tribunal': pub.tribunal,
                'tipo_comunicacao': pub.tipo_comunicacao,
                'data_disponibilizacao': pub.data_disponibilizacao.isoformat(),
                'orgao': pub.orgao,
                'meio': pub.meio,
                'texto_resumo': pub.texto_resumo,
                'texto_completo': pub.texto_completo,
                'link_oficial': pub.link_oficial,
                'hash': pub.hash_pub,
                'integration_status': pub.integration_status,
                'case_id': pub.case_id,
                'case_suggestion': case_suggestion,
            })
        
        return Response({
            'success': True,
            'total_publicacoes': len(publicacoes_json),
            'publicacoes': publicacoes_json,
            'search_info': {
                'data_inicio': last_search.data_inicio.isoformat(),
                'data_fim': last_search.data_fim.isoformat(),
                'tribunais': last_search.tribunais,
                'executed_at': last_search.executed_at.isoformat(),
                'duration_seconds': last_search.duration_seconds,
            },
            'from_database': True
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _build_case_suggestion(numero_processo, user=None):
    """
    Busca caso existente pelo número do processo para sugerir vinculação.
    """
    if not numero_processo:
        return None
    case = _find_case_by_numero_processo(numero_processo, user=user)
    if not case:
        return None
    return {
        'id': case.id,
        'numero_processo': case.numero_processo,
        'titulo': case.titulo,
    }


def _create_movement_from_publication(publication, case):
    tipo_map = {
        'intimação': 'INTIMACAO',
        'intimacao': 'INTIMACAO',
        'citação': 'CITACAO',
        'citacao': 'CITACAO',
        'despacho': 'DESPACHO',
        'sentença': 'SENTENCA',
        'sentenca': 'SENTENCA',
    }
    tipo_comunicacao = (publication.tipo_comunicacao or '').lower()
    tipo_mov = tipo_map.get(tipo_comunicacao, 'OUTROS')

    # Gerar titulo a partir do resumo (evita duplicação de tipo)
    texto_base = publication.texto_resumo or publication.texto_completo or 'Publicação do DJE'
    prazo_dias = _extract_prazo_days(publication.texto_completo or publication.texto_resumo or '')
    # Pega primeiros ~120 caracteres ou primeira frase
    titulo = texto_base[:120].split('\n')[0]
    if len(texto_base) > 120:
        titulo += '...'

    CaseMovement.objects.create(
        case=case,
        data=publication.data_disponibilizacao,
        tipo=tipo_mov,
        titulo=titulo,
        descricao=publication.texto_resumo or publication.texto_completo or '',
        prazo=prazo_dias,
        origem='DJE',
        publicacao_id=publication.id_api,  # Armazena id_api para consultar via API
    )


def _integrate_publication_to_case(publication, case, notes=''):
    """Vincula uma publicação ao caso e atualiza status de integração."""
    publication.case = case
    publication.integration_status = 'INTEGRATED'
    publication.integration_attempted_at = timezone.now()
    if notes:
        publication.integration_notes = notes

    update_fields = [
        'case',
        'integration_status',
        'integration_attempted_at',
        'updated_at',
    ]
    if notes:
        update_fields.append('integration_notes')

    publication.save(update_fields=update_fields)


def _ensure_movement_from_publication(publication, case):
    """
    Garante criação idempotente de movimentação por publicação.
    Retorna True se criou, False se já existia.
    """
    existing = CaseMovement.objects.filter(
        case=case,
        publicacao_id=publication.id_api
    ).exists()
    if existing:
        return False

    _create_movement_from_publication(publication, case)
    return True


@api_view(['GET'])
def get_pending_publications(request):
    """
    Lista publicacoes pendentes de integracao.

    GET /api/publications/pending
    Query params: tribunal, ordering, limit, offset
    """
    try:
        user = request.user
        tribunal = request.query_params.get('tribunal')
        ordering = request.query_params.get('ordering', '-data_disponibilizacao')
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))

        allowed_ordering = {
            'data_disponibilizacao',
            '-data_disponibilizacao',
            'tribunal',
            '-tribunal',
            'created_at',
            '-created_at',
        }
        if ordering not in allowed_ordering:
            ordering = '-data_disponibilizacao'

        queryset = _apply_owner_filter(Publication.objects.filter(
            integration_status='PENDING'
        ), user)

        if tribunal:
            queryset = queryset.filter(tribunal=tribunal)

        total = queryset.count()
        queryset = queryset.order_by(ordering)[offset:offset + limit]

        results = []
        for pub in queryset:
            case_suggestion = None
            if not pub.case_id and pub.integration_status != 'INTEGRATED':
                case_suggestion = _build_case_suggestion(pub.numero_processo, user=user)

            results.append({
                'id': pub.id,
                'id_api': pub.id_api,
                'numero_processo': pub.numero_processo,
                'tribunal': pub.tribunal,
                'tipo_comunicacao': pub.tipo_comunicacao,
                'data_disponibilizacao': pub.data_disponibilizacao.isoformat(),
                'orgao': pub.orgao,
                'texto_resumo': pub.texto_resumo,
                'texto_completo': pub.texto_completo,
                'link_oficial': pub.link_oficial,
                'integration_status': pub.integration_status,
                'case_id': pub.case_id,
                'case_suggestion': _build_case_suggestion(pub.numero_processo, user=user),
            })

        return Response({
            'success': True,
            'count': total,
            'results': results,
            'limit': limit,
            'offset': offset,
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_publications(request):
    """
    Lista TODAS as publicações do sistema (integradas e não vinculadas).

    GET /api/publications/all
    Query params: tribunal, ordering, limit, offset, integration_status
    """
    try:
        user = request.user
        tribunal = request.query_params.get('tribunal')
        ordering = request.query_params.get('ordering', '-data_disponibilizacao')
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        integration_status = request.query_params.get('integration_status')

        allowed_ordering = {
            'data_disponibilizacao',
            '-data_disponibilizacao',
            'tribunal',
            '-tribunal',
            'created_at',
            '-created_at',
        }
        if ordering not in allowed_ordering:
            ordering = '-data_disponibilizacao'

        queryset = _apply_owner_filter(Publication.objects.all(), user)

        if tribunal:
            queryset = queryset.filter(tribunal=tribunal)
        
        if integration_status:
            queryset = queryset.filter(integration_status=integration_status)

        total = queryset.count()
        queryset = queryset.order_by(ordering)[offset:offset + limit]

        results = []
        for pub in queryset:
            case_suggestion = None
            if not pub.case_id and pub.integration_status != 'INTEGRATED':
                case_suggestion = _build_case_suggestion(pub.numero_processo, user=user)

            results.append({
                'id': pub.id,
                'id_api': pub.id_api,
                'numero_processo': pub.numero_processo,
                'tribunal': pub.tribunal,
                'tipo_comunicacao': pub.tipo_comunicacao,
                'data_disponibilizacao': pub.data_disponibilizacao.isoformat() if pub.data_disponibilizacao else None,
                'texto_resumo': pub.texto_resumo,
                'texto_completo': pub.texto_completo,
                'orgao': pub.orgao,
                'link_oficial': pub.link_oficial,
                'integration_status': pub.integration_status,
                'case_id': pub.case_id,
                'case_suggestion': case_suggestion,
                'case_numero': pub.case.numero_processo if pub.case else None,
                'case_titulo': pub.case.titulo if pub.case else None,
                'created_at': pub.created_at.isoformat() if pub.created_at else None,
                'updated_at': pub.updated_at.isoformat() if pub.updated_at else None,
            })

        return Response({
            'success': True,
            'results': results,
            'total': total,
            'limit': limit,
            'offset': offset,
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_pending_count(request):
    try:
        count = _apply_owner_filter(Publication.objects.filter(
            integration_status='PENDING'
        ), request.user).count()
        return Response({
            'success': True,
            'count': count
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_publications_by_case(request, case_id):
    """
    Retorna publicacoes vinculadas a um caso especifico.
    
    GET /api/publications/by-case/<case_id>
    Query params: ordering, limit, offset
    
    Response:
    {
        "success": true,
        "count": 3,
        "results": [
            {
                "id": 123,
                "id_api": 1000760,
                "numero_processo": "0000004-11.2021.8.26.0533",
                "tribunal": "TJSP",
                "tipo_comunicacao": "Intimação",
                "data_disponibilizacao": "2026-02-20",
                "orgao": "1ª Vara Cível",
                "texto_resumo": "...",
                "texto_completo": "...",
                "link_oficial": "https://...",
                "integration_status": "INTEGRATED",
                "created_at": "2026-02-27T10:00:00Z"
            }
        ]
    }
    """
    try:
        user = request.user
        ordering = request.query_params.get('ordering', '-data_disponibilizacao')
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        # Validar ordenação
        allowed_ordering = {
            'data_disponibilizacao',
            '-data_disponibilizacao',
            'tribunal',
            '-tribunal',
            'tipo_comunicacao',
            '-tipo_comunicacao',
            'created_at',
            '-created_at',
        }
        if ordering not in allowed_ordering:
            ordering = '-data_disponibilizacao'
        
        # Buscar publicações do caso
        queryset = _apply_owner_filter(Publication.objects.filter(
            case_id=case_id
        ), user)
        
        total = queryset.count()
        queryset = queryset.order_by(ordering)[offset:offset + limit]
        
        results = []
        for pub in queryset:
            results.append({
                'id': pub.id,
                'id_api': pub.id_api,
                'numero_processo': pub.numero_processo,
                'tribunal': pub.tribunal,
                'tipo_comunicacao': pub.tipo_comunicacao,
                'data_disponibilizacao': pub.data_disponibilizacao.isoformat(),
                'orgao': pub.orgao,
                'meio': pub.meio,
                'texto_resumo': pub.texto_resumo,
                'texto_completo': pub.texto_completo,
                'link_oficial': pub.link_oficial,
                'integration_status': pub.integration_status,
                'created_at': pub.created_at.isoformat(),
            })
        
        return Response({
            'success': True,
            'count': total,
            'results': results,
            'limit': limit,
            'offset': offset,
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def integrate_publication(request, id_api):
    """
    Vincula publicacao a um caso.

    POST /api/publications/<id_api>/integrate
    Body: { case_id, create_movement, notes }
    
    Behavior:
    - Integrates publication to case
    - Optionally creates movement from publication
    - Automatically marks corresponding notification as read
      (User clicked "Criar Caso" or interacted with notification - so they read it)
    """
    try:
        user = request.user
        case_id = request.data.get('case_id')
        create_movement = _to_bool(request.data.get('create_movement', False), default=False)
        auto_integrate_related = _to_bool(request.data.get('auto_integrate_related', True), default=True)
        notes = request.data.get('notes', '')

        if not case_id:
            return Response({
                'success': False,
                'error': 'case_id é obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)

        publication = _apply_owner_filter(Publication.objects.filter(id_api=id_api), user).first()
        if not publication:
            raise Publication.DoesNotExist

        case_queryset = Case.objects.filter(id=case_id)
        if user.is_authenticated:
            if is_master_user(user):
                case_queryset = case_queryset.filter(build_owner_scope_q(user, include_ownerless=False))
            else:
                case_queryset = apply_user_owned_or_shared(case_queryset, user)
        case = case_queryset.first()
        if not case:
            raise Case.DoesNotExist

        _integrate_publication_to_case(publication, case, notes=notes)

        # Mark corresponding notification as read (user interacted with publication)
        try:
            notification = Notification.objects.filter(
                type='publication',
                metadata__id_api=id_api,
                read=False
            )
            if user.is_authenticated:
                notification = notification.filter(owner=user)
            notification = notification.first()
            if notification:
                notification.mark_as_read()
        except Exception as notif_error:
            # Log but don't fail if notification marking fails
            print(f"[Warn] Could not mark notification as read for publication {id_api}: {notif_error}")

        movement_created = False
        related_integrated = 0
        related_movements_created = 0
        if create_movement and _ensure_movement_from_publication(publication, case):
            movement_created = True

        if auto_integrate_related:
            numero_limpo = normalize_processo_numero(
                publication.numero_processo or case.numero_processo
            )

            if numero_limpo:
                candidates = Publication.objects.filter(
                    case__isnull=True,
                    integration_status='PENDING',
                    owner=publication.owner,
                ).exclude(id=publication.id)

                for related_pub in candidates:
                    related_numero = normalize_processo_numero(related_pub.numero_processo)
                    if related_numero != numero_limpo:
                        continue

                    _integrate_publication_to_case(
                        related_pub,
                        case,
                        notes='Integrada automaticamente por mesmo número de processo',
                    )
                    related_integrated += 1

                    if create_movement and _ensure_movement_from_publication(related_pub, case):
                        related_movements_created += 1

        return Response({
            'success': True,
            'message': 'Publicação vinculada com sucesso',
            'movement_created': movement_created,
            'related_integrated': related_integrated,
            'related_movements_created': related_movements_created,
            'publication': {
                'id': publication.id,
                'id_api': publication.id_api,
                'numero_processo': publication.numero_processo,
                'tribunal': publication.tribunal,
                'tipo_comunicacao': publication.tipo_comunicacao,
                'data_disponibilizacao': publication.data_disponibilizacao.isoformat(),
                'case_id': case.id,
                'integration_status': publication.integration_status,
            }
        })

    except Publication.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Publicação não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Case.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Caso não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_movement_from_publication(request, id_api):
    """
    Cria uma movimentação a partir de uma publicação já vinculada.
    
    POST /api/publications/<id_api>/create-movement
    
    Útil para modo manual: quando AUTO_CREATE_MOVEMENT está desativado,
    permite criar movimentação manualmente de cada publicação.
    """
    try:
        user = request.user
        publication = _apply_owner_filter(Publication.objects.filter(id_api=id_api), user).first()
        if not publication:
            raise Publication.DoesNotExist
        
        if not publication.case:
            return Response({
                'success': False,
                'error': 'Publicação não está vinculada a nenhum caso'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar se já existe movimentação desta publicação (evitar duplicação)
        existing = CaseMovement.objects.filter(
            case=publication.case,
            publicacao_id=publication.id_api
        ).first()
        
        if existing:
            return Response({
                'success': False,
                'error': 'Já existe uma movimentação criada a partir desta publicação',
                'movement_id': existing.id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Criar movimentação
        _create_movement_from_publication(publication, publication.case)
        
        # Buscar a movimentação recém-criada para retornar
        movement = CaseMovement.objects.filter(
            case=publication.case,
            publicacao_id=publication.id_api
        ).first()
        
        return Response({
            'success': True,
            'message': 'Movimentação criada com sucesso',
            'movement': {
                'id': movement.id,
                'titulo': movement.titulo,
                'tipo': movement.tipo,
                'data': movement.data.isoformat(),
            }
        })
        
    except Publication.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Publicação não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def batch_integrate_publications(request):
    """
    Integra publicacoes da ultima busca (ou search_id informado).

    POST /api/publications/batch-integrate
    Body: { 
        search_id, 
        auto_link, 
        create_movement, 
        auto_integration (setting do cliente)
    }
    
    Parâmetros:
        - auto_link: Se True, tenta auto-vincular por número de processo
        - create_movement: Se True, cria CaseMovement após integração
        - auto_integration: Setting do cliente (informado apenas para logging/auditoria)
    """
    try:
        user = request.user
        search_id = request.data.get('search_id')
        auto_link = request.data.get('auto_link', True)
        create_movement = request.data.get('create_movement', False)
        auto_integration = request.data.get('auto_integration', False)

        if search_id:
            search = _apply_owner_filter(SearchHistory.objects.filter(id=search_id), user).first()
        else:
            search = _apply_owner_filter(SearchHistory.objects.all(), user).first()

        if not search:
            return Response({
                'success': False,
                'error': 'Nenhuma busca encontrada'
            }, status=status.HTTP_404_NOT_FOUND)

        queryset = _apply_owner_filter(Publication.objects.filter(
            tribunal__in=search.tribunais,
            data_disponibilizacao__gte=search.data_inicio,
            data_disponibilizacao__lte=search.data_fim
        ), user).order_by('-data_disponibilizacao')

        integrated = 0
        pending = 0
        ignored = 0

        for pub in queryset:
            if pub.integration_status == 'IGNORED':
                ignored += 1
                continue

            if not auto_link:
                if pub.integration_status != 'INTEGRATED':
                    pub.integration_status = 'PENDING'
                    pub.integration_attempted_at = timezone.now()
                    pub.integration_notes = 'Integracao adiada'
                    pub.save(update_fields=[
                        'integration_status',
                        'integration_attempted_at',
                        'integration_notes',
                        'updated_at'
                    ])
                    pending += 1
                else:
                    integrated += 1
                continue

            if pub.integration_status == 'INTEGRATED' and pub.case_id:
                integrated += 1
                continue

            case = None
            if pub.numero_processo:
                case = _find_case_by_numero_processo(pub.numero_processo, user=user)

            if case:
                pub.case = case
                pub.integration_status = 'INTEGRATED'
                pub.integration_attempted_at = timezone.now()
                pub.integration_notes = 'Integrada automaticamente'
                pub.save(update_fields=[
                    'case',
                    'integration_status',
                    'integration_attempted_at',
                    'integration_notes',
                    'updated_at'
                ])

                if create_movement:
                    _ensure_movement_from_publication(pub, case)
                integrated += 1
            else:
                pub.integration_status = 'PENDING'
                pub.integration_attempted_at = timezone.now()
                pub.integration_notes = 'Processo nao cadastrado'
                pub.save(update_fields=[
                    'integration_status',
                    'integration_attempted_at',
                    'integration_notes',
                    'updated_at'
                ])
                pending += 1

        return Response({
            'success': True,
            'integrated': integrated,
            'pending': pending,
            'ignored': ignored,
            'search_id': search.id
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_search_history(request):
    """
    Retorna lista completa do histórico de buscas.
    
    GET /api/publications/history?limit=20&offset=0&ordering=-executed_at&q=processo
    
    Query Parameters:
        - limit (optional): Número de itens por página (padrão: 20)
        - offset (optional): Offset para paginação (padrão: 0)
        - ordering (optional): Campo para ordenação (padrão: -executed_at)
                              Opções: executed_at, -executed_at, total_publicacoes, -total_publicacoes
        - q (optional): Busca por número de processo nas publicações
    
    Response:
    {
        "success": true,
        "count": 15,
        "next": "?limit=20&offset=20",
        "previous": null,
        "results": [
            {
                "id": 5,
                "executed_at": "2026-02-17T14:48:00Z",
                "data_inicio": "2026-02-11",
                "data_fim": "2026-02-17",
                "tribunais": ["TJSP", "TRF3"],
                "total_publicacoes": 4,
                "total_novas": 2,
                "duration_seconds": 3.45
            }
        ]
    }
    """
    try:
        user = request.user
        # Parâmetros de paginação
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        ordering = request.query_params.get('ordering', '-executed_at')
        query = request.query_params.get('q', '').strip()
        
        # Validar limite (máximo 100)
        if limit > 100:
            limit = 100
        
        # Validar campo de ordenação
        valid_ordering = ['executed_at', '-executed_at', 'total_publicacoes', 
                         '-total_publicacoes', 'duration_seconds', '-duration_seconds']
        if ordering not in valid_ordering:
            ordering = '-executed_at'
        
        # Buscar histórico
        all_searches = _apply_owner_filter(SearchHistory.objects.all(), user)
        
        # Se houver busca por número de processo
        if query:
            # Remover caracteres especiais do query para buscar também números sem formatação
            # Ex: "00006236920268260320" encontra "0000623-69.2026.8.26.0320"
            import re
            query_digits = re.sub(r'[^\d]', '', query)  # Apenas dígitos
            
            # Detectar se é busca por número (só dígitos) ou por texto (nome de parte)
            is_number_search = len(query_digits) >= 6 and query_digits == query
            
            if is_number_search:
                # Busca por número de processo
                # Tenta tanto com query original quanto só com dígitos
                publications = _apply_owner_filter(Publication.objects.filter(
                    numero_processo__icontains=query
                ), user)
                
                # Se não encontrou, tentar buscar removendo formatação
                if not publications.exists() and query_digits and len(query_digits) >= 7:
                    # Buscar publicações cujo número (sem formatação) contém os dígitos
                    all_publications = _apply_owner_filter(Publication.objects.exclude(numero_processo__isnull=True), user)
                    matching_pubs = []
                    
                    for pub in all_publications:
                        pub_digits = re.sub(r'[^\d]', '', pub.numero_processo or '')
                        if query_digits in pub_digits:
                            matching_pubs.append(pub)
                    
                    publications = matching_pubs
            else:
                # Busca por nome de parte (texto)
                # Normalizar query para busca sem acentos
                query_normalized = normalize_string(query)
                
                # Buscar em todas as publicações e filtrar com normalização
                all_publications = _apply_owner_filter(Publication.objects.all(), user)
                matching_pubs = []
                
                for pub in all_publications:
                    # Normalizar campos de texto
                    texto_resumo_norm = normalize_string(pub.texto_resumo or '')
                    texto_completo_norm = normalize_string(pub.texto_completo or '')
                    orgao_norm = normalize_string(pub.orgao or '')
                    
                    # Verificar se query normalizada está em algum campo normalizado
                    if (query_normalized in texto_resumo_norm or 
                        query_normalized in texto_completo_norm or 
                        query_normalized in orgao_norm):
                        matching_pubs.append(pub)
                
                publications = matching_pubs
            
            # Verificar se encontrou publicações (pode ser QuerySet ou lista)
            has_publications = (publications.exists() if hasattr(publications, 'exists') 
                              else len(publications) > 0)
            
            if has_publications:
                # Encontrar SearchHistory que correspondem às publicações encontradas
                # (mesmo tribunal e período que contém a data da publicação)
                search_ids = set()
                
                for pub in publications:
                    # Buscar históricos que incluem essa publicação
                    # Filtrar no Python porque JSONField contains não funciona bem no SQLite
                    matching_searches = _apply_owner_filter(SearchHistory.objects.filter(
                        data_inicio__lte=pub.data_disponibilizacao,
                        data_fim__gte=pub.data_disponibilizacao
                    ), user)
                    
                    # Filtrar por tribunal no Python
                    for search in matching_searches:
                        if pub.tribunal in search.tribunais:
                            search_ids.add(search.id)
                
                # Filtrar histórico pelos IDs encontrados
                if search_ids:
                    all_searches = all_searches.filter(id__in=search_ids)
                else:
                    all_searches = SearchHistory.objects.none()
            else:
                # Se não encontrou nenhuma publicação, retornar vazio
                all_searches = SearchHistory.objects.none()
        
        # Aplicar ordenação
        all_searches = all_searches.order_by(ordering)
        total_count = all_searches.count()
        
        searches = all_searches[offset:offset + limit]
        
        # Serializar resultados
        results = []
        for search in searches:
            results.append({
                'id': search.id,
                'executed_at': search.executed_at.isoformat(),
                'data_inicio': search.data_inicio.isoformat(),
                'data_fim': search.data_fim.isoformat(),
                'tribunais': search.tribunais,
                'total_publicacoes': search.total_publicacoes,
                'total_novas': search.total_novas,
                'duration_seconds': search.duration_seconds,
            })
        
        # Calcular URLs de paginação
        next_url = None
        previous_url = None
        
        if offset + limit < total_count:
            next_url = f"?limit={limit}&offset={offset + limit}&ordering={ordering}"
        
        if offset > 0:
            prev_offset = max(0, offset - limit)
            previous_url = f"?limit={limit}&offset={prev_offset}&ordering={ordering}"
        
        return Response({
            'success': True,
            'count': total_count,
            'next': next_url,
            'previous': previous_url,
            'results': results
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_search_history_detail(request, search_id):
    """
    Retorna detalhes de uma busca específica do histórico, incluindo as publicações.
    
    GET /api/publications/history/<id>
    
    Response:
    {
        "success": true,
        "search": {
            "id": 5,
            "executed_at": "2026-02-17T14:48:00Z",
            "data_inicio": "2026-02-11",
            "data_fim": "2026-02-17",
            "tribunais": ["TJSP"],
            "total_publicacoes": 4,
            "total_novas": 2,
            "duration_seconds": 3.45,
            "search_params": {
                "retroactive_days": 7,
                "oab": "507553"
            }
        },
        "publicacoes": [...]
    }
    """
    try:
        user = request.user
        # Buscar pesquisa específica
        try:
            search = _apply_owner_filter(SearchHistory.objects.filter(id=search_id), user).get()
        except SearchHistory.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Busca com ID {search_id} não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Buscar publicações relacionadas a esta pesquisa
        publicacoes_db = _apply_owner_filter(Publication.objects.filter(
            tribunal__in=search.tribunais,
            data_disponibilizacao__gte=search.data_inicio,
            data_disponibilizacao__lte=search.data_fim
        ), user).order_by('-data_disponibilizacao', '-created_at')
        
        # Serializar publicações
        publicacoes_json = []
        for pub in publicacoes_db:
            publicacoes_json.append({
                'id_api': pub.id_api,
                'numero_processo': pub.numero_processo,
                'tribunal': pub.tribunal,
                'tipo_comunicacao': pub.tipo_comunicacao,
                'data_disponibilizacao': pub.data_disponibilizacao.isoformat(),
                'orgao': pub.orgao,
                'meio': pub.meio,
                'texto_resumo': pub.texto_resumo,
                'texto_completo': pub.texto_completo,
                'link_oficial': pub.link_oficial,
                'hash': pub.hash_pub,
                'integration_status': pub.integration_status,
                'case_id': pub.case_id,
            })
        
        # Montar resposta com todos os dados da busca
        return Response({
            'success': True,
            'search': {
                'id': search.id,
                'executed_at': search.executed_at.isoformat(),
                'data_inicio': search.data_inicio.isoformat(),
                'data_fim': search.data_fim.isoformat(),
                'tribunais': search.tribunais,
                'total_publicacoes': search.total_publicacoes,
                'total_novas': search.total_novas,
                'duration_seconds': search.duration_seconds,
                'search_params': search.search_params,
            },
            'publicacoes': publicacoes_json,
            'total_publicacoes_encontradas': len(publicacoes_json)
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_search_history(request):
    """
    Deleta todo o histórico de buscas.
    ATENÇÃO: Esta operação é irreversível!
    
    DELETE /api/publications/history
    
    Response:
    {
        "success": true,
        "message": "15 buscas deletadas com sucesso",
        "deleted_count": 15
    }
    """
    try:
        user = request.user
        # Contar registros antes de deletar
        user_searches = _apply_owner_filter(SearchHistory.objects.all(), user)
        count = user_searches.count()
        
        if count == 0:
            return Response({
                'success': True,
                'message': 'Nenhuma busca para deletar',
                'deleted_count': 0
            })
        
        # Deletar todos os registros
        user_searches.delete()
        
        return Response({
            'success': True,
            'message': f'{count} {"busca deletada" if count == 1 else "buscas deletadas"} com sucesso',
            'deleted_count': count
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_publication_by_id(request, id_api):
    """
    Busca uma publicação específica pelo id_api.
    Usado para abrir modal de publicação a partir de notificações.
    Retorna publicação mesmo se estiver deletada (para exibir em notificações antigas).
    """
    try:
        user = request.user
        # Buscar sem filtro de deleted (notificações antigas podem referenciar deletadas)
        publication = _apply_owner_filter(Publication.objects.filter(id_api=id_api), user).first()
        if not publication:
            raise Publication.DoesNotExist
        
        # Serializar no formato da API
        return Response({
            'success': True,
            'publication': {
                'id_api': publication.id_api,
                'numero_processo': publication.numero_processo,
                'tribunal': publication.tribunal,
                'tipo_comunicacao': publication.tipo_comunicacao,
                'data_disponibilizacao': publication.data_disponibilizacao.strftime('%Y-%m-%d'),
                'orgao': publication.orgao,
                'meio': publication.meio,
                'texto_completo': publication.texto_completo,
                'texto_resumo': publication.texto_resumo,
                'link_oficial': publication.link_oficial,
                'hash_pub': publication.hash_pub,
                'integration_status': publication.integration_status,
                'case_id': publication.case_id,
                'case_suggestion': _build_case_suggestion(publication.numero_processo, user=user),
                'created_at': publication.created_at.isoformat(),
            }
        })
        
    except Publication.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Publicação não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_publication(request, id_api):
    """
    HARD DELETE: Remove a publicação do banco de dados.
    CASCADE: Deleta notificações não lidas relacionadas.
    
    DELETE /api/publications/<id_api>/delete
    
    Response:
    {
        "success": true,
        "message": "Publicação removida com sucesso",
        "notifications_deleted": 2
    }
    """
    try:
        user = request.user
        publication = _apply_owner_filter(Publication.objects.filter(id_api=id_api), user).first()
        if not publication:
            raise Publication.DoesNotExist

        has_linked_case = False
        if publication.case_id:
            has_linked_case = Case.objects.filter(id=publication.case_id).exists()

        created_cases_count = publication.casos_criados.count()

        if has_linked_case or created_cases_count > 0:
            return Response({
                'success': False,
                'error': 'Não é possível apagar publicação com processo vinculado. Desvincule/desative o processo primeiro.',
                'linked_case_id': publication.case_id,
                'created_cases_count': created_cases_count,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # HARD DELETE: Deletar notificações não lidas primeiro
        notifications_deleted = Notification.objects.filter(
            type='publication',
            metadata__id_api=id_api,
            read=False
        )
        if user.is_authenticated and not is_master_user(user):
            notifications_deleted = notifications_deleted.filter(owner=user)
        notifications_deleted = notifications_deleted.delete()[0]
        
        # Agora deletar a publicação (CASCADE delete applied)
        publication.delete()
        
        return Response({
            'success': True,
            'message': 'Publicação removida com sucesso',
            'notifications_deleted': notifications_deleted
        })
        
    except Publication.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Publicação não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def delete_multiple_publications(request):
    """
    Deleta múltiplas publicações + notificações relacionadas.
    HARD DELETE com validação de publicações vinculadas a casos.
    
    POST /api/publications/delete-multiple
    Body: {
        "publication_ids": [123, 456, 789]  // Array de id_api
    }
    
    Response:
    {
        "success": true,
        "deleted": 3,
        "notifications_deleted": 5,
        "message": "3 publicação(ões) removida(s)"
    }
    """
    try:
        user = request.user
        publication_ids = request.data.get('publication_ids', [])
        
        if not publication_ids:
            return Response({
                'success': False,
                'message': 'Nenhuma publicação especificada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = _apply_owner_filter(Publication.objects.filter(id_api__in=publication_ids), user)

        protected_ids = []
        deletable_ids = []

        for publication in queryset:
            has_linked_case = False
            if publication.case_id:
                has_linked_case = Case.objects.filter(id=publication.case_id).exists()

            has_created_case = publication.casos_criados.exists()

            if has_linked_case or has_created_case:
                protected_ids.append(publication.id_api)
            else:
                deletable_ids.append(publication.id_api)

        # HARD DELETE: Deletar notificações não lidas primeiro
        notifications_deleted = 0
        for pub_id in deletable_ids:
            notification_qs = Notification.objects.filter(
                type='publication',
                metadata__id_api=pub_id,
                read=False
            )
            if user.is_authenticated and not is_master_user(user):
                notification_qs = notification_qs.filter(owner=user)
            notifications_deleted += notification_qs.delete()[0]
        
        # Agora deletar as publicações
        deleted_count = _apply_owner_filter(Publication.objects.filter(
            id_api__in=deletable_ids
        ), user).delete()[0]
        
        return Response({
            'success': True,
            'deleted': deleted_count,
            'protected': len(protected_ids),
            'protected_ids': protected_ids,
            'notifications_deleted': notifications_deleted,
            'message': f'{deleted_count} publicação(ões) removida(s)'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def delete_all_publications(request):
    """
    HARD DELETE: Remove TODAS as publicações + limpa histórico.
    Valida publicações vinculadas a casos (protegidas).
    
    POST /api/publications/delete-all
    
    Response:
    {
        "success": true,
        "deleted": 150,
        "protected": 5,
        "notifications_deleted": 120,
        "history_deleted": 15,
        "message": "150 publicação(ões) removida(s)"
    }
    """
    try:
        user = request.user
        linked_case_pub_ids = set(
            _apply_owner_filter(Publication.objects.filter(case__isnull=False), user)
            .values_list('id', flat=True)
        )
        linked_origin_pub_ids = set(
            _apply_owner_filter(Publication.objects.filter(casos_criados__isnull=False), user)
            .values_list('id', flat=True)
        )
        protected_pub_ids = linked_case_pub_ids | linked_origin_pub_ids

        # HARD DELETE: Deletar notificações não lidas de publicações não protegidas
        deletable_pubs = _apply_owner_filter(Publication.objects.exclude(id__in=protected_pub_ids), user)
        notifications_deleted = 0
        for pub in deletable_pubs:
            notification_qs = Notification.objects.filter(
                type='publication',
                metadata__id_api=pub.id_api,
                read=False,
            )
            if user.is_authenticated and not is_master_user(user):
                notification_qs = notification_qs.filter(owner=user)
            notifications_deleted += notification_qs.delete()[0]
        
        # Agora deletar as publicações
        deleted_count = _apply_owner_filter(Publication.objects.exclude(id__in=protected_pub_ids), user).delete()[0]
        
        # HARD DELETE: Limpar histórico (sem publicações visíveis, histórico não faz sentido)
        history_deleted = _apply_owner_filter(SearchHistory.objects.all(), user).delete()[0]
        
        return Response({
            'success': True,
            'deleted': deleted_count,
            'protected': len(protected_pub_ids),
            'notifications_deleted': notifications_deleted,
            'history_deleted': history_deleted,
            'message': f'{deleted_count} publicação(ões) removida(s), {notifications_deleted} notificações deletadas e {history_deleted} históricos removidos'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


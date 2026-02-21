"""
Views para API de Publications.
"""
import time
import unicodedata
from datetime import datetime
from django.db import models
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from services.pje_comunica import PJeComunicaService
from apps.notifications.models import Notification
from .models import Publication, SearchHistory


# Credentials from settings
OAB_NUMBER = settings.OAB_NUMBER
ADVOGADA_NOME = settings.ADVOGADA_NOME


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


@api_view(['GET'])
def fetch_today_publications(request):
    """
    Busca publicações de hoje em todos os tribunais configurados.
    
    GET /api/publications/today
    
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
        # Iniciar cronômetro
        start_time = time.time()
        
        # Data de hoje
        hoje = datetime.now().date()
        
        # Busca publicações usando o service
        result = PJeComunicaService.fetch_today_publications(
            oab=OAB_NUMBER,
            nome_advogado=ADVOGADA_NOME
        )
        
        # Salvar publicações no banco e criar histórico
        total_novas = 0
        if result.get('success') and result.get('total_publicacoes', 0) > 0:
            publicacoes = result.get('publicacoes', [])
            
            # Salvar cada publicação (deduplicação automática via id_api unique)
            total_novas = _save_publications_to_db(publicacoes)
            
            # Criar notificações para novas publicações (7 dias retroativos)
            _create_publication_notifications(publicacoes, retroactive_days=7)
        
        # Calcular duração
        duration = time.time() - start_time
        
        # Criar histórico de busca
        SearchHistory.objects.create(
            data_inicio=hoje,
            data_fim=hoje,
            tribunais=['TJSP', 'TRF3', 'TRT2', 'TRT15'],  # Todos os tribunais
            total_publicacoes=result.get('total_publicacoes', 0),
            total_novas=total_novas,
            duration_seconds=round(duration, 2),
            search_params={
                'retroactive_days': 7,
                'oab': OAB_NUMBER,
                'nome_advogado': ADVOGADA_NOME,
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
            tribunais = None  # Usa default do service (todos)
        
        # Dias retroativos para notificações (padrão: 7 dias)
        retroactive_days = int(request.query_params.get('retroactive_days', 7))
        
        # Iniciar cronômetro
        start_time = time.time()
        
        # Busca publicações usando o service com método genérico
        result = PJeComunicaService.fetch_publications(
            oab=OAB_NUMBER,
            nome_advogado=ADVOGADA_NOME,
            data_inicio=data_inicio,
            data_fim=data_fim,
            tribunais=tribunais
        )
        
        # Salvar publicações no banco e criar histórico
        total_novas = 0
        if result.get('success') and result.get('total_publicacoes', 0) > 0:
            publicacoes = result.get('publicacoes', [])
            
            # Salvar cada publicação (deduplicação automática via id_api unique)
            total_novas = _save_publications_to_db(publicacoes)
            
            # Criar notificações para novas publicações
            _create_publication_notifications(
                publicacoes,
                retroactive_days=retroactive_days
            )
        
        # Calcular duração
        duration = time.time() - start_time
        
        # Criar histórico de busca
        SearchHistory.objects.create(
            data_inicio=datetime.fromisoformat(data_inicio).date(),
            data_fim=datetime.fromisoformat(data_fim).date(),
            tribunais=tribunais if tribunais else ['TJSP', 'TRF3', 'TRT2', 'TRT15'],
            total_publicacoes=result.get('total_publicacoes', 0),
            total_novas=total_novas,
            duration_seconds=round(duration, 2),
            search_params={
                'retroactive_days': retroactive_days,
                'oab': OAB_NUMBER,
                'nome_advogado': ADVOGADA_NOME,
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
    tribunal = request.query_params.get('tribunal', 'TJSP')
    oab = request.query_params.get('oab', '507553')
    nome = request.query_params.get('nome', 'Vitoria Rocha de Morais')
    data_inicio = request.query_params.get('data_inicio')
    data_fim = request.query_params.get('data_fim')
    if not data_inicio or not data_fim:
        return Response({'error': 'datas obrigatorias'}, status=400)
    params_oab = {'siglaTribunal': tribunal, 'numeroOab': oab, 'dataDisponibilizacaoInicio': data_inicio, 'dataDisponibilizacaoFim': data_fim}
    params_nome = {'siglaTribunal': tribunal, 'nomeAdvogado': nome, 'dataDisponibilizacaoInicio': data_inicio, 'dataDisponibilizacaoFim': data_fim}
    api_url = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao'
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


def _create_publication_notifications(publicacoes, retroactive_days=7):
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
    
    notifications_created = 0
    for pub in publicacoes[:5]:  # Limitar a 5 notificações por busca
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
        ).exists()
        
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


def _save_publications_to_db(publicacoes):
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
                search_metadata={
                    'original_data': pub
                }
            )
            total_novas += 1
        except Exception:
            # Publicação já existe (duplicate id_api) ou erro de validação
            pass
    
    return total_novas


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
        last_search = SearchHistory.objects.first()  # Ordenado por -executed_at
        
        if not last_search:
            return Response({
                'success': True,
                'last_search': None
            })
        
        # VALIDAÇÃO: Contar quantas publicações ainda existem no banco para esse período
        current_pubs_count = Publication.objects.filter(
            deleted=False,
            tribunal__in=last_search.tribunais,
            data_disponibilizacao__gte=last_search.data_inicio,
            data_disponibilizacao__lte=last_search.data_fim
        ).count()
        
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
        # Buscar última pesquisa
        last_search = SearchHistory.objects.first()
        
        if not last_search:
            return Response({
                'success': False,
                'error': 'Nenhuma busca anterior encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Filtrar publicações do banco de dados (apenas não deletadas)
        publicacoes_db = Publication.objects.filter(
            deleted=False,
            tribunal__in=last_search.tribunais,
            data_disponibilizacao__gte=last_search.data_inicio,
            data_disponibilizacao__lte=last_search.data_fim
        ).order_by('-data_disponibilizacao', '-created_at')
        
        # Serializar publicações no formato idêntico à API
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
        all_searches = SearchHistory.objects.all()
        
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
                publications = Publication.objects.filter(
                    deleted=False,
                    numero_processo__icontains=query
                )
                
                # Se não encontrou, tentar buscar removendo formatação
                if not publications.exists() and query_digits and len(query_digits) >= 7:
                    # Buscar publicações cujo número (sem formatação) contém os dígitos
                    all_publications = Publication.objects.filter(deleted=False).exclude(numero_processo__isnull=True)
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
                
                # Buscar em todas as publicações (apenas não deletadas) e filtrar com normalização
                all_publications = Publication.objects.filter(deleted=False)
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
                    matching_searches = SearchHistory.objects.filter(
                        data_inicio__lte=pub.data_disponibilizacao,
                        data_fim__gte=pub.data_disponibilizacao
                    )
                    
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
        # Buscar pesquisa específica
        try:
            search = SearchHistory.objects.get(id=search_id)
        except SearchHistory.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Busca com ID {search_id} não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Buscar publicações relacionadas a esta pesquisa (apenas não deletadas)
        publicacoes_db = Publication.objects.filter(
            deleted=False,
            tribunal__in=search.tribunais,
            data_disponibilizacao__gte=search.data_inicio,
            data_disponibilizacao__lte=search.data_fim
        ).order_by('-data_disponibilizacao', '-created_at')
        
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
        # Contar registros antes de deletar
        count = SearchHistory.objects.count()
        
        if count == 0:
            return Response({
                'success': True,
                'message': 'Nenhuma busca para deletar',
                'deleted_count': 0
            })
        
        # Deletar todos os registros
        SearchHistory.objects.all().delete()
        
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
        # Buscar sem filtro de deleted (notificações antigas podem referenciar deletadas)
        publication = Publication.objects.get(id_api=id_api)
        
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
    SOFT DELETE: Marca publicação como deletada ao invés de remover do banco.
    Mantém integridade de dados e permite auditoria/recuperação.
    
    DELETE /api/publications/<id_api>/delete
    
    Response:
    {
        "success": true,
        "message": "Publicação marcada como deletada",
        "notifications_deleted": 2
    }
    """
    try:
        publication = Publication.objects.get(id_api=id_api, deleted=False)
        
        # SOFT DELETE: Marcar como deletada
        publication.deleted = True
        publication.deleted_at = timezone.now()
        publication.deleted_reason = 'Exclusão manual pela advogada'
        publication.save()
        
        # CASCADE: Marcar notificações relacionadas como lidas (não deletar)
        notifications_updated = Notification.objects.filter(
            type='publication',
            metadata__id_api=id_api,
            read=False
        ).update(read=True)
        
        return Response({
            'success': True,
            'message': 'Publicação marcada como deletada',
            'notifications_updated': notifications_updated
        })
        
    except Publication.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Publicação não encontrada ou já deletada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def delete_multiple_publications(request):
    """
    Deleta múltiplas publicações + notificações relacionadas (cascade).
    
    POST /api/publications/delete-multiple
    Body: {
        "publication_ids": [123, 456, 789]  // Array de id_api
    }
    
    Response:
    {
        "success": true,
        "deleted": 3,
        "notifications_updated": 5,
        "message": "3 publicação(ões) marcada(s) como deletadas"
    }
    """
    try:
        publication_ids = request.data.get('publication_ids', [])
        
        if not publication_ids:
            return Response({
                'success': False,
                'message': 'Nenhuma publicação especificada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # SOFT DELETE: Marcar publicações como deletadas
        deleted_count = Publication.objects.filter(
            id_api__in=publication_ids,
            deleted=False
        ).update(
            deleted=True,
            deleted_at=timezone.now(),
            deleted_reason='Exclusão múltipla pela advogada'
        )
        
        # Marcar notificações relacionadas como lidas
        notifications_updated = 0
        for pub_id in publication_ids:
            notifications_updated += Notification.objects.filter(
                type='publication',
                metadata__id_api=pub_id,
                read=False
            ).update(read=True)
        
        return Response({
            'success': True,
            'deleted': deleted_count,
            'notifications_updated': notifications_updated,
            'message': f'{deleted_count} publicação(ões) marcada(s) como deletadas'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def delete_all_publications(request):
    """
    SOFT DELETE: Marca TODAS as publicações como deletadas + limpa histórico.
    Mantém publicações no banco para auditoria, mas limpa histórico de buscas.
    
    Lógica: Quando "limpa tudo", faz sentido limpar histórico também.
    Publicações ficam marcadas como deletadas (recuperáveis se necessário).
    
    POST /api/publications/delete-all
    
    Response:
    {
        "success": true,
        "deleted": 150,
        "notifications_updated": 120,
        "history_deleted": 15,
        "message": "Todas as publicações foram marcadas como deletadas"
    }
    """
    try:
        # SOFT DELETE: Marcar TODAS publicações como deletadas
        deleted_count = Publication.objects.filter(deleted=False).update(
            deleted=True,
            deleted_at=timezone.now(),
            deleted_reason='Limpeza geral pelo usuário'
        )
        
        # Marcar TODAS notificações de publicação como lidas
        notifications_updated = Notification.objects.filter(
            type='publication',
            read=False
        ).update(read=True)
        
        # HARD DELETE: Limpar histórico (sem publicações visíveis, histórico não faz sentido)
        history_deleted = SearchHistory.objects.all().delete()[0]
        
        return Response({
            'success': True,
            'deleted': deleted_count,
            'notifications_updated': notifications_updated,
            'history_deleted': history_deleted,
            'message': f'Todas as {deleted_count} publicações foram marcadas como deletadas, {notifications_updated} notificações marcadas como lidas e {history_deleted} históricos removidos'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


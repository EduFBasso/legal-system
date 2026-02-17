"""
Views para API de Publications.
"""
import time
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from services.pje_comunica import PJeComunicaService
from apps.notifications.models import Notification
from .models import Publication, SearchHistory


# Hardcoded credentials (temporary - will be moved to settings/user profile)
OAB_NUMBER = "507553"
ADVOGADA_NOME = "Vitoria Rocha"


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
        # Busca publicações usando o service
        result = PJeComunicaService.fetch_today_publications(
            oab=OAB_NUMBER,
            nome_advogado=ADVOGADA_NOME
        )
        
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
    nome = request.query_params.get('nome', 'Vitoria Rocha')
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
            except (ValueError, TypeError):
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
        
        return Response({
            'success': True,
            'last_search': {
                'id': last_search.id,
                'executed_at': last_search.executed_at.isoformat(),
                'data_inicio': last_search.data_inicio.isoformat(),
                'data_fim': last_search.data_fim.isoformat(),
                'tribunais': last_search.tribunais,
                'total_publicacoes': last_search.total_publicacoes,
                'total_novas': last_search.total_novas,
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
        
        # Filtrar publicações do banco de dados
        publicacoes_db = Publication.objects.filter(
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

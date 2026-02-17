"""
Views para API de Publications.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from services.pje_comunica import PJeComunicaService
from apps.notifications.models import Notification


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
        
        # Busca publicações usando o service com método genérico
        result = PJeComunicaService.fetch_publications(
            oab=OAB_NUMBER,
            nome_advogado=ADVOGADA_NOME,
            data_inicio=data_inicio,
            data_fim=data_fim,
            tribunais=tribunais
        )
        
        # Criar notificações para novas publicações (se houver)
        if result.get('success') and result.get('total_publicacoes', 0) > 0:
            _create_publication_notifications(
                result.get('publicacoes', []),
                retroactive_days=retroactive_days
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

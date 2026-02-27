"""
API views para configurações do sistema.
"""
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
def get_system_settings(request):
    """
    Retorna configurações do sistema.
    
    GET /api/system-settings
    
    Response:
    {
        "success": true,
        "settings": {
            "AUTO_LOAD_PUBLICATIONS_ON_CASE": true,
            "AUTO_CHECK_DEADLINES": true,
            ...
        },
        "environment": "development"
    }
    """
    try:
        return Response({
            'success': True,
            'settings': settings.LEGAL_SYSTEM_SETTINGS,
            'environment': settings.ENVIRONMENT if hasattr(settings, 'ENVIRONMENT') else 'unknown',
            'debug': settings.DEBUG,
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_specific_setting(request, setting_key):
    """
    Retorna uma configuração específica.
    
    GET /api/system-settings/<setting_key>
    
    Response:
    {
        "success": true,
        "key": "AUTO_LOAD_PUBLICATIONS_ON_CASE",
        "value": true
    }
    """
    try:
        setting_value = settings.LEGAL_SYSTEM_SETTINGS.get(setting_key)
        
        if setting_value is None:
            return Response({
                'success': False,
                'error': f'Configuração "{setting_key}" não encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'key': setting_key,
            'value': setting_value,
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

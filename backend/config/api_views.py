"""
API views para configurações do sistema.
"""
import re

from django.conf import settings
from django.db import OperationalError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

EDITABLE_SETTINGS_KEYS = {
    'STALE_PROCESS_MONITOR_ENABLED',
    'STALE_PROCESS_MONITOR_TIME',
    'STALE_PROCESS_DAYS_THRESHOLD',
}


def _parse_time_hhmm(value: str) -> str | None:
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not re.match(r'^\d{2}:\d{2}$', value):
        return None
    hour = int(value[0:2])
    minute = int(value[3:5])
    if hour < 0 or hour > 23:
        return None
    if minute < 0 or minute > 59:
        return None
    return f'{hour:02d}:{minute:02d}'


def _load_settings_overrides():
    """Carrega overrides persistidos no DB.

    Falha silenciosamente se migrations ainda não foram aplicadas.
    """
    try:
        from apps.notifications.models import SystemSetting

        rows = SystemSetting.objects.filter(key__in=EDITABLE_SETTINGS_KEYS).values('key', 'value')
        return {row['key']: row['value'] for row in rows}
    except (OperationalError, Exception):
        return {}


def _merged_settings():
    base = dict(getattr(settings, 'LEGAL_SYSTEM_SETTINGS', {}) or {})
    base.update(_load_settings_overrides())
    return base


def _ensure_can_edit(request):
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return False, Response({'success': False, 'error': 'Autenticação necessária.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Como só permitimos editar um conjunto pequeno de chaves seguras,
    # em instalação local liberamos para qualquer usuário autenticado.
    return True, None


@api_view(['GET', 'PATCH'])
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
        if request.method == 'GET':
            return Response({
                'success': True,
                'settings': _merged_settings(),
                'environment': settings.ENVIRONMENT if hasattr(settings, 'ENVIRONMENT') else 'unknown',
                'debug': settings.DEBUG,
            })

        can_edit, deny_response = _ensure_can_edit(request)
        if not can_edit:
            return deny_response

        payload = getattr(request, 'data', {}) or {}
        updates = payload.get('settings') if isinstance(payload, dict) else None
        if updates is None and isinstance(payload, dict):
            # Permitir PATCH direto com { KEY: value }
            updates = payload

        if not isinstance(updates, dict) or not updates:
            return Response({
                'success': False,
                'error': 'Payload inválido. Envie {"settings": {"KEY": value}} ou {"KEY": value}.',
            }, status=status.HTTP_400_BAD_REQUEST)

        sanitized = {}
        errors = {}
        for key, value in updates.items():
            if key not in EDITABLE_SETTINGS_KEYS:
                continue

            if key == 'STALE_PROCESS_MONITOR_ENABLED':
                sanitized[key] = bool(value)
            elif key == 'STALE_PROCESS_MONITOR_TIME':
                parsed = _parse_time_hhmm(value)
                if not parsed:
                    errors[key] = 'Formato inválido. Use HH:MM (ex.: 09:00).'
                else:
                    sanitized[key] = parsed
            elif key == 'STALE_PROCESS_DAYS_THRESHOLD':
                try:
                    days = int(value)
                    if days <= 0:
                        raise ValueError
                    sanitized[key] = days
                except Exception:
                    errors[key] = 'Valor inválido. Use inteiro > 0.'

        if errors:
            return Response({'success': False, 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
        if not sanitized:
            return Response({'success': False, 'error': 'Nenhuma configuração editável foi enviada.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.notifications.models import SystemSetting

        for key, value in sanitized.items():
            SystemSetting.objects.update_or_create(key=key, defaults={'value': value})

        return Response({'success': True, 'settings': _merged_settings()})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH'])
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
        if request.method == 'GET':
            merged = _merged_settings()
            if setting_key not in merged:
                return Response({
                    'success': False,
                    'error': f'Configuração "{setting_key}" não encontrada'
                }, status=status.HTTP_404_NOT_FOUND)

            return Response({'success': True, 'key': setting_key, 'value': merged.get(setting_key)})

        can_edit, deny_response = _ensure_can_edit(request)
        if not can_edit:
            return deny_response

        if setting_key not in EDITABLE_SETTINGS_KEYS:
            return Response({
                'success': False,
                'error': f'Configuração "{setting_key}" não é editável via API.'
            }, status=status.HTTP_400_BAD_REQUEST)

        value = (getattr(request, 'data', {}) or {}).get('value')
        sanitized = {}
        errors = {}

        if setting_key == 'STALE_PROCESS_MONITOR_ENABLED':
            sanitized[setting_key] = bool(value)
        elif setting_key == 'STALE_PROCESS_MONITOR_TIME':
            parsed = _parse_time_hhmm(value)
            if not parsed:
                errors[setting_key] = 'Formato inválido. Use HH:MM (ex.: 09:00).'
            else:
                sanitized[setting_key] = parsed
        elif setting_key == 'STALE_PROCESS_DAYS_THRESHOLD':
            try:
                days = int(value)
                if days <= 0:
                    raise ValueError
                sanitized[setting_key] = days
            except Exception:
                errors[setting_key] = 'Valor inválido. Use inteiro > 0.'

        if errors:
            return Response({'success': False, 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        from apps.notifications.models import SystemSetting

        SystemSetting.objects.update_or_create(key=setting_key, defaults={'value': sanitized.get(setting_key)})

        return Response({'success': True, 'key': setting_key, 'value': sanitized.get(setting_key)})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

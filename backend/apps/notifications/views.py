from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationCreateSerializer,
    NotificationMarkReadSerializer
)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar notificações.
    
    Endpoints:
    - GET /api/notifications/ - Lista todas as notificações
    - GET /api/notifications/unread/ - Lista apenas não lidas
    - GET /api/notifications/stats/ - Estatísticas de notificações
    - POST /api/notifications/ - Criar notificação
    - PATCH /api/notifications/{id}/ - Atualizar notificação
    - DELETE /api/notifications/{id}/ - Deletar notificação
    - POST /api/notifications/mark_read/ - Marcar como lidas
    - POST /api/notifications/mark_all_read/ - Marcar todas como lidas
    - POST /api/notifications/{id}/toggle_read/ - Toggle lida/não lida
    """
    
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Retorna apenas notificações não lidas."""
        unread_notifications = self.queryset.filter(read=False)
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response({
            'count': unread_notifications.count(),
            'notifications': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retorna estatísticas de notificações."""
        total = self.queryset.count()
        unread = self.queryset.filter(read=False).count()
        
        by_type = {}
        for notification in self.queryset.filter(read=False):
            type_key = notification.type
            if type_key not in by_type:
                by_type[type_key] = 0
            by_type[type_key] += 1
        
        by_priority = {}
        for notification in self.queryset.filter(read=False):
            priority_key = notification.priority
            if priority_key not in by_priority:
                by_priority[priority_key] = 0
            by_priority[priority_key] += 1
        
        return Response({
            'total': total,
            'unread': unread,
            'read': total - unread,
            'by_type': by_type,
            'by_priority': by_priority,
        })
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Marca notificações específicas como lidas."""
        serializer = NotificationMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data.get('notification_ids', [])
        
        if notification_ids:
            notifications = self.queryset.filter(id__in=notification_ids, read=False)
        else:
            # Se não especificar IDs, marca todas como lidas
            notifications = self.queryset.filter(read=False)
        
        count = 0
        for notification in notifications:
            notification.mark_as_read()
            count += 1
        
        return Response({
            'success': True,
            'marked': count,
            'message': f'{count} notificação(ões) marcada(s) como lida(s)'
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Marca todas as notificações como lidas."""
        unread = self.queryset.filter(read=False)
        count = 0
        
        for notification in unread:
            notification.mark_as_read()
            count += 1
        
        return Response({
            'success': True,
            'marked': count,
            'message': f'Todas as {count} notificações foram marcadas como lidas'
        })
    
    @action(detail=True, methods=['post'])
    def toggle_read(self, request, pk=None):
        """Alterna entre lida/não lida."""
        notification = self.get_object()
        
        if notification.read:
            notification.mark_as_unread()
            message = 'Notificação marcada como não lida'
        else:
            notification.mark_as_read()
            message = 'Notificação marcada como lida'
        
        return Response({
            'success': True,
            'read': notification.read,
            'message': message
        })


@api_view(['POST'])
def create_test_notification(request):
    """
    Endpoint para criar notificação de teste.
    Útil para desenvolvimento e troubleshooting.
    """
    notification = Notification.objects.create(
        type='system',
        priority='medium',
        title='Notificação de Teste',
        message='Esta é uma notificação de teste criada em ' + timezone.now().strftime('%d/%m/%Y às %H:%M'),
        link='/notifications'
    )
    
    serializer = NotificationSerializer(notification)
    return Response({
        'success': True,
        'notification': serializer.data,
        'message': 'Notificação de teste criada com sucesso'
    })

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
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
    
    @action(detail=False, methods=['post'])
    def delete_multiple(self, request):
        """Deleta múltiplas notificações de uma vez."""
        notification_ids = request.data.get('notification_ids', [])
        
        if not notification_ids:
            return Response({
                'success': False,
                'message': 'Nenhuma notificação especificada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        deleted_count = self.queryset.filter(id__in=notification_ids).delete()[0]
        
        return Response({
            'success': True,
            'deleted': deleted_count,
            'message': f'{deleted_count} notificação(ões) deletada(s) com sucesso'
        })
    
    @action(detail=False, methods=['post'])
    def delete_all(self, request):
        """Deleta todas as notificações."""
        deleted_count = self.queryset.all().delete()[0]
        
        return Response({
            'success': True,
            'deleted': deleted_count,
            'message': f'Todas as {deleted_count} notificações foram deletadas'
        })
    
    @action(detail=False, methods=['post'])
    def check_deadlines(self, request):
        """
        Verifica prazos de movimentações e cria notificações automáticas.
        
        Lógica de alertas (padrão jurídico 15/7/3):
        - Urgentíssimo (urgent): 0-3 dias restantes
        - Urgente (high): 4-7 dias restantes
        - Normal (medium): 8-15 dias restantes
        
        Retorna estatísticas de prazos encontrados e notificações criadas.
        """
        from apps.cases.models import CaseMovement
        
        today = timezone.now().date()
        future_limit = today + timedelta(days=15)
        
        # Buscar movimentações com prazo dentro da janela de verificação
        movements_with_deadlines = CaseMovement.objects.filter(
            prazo__isnull=False,
            data_limite_prazo__isnull=False,
            data_limite_prazo__gte=today,
            data_limite_prazo__lte=future_limit
        ).select_related('case').order_by('data_limite_prazo')
        
        created_count = 0
        skipped_count = 0
        notifications_data = []
        
        for movement in movements_with_deadlines:
            # Calcular dias até o vencimento
            days_until = (movement.data_limite_prazo - today).days
            
            # Determinar prioridade baseado no padrão 15/7/3
            if days_until <= 3:
                priority = 'urgent'
                if days_until == 0:
                    priority_text = 'HOJE'
                elif days_until == 1:
                    priority_text = 'AMANHÃ'
                else:
                    priority_text = f'em {days_until} dias (URGENTÍSSIMO)'
            elif days_until <= 7:
                priority = 'high'
                priority_text = f'em {days_until} dias (URGENTE)'
            else:
                priority = 'medium'
                priority_text = f'em {days_until} dias'
            
            # Verificar se já existe notificação para este prazo
            notification_exists = Notification.objects.filter(
                type='deadline',
                metadata__movement_id=movement.id,
                read=False
            ).exists()
            
            if notification_exists:
                skipped_count += 1
                continue
            
            # Criar notificação
            notification = Notification.objects.create(
                type='deadline',
                priority=priority,
                title=f'⏰ Prazo vence {priority_text}',
                message=f'Processo {movement.case.numero_processo}: {movement.titulo}',
                link=f'/cases/{movement.case.id}',
                metadata={
                    'movement_id': movement.id,
                    'case_id': movement.case.id,
                    'case_number': movement.case.numero_processo,
                    'deadline_date': movement.data_limite_prazo.isoformat(),
                    'days_until': days_until,
                    'movement_type': movement.tipo,
                    'movement_title': movement.titulo,
                }
            )
            
            created_count += 1
            notifications_data.append({
                'id': notification.id,
                'case_number': movement.case.numero_processo,
                'deadline': movement.data_limite_prazo.isoformat(),
                'days_until': days_until,
                'priority': priority
            })
        
        return Response({
            'success': True,
            'checked': movements_with_deadlines.count(),
            'created': created_count,
            'skipped': skipped_count,
            'notifications': notifications_data,
            'message': f'Verificação concluída: {created_count} notificação(ões) criada(s), {skipped_count} já existente(s)'
        })


@api_view(['POST'])
def create_test_notification(request):
    """
    Endpoint para criar notificação de teste.
    Útil para desenvolvimento e troubleshooting.
    """
    mode = request.data.get('mode') if hasattr(request, 'data') else None
    if not mode:
        mode = request.query_params.get('mode') if hasattr(request, 'query_params') else None

    # Cenário de teste para alerta de 90+ dias (processo fictício)
    if mode == 'stale_90_days':
        now = timezone.now()
        old_date = now - timedelta(days=95)
        now_local = timezone.localtime(now)

        notification = Notification.objects.create(
            type='process',
            priority='high',
            title='⚠ Processo sem publicação há 95 dias',
            message='Processo fictício TESTE-90D sem publicação/movimentação há mais de 90 dias.',
            link='/cases',
            metadata={
                'alert_type': 'stale_90_days',
                'case_id': None,
                'case_number': 'TESTE-90D-0001',
                'days_without_activity': 95,
                'is_test': True,
                'created_at_label': now_local.strftime('%d/%m/%Y às %H:%M')
            }
        )

        # Backdate para aparecer como alerta antigo em listagens por data.
        Notification.objects.filter(id=notification.id).update(
            created_at=old_date,
            updated_at=old_date
        )
        notification.refresh_from_db()
    else:
        # Usar timezone.localtime() para converter para timezone configurado
        now_local = timezone.localtime(timezone.now())
        notification = Notification.objects.create(
            type='publication',
            priority='medium',
            title='Notificação de Teste - Publicação',
            message='Esta é uma notificação de teste criada em ' + now_local.strftime('%d/%m/%Y às %H:%M'),
            link='/notifications',
            metadata={
                'id_api': 999999999,  # ID fictício para teste - abrirá página de detalhes
                'tribunal': 'Tribunal de Teste',
                'numero_processo': '0000000-00.0000.0.00.0000',
                'tipo_comunicacao': 'Teste',
                'is_test': True,
            }
        )
    
    serializer = NotificationSerializer(notification)
    return Response({
        'success': True,
        'notification': serializer.data,
        'message': 'Notificação de teste criada com sucesso'
    })

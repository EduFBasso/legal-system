from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificações."""
    
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'type_display',
            'priority',
            'priority_display',
            'title',
            'message',
            'link',
            'metadata',
            'read',
            'read_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer para criar notificações."""
    
    class Meta:
        model = Notification
        fields = [
            'type',
            'priority',
            'title',
            'message',
            'link',
            'metadata',
        ]


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer para marcar notificações como lidas."""
    
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='IDs das notificações a marcar (vazio = todas)'
    )

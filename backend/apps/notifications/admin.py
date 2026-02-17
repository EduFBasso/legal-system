from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'type', 'priority', 'title', 'read', 'created_at']
    list_filter = ['type', 'priority', 'read', 'created_at']
    search_fields = ['title', 'message']
    readonly_fields = ['created_at', 'updated_at', 'read_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('type', 'priority', 'title', 'message')
        }),
        ('Ação', {
            'fields': ('link', 'metadata')
        }),
        ('Status', {
            'fields': ('read', 'read_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        count = 0
        for notification in queryset:
            notification.mark_as_read()
            count += 1
        self.message_user(request, f'{count} notificação(ões) marcada(s) como lida(s).')
    mark_as_read.short_description = 'Marcar como lida(s)'
    
    def mark_as_unread(self, request, queryset):
        count = 0
        for notification in queryset:
            notification.mark_as_unread()
            count += 1
        self.message_user(request, f'{count} notificação(ões) marcada(s) como não lida(s).')
    mark_as_unread.short_description = 'Marcar como não lida(s)'

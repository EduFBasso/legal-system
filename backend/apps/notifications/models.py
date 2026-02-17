from django.db import models
from django.utils import timezone


class Notification(models.Model):
    """
    Modelo de notificação do sistema.
    
    Tipos de notificação:
    - publication: Nova publicação encontrada
    - deadline: Prazo processual próximo
    - process: Atualização em processo
    - system: Notificação do sistema
    """
    
    NOTIFICATION_TYPES = [
        ('publication', 'Nova Publicação'),
        ('deadline', 'Prazo Próximo'),
        ('process', 'Atualização de Processo'),
        ('system', 'Sistema'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Baixa'),
        ('medium', 'Média'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    # Campos básicos
    type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default='system',
        verbose_name='Tipo'
    )
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_LEVELS,
        default='medium',
        verbose_name='Prioridade'
    )
    
    title = models.CharField(
        max_length=200,
        verbose_name='Título'
    )
    
    message = models.TextField(
        verbose_name='Mensagem'
    )
    
    # Metadados
    link = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Link de ação',
        help_text='URL para navegar ao clicar na notificação'
    )
    
    metadata = models.JSONField(
        blank=True,
        null=True,
        verbose_name='Metadados',
        help_text='Dados adicionais (JSON)'
    )
    
    # Status
    read = models.BooleanField(
        default=False,
        verbose_name='Lida'
    )
    
    read_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Lida em'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Criada em'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Atualizada em'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['read']),
            models.Index(fields=['type']),
        ]
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.title}"
    
    def mark_as_read(self):
        """Marca notificação como lida."""
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save(update_fields=['read', 'read_at'])
    
    def mark_as_unread(self):
        """Marca notificação como não lida."""
        if self.read:
            self.read = False
            self.read_at = None
            self.save(update_fields=['read', 'read_at'])

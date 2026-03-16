from django.db import models
from django.utils import timezone
from django.conf import settings
from apps.organizations.models import Organization


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
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_notifications',
        db_index=True,
        verbose_name='Dono'
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Organização',
        help_text='Organização (tenant) desta notificação'
    )

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
            models.Index(fields=['owner', 'read']),
        ]
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.title}"

    def save(self, *args, **kwargs):
        if self.organization_id is None:
            if self.owner_id is not None:
                profile = getattr(self.owner, 'profile', None)
                if profile and profile.organization_id is not None:
                    self.organization_id = profile.organization_id

            if self.organization_id is None:
                default_org, _ = Organization.objects.get_or_create(name='Escritório Principal')
                self.organization = default_org
        super().save(*args, **kwargs)
    
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

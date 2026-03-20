from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    ROLE_MASTER = 'MASTER'
    ROLE_ADVOGADO = 'ADVOGADO'
    ROLE_ESTAGIARIO = 'ESTAGIARIO'

    ROLE_CHOICES = [
        (ROLE_MASTER, 'Master (Dono do Escritório)'),
        (ROLE_ADVOGADO, 'Advogado'),
        (ROLE_ESTAGIARIO, 'Estagiário'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_ADVOGADO)
    full_name_oab = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text='Nome completo exatamente como deve ser usado na busca de publicações'
    )
    oab_number = models.CharField(
        max_length=30,
        blank=True,
        default='',
        help_text='Número da OAB usado para consulta de publicações'
    )
    monitored_tribunais = models.JSONField(
        default=list,
        blank=True,
        help_text='Lista de tribunais monitorados para buscas automáticas'
    )
    publications_excluded_oabs = models.JSONField(
        default=list,
        blank=True,
        help_text='Lista de números de OAB (sem formatação) para rejeitar publicações (evita falsos positivos)'
    )
    publications_excluded_keywords = models.JSONField(
        default=list,
        blank=True,
        help_text='Lista de frases/trechos para rejeitar publicações (evita falsos positivos)'
    )
    publication_auto_integration = models.BooleanField(
        default=False,
        help_text='Define se publicações devem ser integradas automaticamente para este usuário'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Perfil de Usuário'
        verbose_name_plural = 'Perfis de Usuário'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    @property
    def is_master(self):
        return self.role == self.ROLE_MASTER

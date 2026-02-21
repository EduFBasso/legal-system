from django.db import models
from django.utils import timezone


class Publication(models.Model):
    """
    Publicação jurídica salva localmente para histórico e consulta offline.
    """
    
    # Identificação única da API
    id_api = models.BigIntegerField(unique=True, db_index=True)
    
    # Dados do processo
    numero_processo = models.CharField(
        max_length=50,
        db_index=True,
        null=True,
        blank=True,
        help_text='Número CNJ do processo'
    )
    
    # Tribunal e tipo
    tribunal = models.CharField(
        max_length=10,
        db_index=True,
        help_text='Ex: TJSP, TRF3, TRT2'
    )
    
    tipo_comunicacao = models.CharField(
        max_length=100,
        help_text='Ex: Intimação, Despacho, Citação'
    )
    
    # Data
    data_disponibilizacao = models.DateField(
        db_index=True,
        help_text='Data de publicação no DJE'
    )
    
    # Órgão e meio
    orgao = models.CharField(
        max_length=500,
        blank=True,
        help_text='Órgão/Vara responsável'
    )
    
    meio = models.CharField(
        max_length=10,
        blank=True,
        help_text='Meio de comunicação (D=Digital, F=Físico)'
    )
    
    # Conteúdo
    texto_resumo = models.TextField(
        max_length=500,
        help_text='Primeiros 500 caracteres'
    )
    
    texto_completo = models.TextField(
        help_text='Texto integral da publicação'
    )
    
    # Link oficial
    link_oficial = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL para consulta no site do tribunal'
    )
    
    hash_pub = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Hash da publicação (quando disponível)'
    )
    
    # Metadados de busca
    search_metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Dados da busca que encontrou esta publicação'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Quando foi salva no banco local'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True
    )
    
    # Soft Delete
    deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Se True, publicação foi excluída (soft delete)'
    )
    
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Data/hora da exclusão'
    )
    
    deleted_reason = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Motivo da exclusão (ex: Exclusão manual pela advogada)'
    )
    
    class Meta:
        ordering = ['-data_disponibilizacao', '-created_at']
        verbose_name = 'Publicação'
        verbose_name_plural = 'Publicações'
        indexes = [
            models.Index(fields=['tribunal', '-data_disponibilizacao']),
            models.Index(fields=['numero_processo']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        processo = self.numero_processo or 'Sem número'
        return f"{self.tribunal} - {processo} - {self.data_disponibilizacao}"


class SearchHistory(models.Model):
    """
    Histórico de buscas realizadas.
    """
    
    # Parâmetros da busca
    data_inicio = models.DateField()
    data_fim = models.DateField()
    tribunais = models.JSONField(help_text='Lista de tribunais consultados')
    
    # Resultados
    total_publicacoes = models.IntegerField(default=0)
    total_novas = models.IntegerField(
        default=0,
        help_text='Publicações que não existiam no banco'
    )
    
    # Metadados
    search_params = models.JSONField(
        default=dict,
        blank=True,
        help_text='Parâmetros completos da busca'
    )
    
    # Timestamps
    executed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )
    
    duration_seconds = models.FloatField(
        null=True,
        blank=True,
        help_text='Tempo de execução da busca em segundos'
    )
    
    class Meta:
        ordering = ['-executed_at']
        verbose_name = 'Histórico de Busca'
        verbose_name_plural = 'Histórico de Buscas'
    
    def __str__(self):
        return f"Busca {self.executed_at.strftime('%d/%m/%Y %H:%M')} - {self.total_publicacoes} resultados"

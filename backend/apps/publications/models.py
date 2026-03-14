from django.db import models
from django.utils import timezone
from django.db.models.deletion import ProtectedError
from django.conf import settings


class Publication(models.Model):
    """
    Publicação jurídica salva localmente para histórico e consulta offline.
    """
    
    # Identificação única da API
    id_api = models.BigIntegerField(db_index=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_publications',
        db_index=True,
        help_text='Responsável pelo escopo desta publicação'
    )
    
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

    # Integração com casos
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='publicacoes',
        help_text='Caso ao qual esta publicação está vinculada'
    )

    integration_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pendente de Integração'),
            ('INTEGRATED', 'Integrada ao Caso'),
            ('IGNORED', 'Ignorada pela Advogada'),
        ],
        default='PENDING',
        db_index=True,
        help_text='Status da integração com o sistema'
    )

    integration_attempted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Última tentativa de integração automática'
    )

    integration_notes = models.TextField(
        blank=True,
        default='',
        help_text='Observações sobre a integração (ex: Processo não cadastrado)'
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
    
    class Meta:
        ordering = ['-data_disponibilizacao', '-created_at']
        verbose_name = 'Publicação'
        verbose_name_plural = 'Publicações'
        indexes = [
            models.Index(fields=['tribunal', '-data_disponibilizacao']),
            models.Index(fields=['numero_processo']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['integration_status']),
            models.Index(fields=['owner', 'integration_status']),
            models.Index(fields=['owner', '-data_disponibilizacao']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'id_api'],
                name='unique_publication_id_api_per_owner'
            ),
        ]
    
    def __str__(self):
        processo = self.numero_processo or 'Sem número'
        return f"{self.tribunal} - {processo} - {self.data_disponibilizacao}"
    
    def delete(self, *args, **kwargs):
        """
        Impede exclusão de publicação se houver casos vinculados via publicacao_origem.
        Casos vinculados via Publication.case podem ser desvinculados antes.
        """
        # Verificar se há casos criados a partir desta publicação
        casos_criados = self.casos_criados.filter(deleted=False).count()
        
        if casos_criados > 0:
            raise ProtectedError(
                f"Não é possível deletar esta publicação pois existem {casos_criados} "
                f"caso(s) criado(s) a partir dela. Desabilite os casos primeiro.",
                [self]
            )
        
        super().delete(*args, **kwargs)


class SearchHistory(models.Model):
    """
    Histórico de buscas realizadas.
    """
    
    # Parâmetros da busca
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='publication_search_history',
        db_index=True,
        help_text='Usuário responsável por esta busca'
    )

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

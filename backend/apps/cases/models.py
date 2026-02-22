from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator


class Case(models.Model):
    """
    Processo judicial - núcleo central do sistema.
    """

    # ========== IDENTIFICAÇÃO ==========
    numero_processo = models.CharField(
        max_length=25,
        unique=True,
        db_index=True,
        validators=[
            RegexValidator(
                regex=r'^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$',
                message='Formato CNJ inválido. Use: 0000000-00.0000.0.00.0000'
            )
        ],
        help_text='Número CNJ do processo (formato: 1234567-89.2021.8.26.0100)'
    )

    numero_processo_unformatted = models.CharField(
        max_length=20,
        db_index=True,
        help_text='Número limpo (apenas dígitos) para busca'
    )

    # ========== DADOS BÁSICOS ==========
    titulo = models.CharField(
        max_length=200,
        blank=True,
        help_text='Título/Descrição resumida (ex: Ação de Cobrança - João Silva)'
    )

    tribunal = models.CharField(
        max_length=10,
        db_index=True,
        help_text='Ex: TJSP, TRF3, TST'
    )

    comarca = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Comarca/Subseção judiciária'
    )

    vara = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text='Vara/Turma/Câmara'
    )

    tipo_acao = models.CharField(
        max_length=100,
        blank=True,
        default='',
        choices=[
            ('CIVEL', 'Cível'),
            ('CRIMINAL', 'Criminal'),
            ('TRABALHISTA', 'Trabalhista'),
            ('TRIBUTARIA', 'Tributária'),
            ('FAMILIA', 'Família'),
            ('CONSUMIDOR', 'Consumidor'),
            ('OUTROS', 'Outros'),
        ],
        help_text='Área do direito'
    )

    # ========== RELACIONAMENTOS ==========
    # ManyToMany com Contacts (partes no processo)
    clients = models.ManyToManyField(
        'contacts.Contact',
        through='CaseParty',
        related_name='cases',
        help_text='Clientes/partes envolvidas no processo'
    )

    # ========== STATUS ==========
    status = models.CharField(
        max_length=20,
        default='ATIVO',
        db_index=True,
        choices=[
            ('ATIVO', 'Ativo'),
            ('INATIVO', 'Inativo'),
            ('SUSPENSO', 'Suspenso'),
            ('ARQUIVADO', 'Arquivado'),
            ('ENCERRADO', 'Encerrado'),
        ],
        help_text='Status atual do processo'
    )

    auto_status = models.BooleanField(
        default=True,
        help_text='Se True, status é calculado automaticamente baseado em atividade'
    )

    # ========== DATAS IMPORTANTES ==========
    data_distribuicao = models.DateField(
        null=True,
        blank=True,
        help_text='Data de distribuição/protocolo'
    )

    data_ultima_movimentacao = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Data da última publicação/movimentação (auto-atualizado)'
    )

    data_encerramento = models.DateField(
        null=True,
        blank=True,
        help_text='Data de encerramento/arquivamento'
    )

    # ========== VALOR E PARTES ==========
    valor_causa = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Valor da causa em R$'
    )

    parte_contraria = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text='Nome da parte contrária (ré/autor/reclamada)'
    )

    # ========== OBSERVAÇÕES ==========
    observacoes = models.TextField(
        blank=True,
        default='',
        help_text='Observações internas sobre o caso'
    )

    tags = models.JSONField(
        default=list,
        blank=True,
        help_text='Tags para categorização (ex: ["urgente", "aposentadoria"])'
    )

    # ========== SOFT DELETE ==========
    deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Soft delete para auditoria'
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True
    )

    deleted_reason = models.CharField(
        max_length=255,
        blank=True
    )

    # ========== TIMESTAMPS ==========
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ========== META ==========
    class Meta:
        ordering = ['-data_ultima_movimentacao', '-created_at']
        verbose_name = 'Processo'
        verbose_name_plural = 'Processos'
        indexes = [
            models.Index(fields=['tribunal', 'status']),
            models.Index(fields=['-data_ultima_movimentacao']),
            models.Index(fields=['numero_processo_unformatted']),
            models.Index(fields=['deleted', '-data_ultima_movimentacao']),
        ]

    # ========== PROPERTIES ==========
    @property
    def numero_processo_formatted(self):
        """Retorna número formatado CNJ."""
        num = self.numero_processo_unformatted
        if len(num) == 20:
            return f"{num[0:7]}-{num[7:9]}.{num[9:13]}.{num[13]}.{num[14:16]}.{num[16:20]}"
        return self.numero_processo

    @property
    def dias_sem_movimentacao(self):
        """Dias desde última movimentação."""
        if not self.data_ultima_movimentacao:
            return None
        delta = timezone.now().date() - self.data_ultima_movimentacao
        return delta.days

    @property
    def esta_ativo(self):
        """Considera ativo se teve movimentação nos últimos 90 dias."""
        if not self.data_ultima_movimentacao:
            return False
        return self.dias_sem_movimentacao <= 90

    @property
    def total_publicacoes(self):
        """Número total de publicações vinculadas."""
        # Será implementado quando adicionar ForeignKey em Publication
        return 0

    @property
    def publicacoes_recentes(self):
        """Publicações dos últimos 30 dias."""
        # Será implementado quando adicionar ForeignKey em Publication
        return 0

    @property
    def nivel_urgencia(self):
        """
        Calcula nível de urgência baseado em prazos e publicações.
        Retorna: 'URGENTE', 'ATENCAO', 'NORMAL'
        """
        # TODO: Implementar quando Agenda estiver pronto
        return 'NORMAL'

    # ========== METHODS ==========
    def atualizar_status_automatico(self):
        """
        Atualiza status baseado em atividade recente.
        Só atualiza se auto_status=True.
        """
        if not self.auto_status:
            return

        dias = self.dias_sem_movimentacao

        if dias is None:
            self.status = 'INATIVO'
        elif dias <= 90:
            self.status = 'ATIVO'
        elif dias <= 180:
            self.status = 'INATIVO'
        else:
            self.status = 'ARQUIVADO'

        self.save(update_fields=['status'])

    def __str__(self):
        if self.titulo:
            return f"{self.numero_processo} - {self.titulo}"
        return self.numero_processo

    def save(self, *args, **kwargs):
        # Auto-preencher numero_processo_unformatted
        if self.numero_processo:
            self.numero_processo_unformatted = ''.join(filter(str.isdigit, self.numero_processo))
        super().save(*args, **kwargs)


class CaseParty(models.Model):
    """
    Tabela intermediária para relacionamento ManyToMany entre Case e Contact.
    Permite especificar o papel de cada parte.
    """

    case = models.ForeignKey(
        'Case',
        on_delete=models.CASCADE,
        related_name='parties'
    )

    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        related_name='case_roles'
    )

    role = models.CharField(
        max_length=20,
        choices=[
            ('CLIENTE', 'Cliente/Representado'),
            ('AUTOR', 'Autor'),
            ('REU', 'Réu'),
            ('TESTEMUNHA', 'Testemunha'),
            ('PERITO', 'Perito'),
            ('TERCEIRO', 'Terceiro Interessado'),
        ],
        default='CLIENTE',
        help_text='Papel da parte no processo'
    )

    observacoes = models.TextField(
        blank=True,
        help_text='Observações sobre a participação dessa parte'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('case', 'contact')
        verbose_name = 'Parte do Processo'
        verbose_name_plural = 'Partes do Processo'

    def __str__(self):
        return f"{self.contact.name} - {self.get_role_display()} ({self.case.numero_processo})"

import unicodedata

from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.conf import settings

from apps.cases.defaults import CASE_PARTY_ROLE_CHOICES, CASE_TIPO_ACAO_CHOICES


class Case(models.Model):
    """
    Processo judicial - núcleo central do sistema.
    """

    # ========== IDENTIFICAÇÃO ==========
    numero_processo = models.CharField(
        max_length=25,
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
        choices=CASE_TIPO_ACAO_CHOICES,
        help_text='Área do direito'
    )

    # ========== RELACIONAMENTOS ==========
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_cases',
        db_index=True,
        help_text='Responsável pelo escopo deste processo'
    )

    # ManyToMany com Contacts (partes no processo)
    clients = models.ManyToManyField(
        'contacts.Contact',
        through='CaseParty',
        related_name='cases',
        help_text='Clientes/partes envolvidas no processo'
    )

    # ========== VÍNCULO (PROCESSO PRINCIPAL / DERIVADO) ==========
    CLASSIFICACAO_CHOICES = [
        ('NEUTRO', 'Neutro'),
        ('PRINCIPAL', 'Principal'),
    ]

    classificacao = models.CharField(
        max_length=20,
        choices=CLASSIFICACAO_CHOICES,
        default='NEUTRO',
        db_index=True,
        help_text='Classificação do processo (quando não há case_principal).',
    )

    VINCULO_TIPO_CHOICES = [
        ('DERIVADO', 'Derivado'),
        ('APENSO', 'Apenso'),
        ('INCIDENTE', 'Incidente'),
        ('CUMPRIMENTO', 'Cumprimento de Sentença'),
        ('RECURSO', 'Recurso'),
        ('OUTRO', 'Outro'),
    ]

    case_principal = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cases_derivados',
        help_text='Se preenchido, indica que este processo é derivado e aponta para o processo principal.'
    )

    vinculo_tipo = models.CharField(
        max_length=20,
        choices=VINCULO_TIPO_CHOICES,
        blank=True,
        default='',
        help_text='Tipo do vínculo com o processo principal (somente quando case_principal está preenchido).'
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

    # ========== FINANCEIRO ==========
    participation_type = models.CharField(
        max_length=20,
        default='percentage',
        null=True,
        blank=True,
        choices=[
            ('percentage', 'Percentual'),
            ('fixed', 'Valor Fixo'),
        ],
        help_text='Tipo de participação: percentual ou valor fixo'
    )

    participation_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Percentual de participação do escritório (%)'
    )

    participation_fixed_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Valor fixo de participação do escritório (R$)'
    )

    payment_conditional = models.BooleanField(
        default=False,
        help_text='Cliente paga apenas mediante ganho de causa'
    )

    payment_terms = models.TextField(
        blank=True,
        default='',
        help_text='Condições de pagamento acordadas com o cliente'
    )

    attorney_fee_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Valor dos honorarios por parcela (R$)'
    )

    attorney_fee_installments = models.PositiveIntegerField(
        default=1,
        help_text='Quantidade de parcelas dos honorarios'
    )

    observations_financial_block_a = models.TextField(
        blank=True,
        default='',
        help_text='Observações do bloco A (Valor do Processo)'
    )

    observations_financial_block_b = models.TextField(
        blank=True,
        default='',
        help_text='Observações do bloco B (Custos e Despesas)'
    )

    # ========== CLIENTE PRINCIPAL (ATALHO) ==========
    # Campos de atalho para acesso rápido ao cliente principal.
    # Sincronizados automaticamente com CaseParty no save().
    cliente_principal = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='casos_como_cliente',
        help_text='Cliente principal deste processo (opcional - atalho para CaseParty)'
    )

    cliente_posicao = models.CharField(
        max_length=20,
        choices=[
            ('AUTOR', 'Autor/Requerente'),
            ('REU', 'Réu/Requerido'),
        ],
        blank=True,
        default='',
        help_text='Posição do cliente principal no processo (opcional)'
    )

    # ========== ORIGEM (PUBLICAÇÃO) ==========
    publicacao_origem = models.ForeignKey(
        'publications.Publication',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='casos_criados',
        db_index=True,
        help_text='Publicação a partir da qual este caso foi criado (read-only, rastreabilidade)'
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
            models.Index(fields=['owner', 'deleted', '-data_ultima_movimentacao']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'numero_processo'],
                name='unique_case_numero_per_owner'
            ),
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
    def atualizar_data_ultima_movimentacao(self):
        """
        Recalcula data_ultima_movimentacao baseado nas movimentações cadastradas.
        """
        ultima = self.movimentacoes.order_by('-data').first()
        if ultima:
            self.data_ultima_movimentacao = ultima.data
        else:
            self.data_ultima_movimentacao = None
        self.save(update_fields=['data_ultima_movimentacao'])
    
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

    def sync_cliente_principal_from_parties(self, save=True):
        """
        Sincroniza campos-atalho (cliente_principal/cliente_posicao)
        com base na parte marcada como cliente em CaseParty.
        """
        client_party = self.parties.select_related('contact').filter(is_client=True).order_by('-created_at', '-id').first()

        new_cliente_principal = client_party.contact if client_party else None
        new_cliente_posicao = client_party.role if client_party and client_party.role in {'AUTOR', 'REU'} else ''

        changed_fields = []
        new_cliente_principal_id = new_cliente_principal.id if new_cliente_principal else None

        if self.cliente_principal_id != new_cliente_principal_id:
            self.cliente_principal = new_cliente_principal
            changed_fields.append('cliente_principal')

        if self.cliente_posicao != new_cliente_posicao:
            self.cliente_posicao = new_cliente_posicao
            changed_fields.append('cliente_posicao')

        if save and changed_fields:
            self.save(update_fields=changed_fields)

        return bool(changed_fields)

    def __str__(self):
        if self.titulo:
            return f"{self.numero_processo} - {self.titulo}"
        return self.numero_processo

    def clean(self):
        super().clean()

        if self.case_principal_id is None:
            # Processo principal: não deve carregar tipo de vínculo.
            if self.vinculo_tipo:
                raise ValidationError({'vinculo_tipo': 'vinculo_tipo só pode ser preenchido quando case_principal estiver definido.'})
            return

        # Processo derivado.
        if self.pk and self.case_principal_id == self.pk:
            raise ValidationError({'case_principal': 'Um processo não pode ser principal de si mesmo.'})

        # Não permitir encadeamento: processo derivado não pode apontar para outro derivado.
        # (A -> B é ok; A -> B -> C não)
        if self.case_principal is not None and getattr(self.case_principal, 'case_principal_id', None) is not None:
            raise ValidationError({'case_principal': 'Vínculo inválido: não é permitido apontar para um processo que já é derivado.'})

        # Processo derivado não pode ser marcado como principal.
        if (self.classificacao or '').strip().upper() == 'PRINCIPAL':
            raise ValidationError({'classificacao': 'Processo derivado não pode ser classificado como Principal.'})

        if not self.vinculo_tipo:
            raise ValidationError({'vinculo_tipo': 'vinculo_tipo é obrigatório quando case_principal estiver definido.'})

        # Evitar ciclos (A -> B -> ... -> A)
        cursor = self.case_principal
        visited = set()
        while cursor is not None:
            if cursor.pk is None:
                break
            if cursor.pk in visited:
                # Cycle already present in DB (defensive).
                break
            visited.add(cursor.pk)
            if self.pk and cursor.pk == self.pk:
                raise ValidationError({'case_principal': 'Vínculo inválido: criaria um ciclo de processos.'})
            cursor = cursor.case_principal

    def save(self, *args, **kwargs):
        # Auto-preencher numero_processo_unformatted
        if self.numero_processo:
            self.numero_processo_unformatted = ''.join(filter(str.isdigit, self.numero_processo))

        # Normalização do vínculo: se não houver principal, zera vinculo_tipo.
        if not self.case_principal_id and self.vinculo_tipo:
            self.vinculo_tipo = ''
        
        super().save(*args, **kwargs)
        
        # Auto-sincronizar cliente_principal com CaseParty
        if self.cliente_principal and self.cliente_posicao:
            CaseParty.objects.update_or_create(
                case=self,
                contact=self.cliente_principal,
                defaults={
                    'role': self.cliente_posicao,
                    'is_client': True,
                    'observacoes': 'Cliente principal (sincronizado automaticamente)'
                }
            )


class CaseTipoAcaoOption(models.Model):
    """Opções compartilhadas (persistidas) para o campo `Case.tipo_acao`.

    Permite cadastrar novos tipos/descrições (ex: "Ação De Cobrança") e
    disponibilizar para todos os usuários na mesma instância.
    """

    label = models.CharField(max_length=100, help_text='Texto exibido na lista')
    key = models.CharField(
        max_length=140,
        unique=True,
        db_index=True,
        help_text='Chave normalizada (sem acento, minúscula, espaços colapsados) para deduplicação',
    )

    is_active = models.BooleanField(default=True, db_index=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tipo_acao_options',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Opção de Tipo de Ação'
        verbose_name_plural = 'Opções de Tipo de Ação'
        ordering = ['label']

    @staticmethod
    def normalize_key(value: str) -> str:
        raw = str(value or '').strip()
        if not raw:
            return ''
        nfd = unicodedata.normalize('NFD', raw)
        no_marks = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
        collapsed = ' '.join(no_marks.split())
        return collapsed.lower()

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.normalize_key(self.label)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.label


class CaseTituloOption(models.Model):
    """Opções compartilhadas (persistidas) para o campo `Case.titulo`.

    Serve como lista de sugestões de títulos padronizados que evolui com o uso.
    Diferente de `tipo_acao`, o `titulo` continua sendo texto livre no Case.
    """

    label = models.CharField(max_length=200, help_text='Texto exibido na lista')
    key = models.CharField(
        max_length=260,
        unique=True,
        db_index=True,
        help_text='Chave normalizada (sem acento, minúscula, espaços colapsados) para deduplicação',
    )

    is_active = models.BooleanField(default=True, db_index=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_titulo_options',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Opção de Título do Processo'
        verbose_name_plural = 'Opções de Título do Processo'
        ordering = ['label']

    @staticmethod
    def normalize_key(value: str) -> str:
        raw = str(value or '').strip()
        if not raw:
            return ''
        nfd = unicodedata.normalize('NFD', raw)
        no_marks = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
        collapsed = ' '.join(no_marks.split())
        return collapsed.lower()

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.normalize_key(self.label)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.label


class CasePartyRoleOption(models.Model):
    """Opções compartilhadas (persistidas) para o campo `CaseParty.role`.

    Mantém uma lista evolutiva de papéis (ex: "Assistente Técnico") para uso
    no cadastro de partes. Diferente das opções padrão (choices), estas opções
    são editáveis e podem ser renomeadas.
    """

    label = models.CharField(max_length=100, help_text='Texto exibido na lista')
    key = models.CharField(
        max_length=140,
        unique=True,
        db_index=True,
        help_text='Chave normalizada (sem acento, minúscula, espaços colapsados) para deduplicação',
    )

    is_active = models.BooleanField(default=True, db_index=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_party_role_options',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Opção de Papel da Parte'
        verbose_name_plural = 'Opções de Papel da Parte'
        ordering = ['label']

    @staticmethod
    def normalize_key(value: str) -> str:
        raw = str(value or '').strip()
        if not raw:
            return ''
        nfd = unicodedata.normalize('NFD', raw)
        no_marks = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
        collapsed = ' '.join(no_marks.split())
        return collapsed.lower()

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.normalize_key(self.label)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.label


class CaseVinculoTipoOption(models.Model):
    """Opções compartilhadas (persistidas) para o campo `Case.vinculo_tipo`.

    Mantém uma lista evolutiva de tipos de vínculo (ex: "Apenso", "Incidente")
    para uso no relacionamento principal/derivado.
    """

    label = models.CharField(max_length=100, help_text='Texto exibido na lista')
    key = models.CharField(
        max_length=140,
        unique=True,
        db_index=True,
        help_text='Chave normalizada (sem acento, minúscula, espaços colapsados) para deduplicação',
    )

    is_active = models.BooleanField(default=True, db_index=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_vinculo_tipo_options',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Opção de Tipo de Vínculo'
        verbose_name_plural = 'Opções de Tipos de Vínculo'
        ordering = ['label']

    @staticmethod
    def normalize_key(value: str) -> str:
        raw = str(value or '').strip()
        if not raw:
            return ''
        nfd = unicodedata.normalize('NFD', raw)
        no_marks = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
        collapsed = ' '.join(no_marks.split())
        return collapsed.lower()

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.normalize_key(self.label)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.label


class CaseRepresentationTypeOption(models.Model):
    """Opções compartilhadas (persistidas) para o campo `CaseRepresentation.representation_type`.

    Mantém uma lista evolutiva de tipos de representação (ex: "Procurador", "Responsável")
    para uso no cadastro de representante do cliente.
    """

    label = models.CharField(max_length=100, help_text='Texto exibido na lista')
    key = models.CharField(
        max_length=140,
        unique=True,
        db_index=True,
        help_text='Chave normalizada (sem acento, minúscula, espaços colapsados) para deduplicação',
    )

    is_active = models.BooleanField(default=True, db_index=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_representation_type_options',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Opção de Tipo de Representação'
        verbose_name_plural = 'Opções de Tipo de Representação'
        ordering = ['label']

    @staticmethod
    def normalize_key(value: str) -> str:
        raw = str(value or '').strip()
        if not raw:
            return ''
        nfd = unicodedata.normalize('NFD', raw)
        no_marks = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
        collapsed = ' '.join(no_marks.split())
        return collapsed.lower()

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.normalize_key(self.label)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.label


class CaseRepresentation(models.Model):
    """Representação do cliente em um processo.

    Registra a relação entre um contato representado (cliente do processo) e
    um contato representante/responsável, com um tipo livre (sugerido por opções).
    """

    case = models.ForeignKey(
        'Case',
        on_delete=models.CASCADE,
        related_name='representations',
    )

    represented_contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        related_name='case_representations_as_represented',
        help_text='Contato representado (normalmente o cliente do processo)',
    )

    representative_contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        related_name='case_representations_as_representative',
        help_text='Contato representante/responsável no contexto deste processo',
    )

    representation_type = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Tipo de representação (texto livre; pode vir da lista de opções)',
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_case_representations',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Representação no Processo'
        verbose_name_plural = 'Representações no Processo'
        constraints = [
            models.UniqueConstraint(
                fields=['case', 'represented_contact'],
                name='unique_representation_per_case_and_represented_contact',
            ),
            models.CheckConstraint(
                check=~Q(represented_contact=models.F('representative_contact')),
                name='case_representation_no_self_representation',
            ),
        ]

    def __str__(self):
        try:
            case_label = self.case.numero_processo
        except Exception:
            case_label = ''
        return f"{self.represented_contact_id} -> {self.representative_contact_id} ({case_label})"


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
        max_length=100,
        choices=CASE_PARTY_ROLE_CHOICES,
        default='CLIENTE',
        help_text='Papel da parte no processo'
    )

    is_client = models.BooleanField(
        default=False,
        help_text='Indica se este contato é o cliente do escritório neste processo'
    )

    observacoes = models.TextField(
        blank=True,
        help_text='Observações sobre a participação dessa parte'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('case', 'contact')
        constraints = [
            models.UniqueConstraint(
                fields=['case'],
                condition=Q(is_client=True),
                name='unique_client_party_per_case',
            ),
        ]
        verbose_name = 'Parte do Processo'
        verbose_name_plural = 'Partes do Processo'

    def __str__(self):
        return f"{self.contact.name} - {self.get_role_display()} ({self.case.numero_processo})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.case_id:
            self.case.sync_cliente_principal_from_parties(save=True)

    def delete(self, *args, **kwargs):
        case = self.case
        super().delete(*args, **kwargs)
        if case:
            case.sync_cliente_principal_from_parties(save=True)


class CaseLink(models.Model):
    """Vínculos flexíveis entre processos.

    Complementa o atalho `Case.case_principal`.
    Permite múltiplos vínculos por processo (apenso, recurso, incidente, etc.),
    com tipo, observação e data.
    """

    from_case = models.ForeignKey(
        'Case',
        on_delete=models.CASCADE,
        related_name='links_out',
        help_text='Processo de origem do vínculo'
    )

    to_case = models.ForeignKey(
        'Case',
        on_delete=models.CASCADE,
        related_name='links_in',
        help_text='Processo de destino do vínculo'
    )

    link_type = models.CharField(
        max_length=20,
        choices=Case.VINCULO_TIPO_CHOICES,
        help_text='Tipo do vínculo'
    )

    link_date = models.DateField(
        null=True,
        blank=True,
        help_text='Data do vínculo (quando aplicável)'
    )

    notes = models.TextField(
        blank=True,
        default='',
        help_text='Observação/justificativa do vínculo'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_case_links',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Vínculo entre Processos'
        verbose_name_plural = 'Vínculos entre Processos'
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                check=~Q(from_case=models.F('to_case')),
                name='case_link_no_self_link',
            ),
            models.UniqueConstraint(
                fields=['from_case', 'to_case', 'link_type'],
                name='unique_case_link_per_type',
            ),
        ]
        indexes = [
            models.Index(fields=['from_case', 'to_case']),
            models.Index(fields=['link_type']),
        ]

    def __str__(self):
        return f"{self.from_case_id} -> {self.to_case_id} ({self.link_type})"

    def clean(self):
        super().clean()

        if self.from_case_id and self.to_case_id and self.from_case_id == self.to_case_id:
            raise ValidationError({'to_case': 'Um processo não pode ser vinculado a si mesmo.'})

        # Regra de segurança/escopo: processos de owners diferentes não devem ser vinculados.
        if self.from_case_id and self.to_case_id:
            from_owner_id = getattr(self.from_case, 'owner_id', None)
            to_owner_id = getattr(self.to_case, 'owner_id', None)
            if from_owner_id != to_owner_id:
                raise ValidationError({'to_case': 'Não é permitido vincular processos de responsáveis/escopos diferentes.'})

        # Evitar ciclos no grafo de vínculos direcionados.
        # Se já existe caminho to_case -> ... -> from_case, adicionar from_case -> to_case criaria ciclo.
        if not self.from_case_id or not self.to_case_id:
            return

        from_id = self.from_case_id
        target_id = from_id
        frontier = {self.to_case_id}
        visited = set()

        # Exclui self em updates.
        base_qs = CaseLink.objects.all()
        if self.pk:
            base_qs = base_qs.exclude(pk=self.pk)

        while frontier:
            if target_id in frontier:
                raise ValidationError({'to_case': 'Vínculo inválido: criaria um ciclo entre processos.'})

            visited |= frontier

            next_ids = set(
                base_qs.filter(from_case_id__in=frontier).values_list('to_case_id', flat=True)
            )
            frontier = next_ids - visited


class CaseMovement(models.Model):
    """
    Movimentações processuais - despachos, decisões, audiências, publicações.
    Cada registro representa um evento/movimentação no processo.
    """
    
    case = models.ForeignKey(
        'Case',
        on_delete=models.CASCADE,
        related_name='movimentacoes',
        help_text='Processo ao qual esta movimentação pertence'
    )
    
    # ========== DADOS PRINCIPAIS ==========
    data = models.DateField(
        db_index=True,
        help_text='Data da movimentação/publicação'
    )
    
    tipo = models.CharField(
        max_length=30,
        db_index=True,
        choices=[
            ('DESPACHO', 'Despacho'),
            ('DECISAO', 'Decisão Interlocutória'),
            ('SENTENCA', 'Sentença'),
            ('ACORDAO', 'Acórdão'),
            ('AUDIENCIA', 'Audiência'),
            ('JUNTADA', 'Juntada de Documento'),
            ('INTIMACAO', 'Intimação'),
            ('CITACAO', 'Citação'),
            ('CONCLUSAO', 'Conclusos'),
            ('RECURSO', 'Recurso'),
            ('PETICAO', 'Petição Protocolada'),
            ('OUTROS', 'Outros'),
        ],
        default='OUTROS',
        help_text='Tipo de movimentação'
    )
    
    # ========== DESCRIÇÃO ==========
    titulo = models.CharField(
        max_length=200,
        help_text='Resumo breve da movimentação (ex: "Audiência de conciliação designada")'
    )
    
    descricao = models.TextField(
        blank=True,
        default='',
        help_text='Descrição completa/observações detalhadas da movimentação'
    )
    
    # ========== PRAZOS ==========
    prazo = models.IntegerField(
        null=True,
        blank=True,
        help_text='Prazo em dias (se aplicável)'
    )
    
    data_limite_prazo = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Data limite calculada (data + prazo)'
    )
    
    completed = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Marca se o prazo foi resolvido/concluído'
    )
    
    # ========== ORIGEM ==========
    origem = models.CharField(
        max_length=20,
        choices=[
            ('MANUAL', 'Cadastro Manual'),
            ('DJE', 'Importado do DJE'),
            ('ESAJ', 'Importado do e-SAJ'),
            ('PJE', 'Importado do PJE'),
        ],
        default='MANUAL',
        help_text='Origem/fonte da movimentação'
    )
    
    # ========== METADADOS ==========
    publicacao_id = models.IntegerField(
        null=True,
        blank=True,
        help_text='ID da publicação original (se veio de importação)'
    )
    
    # ========== TIMESTAMPS ==========
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-data', '-created_at']
        verbose_name = 'Movimentação Processual'
        verbose_name_plural = 'Movimentações Processuais'
        indexes = [
            models.Index(fields=['case', '-data']),
            models.Index(fields=['-data']),
            models.Index(fields=['tipo', '-data']),
        ]
    
    def __str__(self):
        return f"{self.case.numero_processo} - {self.get_tipo_display()} ({self.data})"
    
    def save(self, *args, **kwargs):
        # Calcular data_limite_prazo automaticamente
        if self.prazo and self.data:
            from datetime import timedelta
            self.data_limite_prazo = self.data + timedelta(days=self.prazo)
        
        super().save(*args, **kwargs)
        
        # Atualizar data_ultima_movimentacao do Case
        self.atualizar_data_case()
    
    def delete(self, *args, **kwargs):
        case = self.case
        super().delete(*args, **kwargs)
        # Recalcular após deletar
        case.atualizar_data_ultima_movimentacao()
    
    def atualizar_data_case(self):
        """Atualiza data_ultima_movimentacao do processo pai."""
        ultima = self.case.movimentacoes.order_by('-data').first()
        if ultima:
            self.case.data_ultima_movimentacao = ultima.data
            self.case.save(update_fields=['data_ultima_movimentacao'])
        else:
            # Se não há mais movimentações, limpa a data
            self.case.data_ultima_movimentacao = None
            self.case.save(update_fields=['data_ultima_movimentacao'])


class CasePrazo(models.Model):
    """
    Prazo processual vinculado a uma movimentação.
    Permite múltiplos prazos por movimentação (ex: 15 dias + 30 dias + 45 dias).
    """
    
    movimentacao = models.ForeignKey(
        CaseMovement,
        on_delete=models.CASCADE,
        related_name='prazos',
        help_text='Movimentação que gerou este prazo'
    )
    
    prazo_dias = models.IntegerField(
        help_text='Número de dias do prazo (ex: 15, 30, 45)'
    )
    
    data_limite = models.DateField(
        db_index=True,
        help_text='Data limite calculada (data movimentação + prazo_dias)'
    )
    
    descricao = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Descrição/motivo do prazo (ex: Manifestação, Recurso, Contrarrazões)'
    )
    
    completed = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Se True, prazo foi concluído e sai do sistema de notificações'
    )
    
    # ========== TIMESTAMPS ==========
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['data_limite']
        verbose_name = 'Prazo Processual'
        verbose_name_plural = 'Prazos Processuais'
        indexes = [
            models.Index(fields=['movimentacao', 'data_limite']),
            models.Index(fields=['data_limite', 'completed']),
        ]
    
    def __str__(self):
        return f"{self.movimentacao.case.numero_processo} - {self.prazo_dias} dias ({self.data_limite})"
    
    def save(self, *args, **kwargs):
        # Calcular data_limite automaticamente se não foi definida
        if not self.data_limite and self.movimentacao:
            from datetime import timedelta
            self.data_limite = self.movimentacao.data + timedelta(days=self.prazo_dias)
        
        super().save(*args, **kwargs)
    
    @property
    def dias_restantes(self):
        """Retorna quantidade de dias até o vencimento (negativo se vencido)"""
        from django.utils import timezone
        hoje = timezone.now().date()
        delta = self.data_limite - hoje
        return delta.days
    
    @property
    def status_urgencia(self):
        """Retorna status baseado nos dias restantes (padrão jurídico 15/7/3)"""
        if self.completed:
            return 'CONCLUIDO'
        
        dias = self.dias_restantes
        if dias < 0:
            return 'VENCIDO'
        elif dias <= 3:
            return 'URGENTISSIMO'
        elif dias <= 7:
            return 'URGENTE'
        else:
            return 'NORMAL'


class CaseTask(models.Model):
    """
    Tarefas operacionais vinculadas ao processo.
    Podem estar vinculadas a uma movimentação específica ou serem "soltas" do caso.
    """

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text='Processo relacionado à tarefa'
    )

    movimentacao = models.ForeignKey(
        CaseMovement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        help_text='Movimentação de origem (opcional)'
    )

    titulo = models.CharField(
        max_length=255,
        help_text='Título curto da tarefa'
    )

    descricao = models.TextField(
        blank=True,
        default='',
        help_text='Descrição detalhada da tarefa'
    )

    urgencia = models.CharField(
        max_length=20,
        choices=[
            ('NORMAL', 'Prazo Normal'),
            ('URGENTE', 'Prazo Urgente'),
            ('URGENTISSIMO', 'Prazo Urgentíssimo'),
        ],
        default='NORMAL',
        db_index=True,
        help_text='Nível de urgência da tarefa'
    )

    data_vencimento = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Data limite da tarefa (auto-calculada se não informada)'
    )

    hora_vencimento = models.TimeField(
        null=True,
        blank=True,
        help_text='Hora limite da tarefa (opcional)'
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDENTE', 'Pendente'),
            ('EM_ANDAMENTO', 'Em andamento'),
            ('CONCLUIDA', 'Concluída'),
            ('CANCELADA', 'Cancelada'),
        ],
        default='PENDENTE',
        db_index=True,
        help_text='Status de execução da tarefa'
    )

    concluida_em = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Quando a tarefa foi concluída'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['data_vencimento', '-created_at']
        verbose_name = 'Tarefa do Processo'
        verbose_name_plural = 'Tarefas do Processo'
        indexes = [
            models.Index(fields=['case', 'status']),
            models.Index(fields=['urgencia', 'data_vencimento']),
            models.Index(fields=['movimentacao']),
        ]

    def __str__(self):
        return f"{self.case.numero_processo} - {self.titulo}"

    @property
    def cor_urgencia(self):
        cores = {
            'NORMAL': 'green',
            'URGENTE': 'orange',
            'URGENTISSIMO': 'red',
        }
        return cores.get(self.urgencia, 'green')

    @property
    def vencida(self):
        if not self.data_vencimento or self.status == 'CONCLUIDA':
            return False
        return self.data_vencimento < timezone.now().date()

    def _get_urgency_days(self):
        system_settings = getattr(settings, 'LEGAL_SYSTEM_SETTINGS', {})

        normal = int(system_settings.get('TASK_NORMAL_DAYS', 15))
        urgent = int(system_settings.get('TASK_URGENT_DAYS', 7))
        urgentissimo = int(system_settings.get('TASK_URGENTISSIMO_DAYS', 3))

        if not (normal > urgent > urgentissimo):
            return {
                'NORMAL': 15,
                'URGENTE': 7,
                'URGENTISSIMO': 3,
            }

        return {
            'NORMAL': normal,
            'URGENTE': urgent,
            'URGENTISSIMO': urgentissimo,
        }

    def save(self, *args, **kwargs):
        if not self.data_vencimento:
            urgency_days = self._get_urgency_days()
            days = urgency_days.get(self.urgencia, 15)

            base_date = timezone.now().date()
            if self.movimentacao and self.movimentacao.data:
                base_date = self.movimentacao.data

            from datetime import timedelta
            self.data_vencimento = base_date + timedelta(days=days)

        if self.status == 'CONCLUIDA' and not self.concluida_em:
            self.concluida_em = timezone.now()
        elif self.status != 'CONCLUIDA' and self.concluida_em:
            self.concluida_em = None

        super().save(*args, **kwargs)


class Payment(models.Model):
    """
    Recebimento de honorários do cliente.
    Registra pagamentos recebidos pelo escritório.
    """
    
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text='Processo relacionado'
    )
    
    date = models.DateField(
        help_text='Data do recebimento'
    )
    
    description = models.CharField(
        max_length=255,
        help_text='Descrição do recebimento (ex: Honorários - Parcela 1/3)'
    )
    
    value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text='Valor recebido em R$'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Recebimento'
        verbose_name_plural = 'Recebimentos'
        indexes = [
            models.Index(fields=['case', '-date']),
            models.Index(fields=['-date']),
        ]
    
    def __str__(self):
        return f"{self.case.numero_processo} - R$ {self.value:.2f} ({self.date})"


class Expense(models.Model):
    """
    Despesa/custos do processo.
    Registra gastos do escritório (custas, perícias, etc).
    """
    
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='expenses',
        help_text='Processo relacionado'
    )
    
    date = models.DateField(
        help_text='Data da despesa'
    )
    
    description = models.CharField(
        max_length=255,
        help_text='Descrição da despesa (ex: Custas processuais, Honorários perito)'
    )
    
    value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text='Valor da despesa em R$'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Despesa'
        verbose_name_plural = 'Despesas'
        indexes = [
            models.Index(fields=['case', '-date']),
            models.Index(fields=['-date']),
        ]
    
    def __str__(self):
        return f"{self.case.numero_processo} - R$ {self.value:.2f} ({self.date})"

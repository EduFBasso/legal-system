from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
from django.conf import settings


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

    # ========== FINANCEIRO ==========
    participation_type = models.CharField(
        max_length=20,
        default='percentage',
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

    def __str__(self):
        if self.titulo:
            return f"{self.numero_processo} - {self.titulo}"
        return self.numero_processo

    def save(self, *args, **kwargs):
        # Auto-preencher numero_processo_unformatted
        if self.numero_processo:
            self.numero_processo_unformatted = ''.join(filter(str.isdigit, self.numero_processo))
        
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
        verbose_name = 'Parte do Processo'
        verbose_name_plural = 'Partes do Processo'

    def __str__(self):
        return f"{self.contact.name} - {self.get_role_display()} ({self.case.numero_processo})"


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

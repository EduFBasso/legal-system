"""Serializers for Cases app"""
import unicodedata
from datetime import date
from rest_framework import serializers
from apps.contacts.models import Contact
from .models import (
    Case,
    CaseParty,
    CaseLink,
    CaseMovement,
    CasePrazo,
    CaseTask,
    Payment,
    Expense,
    CaseDocument,
    CaseRepresentation,
)


def normalize_text(text):
    """Remove acentos e diacríticos do texto para normalizar"""
    if not text:
        return text
    # NFD decomposição (separa base + acentos)
    nfd = unicodedata.normalize('NFD', text)
    # Remove marcas diacríticas (categoria Mn = Mark, Nonspacing)
    return ''.join(char for char in nfd if unicodedata.category(char) != 'Mn')


class CasePrazoSerializer(serializers.ModelSerializer):
    """Serializer for CasePrazo (prazos processuais)"""
    dias_restantes = serializers.IntegerField(read_only=True)
    status_urgencia = serializers.CharField(read_only=True)
    
    class Meta:
        model = CasePrazo
        fields = [
            'id',
            'movimentacao',
            'prazo_dias',
            'data_limite',
            'descricao',
            'completed',
            'dias_restantes',
            'status_urgencia',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'data_limite', 'dias_restantes', 'status_urgencia', 'created_at', 'updated_at']


class CaseMovementSerializer(serializers.ModelSerializer):
    """Serializer for CaseMovement"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    origem_display = serializers.CharField(source='get_origem_display', read_only=True)
    tasks_count = serializers.SerializerMethodField()
    orgao = serializers.SerializerMethodField()
    publication_data = serializers.SerializerMethodField()
    prazos = CasePrazoSerializer(many=True, read_only=True)
    
    class Meta:
        model = CaseMovement
        fields = [
            'id',
            'case',
            'data',
            'tipo',
            'tipo_display',
            'titulo',
            'descricao',
            'prazo',
            'data_limite_prazo',
            'completed',
            'origem',
            'origem_display',
            'publicacao_id',
            'orgao',
            'publication_data',
            'prazos',
            'tasks_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'data_limite_prazo', 'created_at', 'updated_at', 'orgao', 'publication_data', 'prazos']
    
    def validate_data(self, value):
        """Movimentações registram eventos passados — data futura não é permitida."""
        if value > date.today():
            raise serializers.ValidationError(
                'A data da movimentação não pode ser futura.'
            )
        return value

    def get_tasks_count(self, obj):
        """Retorna a quantidade de tarefas vinculadas a esta movimentação"""
        return obj.tasks.count()
    
    def get_orgao(self, obj):
        """Retorna o órgão da publicação associada, normalizado (sem acentos)"""
        if obj.publicacao_id:
            try:
                from apps.publications.models import Publication
                # publicacao_id armazena id_api, não pk
                publication = Publication.objects.get(id_api=obj.publicacao_id)
                if publication.orgao:
                    # Normalizar: remover acentos e diacríticos
                    return normalize_text(publication.orgao)
                return None
            except:
                return None
        return None

    def get_publication_data(self, obj):
        """Retorna metadados da publicação de origem para renderização do card automático."""
        if not obj.publicacao_id:
            return None

        try:
            from apps.publications.models import Publication
            publication = Publication.objects.get(id_api=obj.publicacao_id)
            meio_map = {
                'D': 'Digital',
                'F': 'Físico',
            }

            return {
                'exists': True,
                'id_api': publication.id_api,
                'numero_processo': publication.numero_processo,
                'tribunal': publication.tribunal,
                'data_disponibilizacao': publication.data_disponibilizacao,
                'orgao': publication.orgao,
                'meio': publication.meio,
                'meio_display': meio_map.get((publication.meio or '').upper(), publication.meio or '-'),
                'link_oficial': publication.link_oficial,
                'texto_completo': publication.texto_completo,
            }
        except Exception:
            return {
                'exists': False,
                'id_api': obj.publicacao_id,
            }
    
    def validate_data(self, value):
        """Validate that data is not in the future"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if value > today:
            raise serializers.ValidationError(
                "A data da movimentação não pode ser futura. "
                "Movimentações registram eventos que já ocorreram."
            )
        
        return value


class CaseTaskSerializer(serializers.ModelSerializer):
    """Serializer for CaseTask (tarefas vinculadas ao processo)"""

    urgencia_display = serializers.CharField(source='get_urgencia_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    case_numero = serializers.CharField(source='case.numero_processo', read_only=True)
    movimentacao_titulo = serializers.CharField(source='movimentacao.titulo', read_only=True)
    cor_urgencia = serializers.ReadOnlyField()
    vencida = serializers.ReadOnlyField()

    class Meta:
        model = CaseTask
        fields = [
            'id',
            'case',
            'case_numero',
            'movimentacao',
            'movimentacao_titulo',
            'titulo',
            'descricao',
            'urgencia',
            'urgencia_display',
            'cor_urgencia',
            'data_vencimento',
            'status',
            'status_display',
            'vencida',
            'concluida_em',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'concluida_em', 'created_at', 'updated_at']

    def validate(self, attrs):
        case = attrs.get('case') or getattr(self.instance, 'case', None)
        movimentacao = attrs.get('movimentacao') or getattr(self.instance, 'movimentacao', None)

        if movimentacao and case and movimentacao.case_id != case.id:
            raise serializers.ValidationError(
                'A movimentação informada não pertence ao processo selecionado.'
            )

        return attrs


class CasePartySerializer(serializers.ModelSerializer):
    """Serializer for CaseParty through model with nested contact info"""
    # Nested contact data (read-only)
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    contact_document = serializers.CharField(source='contact.document_number', read_only=True)
    contact_person_type = serializers.CharField(source='contact.person_type', read_only=True)
    contact_phone = serializers.CharField(source='contact.mobile', read_only=True)
    contact_email = serializers.CharField(source='contact.email', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    # Allow saving custom roles (outside Django choices) while keeping display mapping for known ones.
    role = serializers.CharField(required=False, allow_blank=True)

    # Representation (write-only). If `is_represented=True`, representative + type become required.
    is_represented = serializers.BooleanField(write_only=True, required=False)
    representative_contact = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    representation_type = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = CaseParty
        fields = [
            'id',
            'case',
            'contact',
            'contact_name',
            'contact_document',
            'contact_person_type',
            'contact_phone',
            'contact_email',
            'role',
            'role_display',
            'is_client',
            'observacoes',
            'is_represented',
            'representative_contact',
            'representation_type',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        """
        Validação de negócio: um processo só pode ter um cliente.
        Bloqueia tentativas de marcar múltiplos contatos como cliente no mesmo processo.
        """
        if data.get('is_client'):
            # Determinar o caso (pode vir em data ou estar sendo editado)
            case = data.get('case') or (self.instance.case if self.instance else None)
            
            # Verificar se já existe outro cliente para este processo
            existing_client_query = CaseParty.objects.filter(
                case=case,
                is_client=True
            )
            
            # Se está editando, excluir o registro atual da verificação
            if self.instance:
                existing_client_query = existing_client_query.exclude(id=self.instance.id)
            
            if existing_client_query.exists():
                raise serializers.ValidationError({
                    'is_client': 'Já existe um cliente cadastrado para este processo. Um processo só pode ter um cliente.'
                })

        # Regra de negócio: um processo só pode ter 1 AUTOR.
        incoming_role = data.get('role', None)
        if incoming_role is None and self.instance is not None:
            incoming_role = getattr(self.instance, 'role', None)
        incoming_role = (incoming_role or '').strip().upper()

        if incoming_role == 'AUTOR':
            case = data.get('case') or (self.instance.case if self.instance else None)
            if case is not None:
                existing_author_query = CaseParty.objects.filter(
                    case=case,
                    role='AUTOR',
                )
                if self.instance:
                    existing_author_query = existing_author_query.exclude(id=self.instance.id)
                if existing_author_query.exists():
                    raise serializers.ValidationError({
                        'role': 'Já existe um Autor/Requerente cadastrado para este processo. Edite o Autor existente.'
                    })

        # Representação: quando marcado como representado, exige representante + tipo.
        is_represented = data.get('is_represented', None)
        if is_represented is True:
            representative_contact = data.get('representative_contact')
            if not representative_contact:
                raise serializers.ValidationError({
                    'representative_contact': 'Representante é obrigatório quando a parte é representada.'
                })

            representation_type = (data.get('representation_type') or '').strip()
            if not representation_type:
                raise serializers.ValidationError({
                    'representation_type': 'Tipo de representação é obrigatório quando a parte é representada.'
                })

            represented_contact = data.get('contact') or getattr(self.instance, 'contact', None)
            if represented_contact and representative_contact and represented_contact.id == representative_contact.id:
                raise serializers.ValidationError({
                    'representative_contact': 'Representante não pode ser o mesmo contato do representado.'
                })
        
        return data

    def _apply_representation(self, party: CaseParty, *, is_represented, representative_contact, representation_type: str):
        if is_represented is None and representative_contact is None and not (representation_type or '').strip():
            return

        if is_represented is False:
            CaseRepresentation.objects.filter(
                case=party.case,
                represented_contact=party.contact,
            ).delete()
            return

        if is_represented is True:
            request = self.context.get('request')
            user = getattr(request, 'user', None)
            created_by = user if getattr(user, 'is_authenticated', False) else None

            CaseRepresentation.objects.update_or_create(
                case=party.case,
                represented_contact=party.contact,
                defaults={
                    'representative_contact': representative_contact,
                    'representation_type': (representation_type or '').strip(),
                    'created_by': created_by,
                },
            )

    def create(self, validated_data):
        is_represented = validated_data.pop('is_represented', None)
        representative_contact = validated_data.pop('representative_contact', None)
        representation_type = validated_data.pop('representation_type', '')

        party = super().create(validated_data)
        self._apply_representation(
            party,
            is_represented=is_represented,
            representative_contact=representative_contact,
            representation_type=representation_type,
        )
        return party

    def update(self, instance, validated_data):
        is_represented = validated_data.pop('is_represented', None)
        representative_contact = validated_data.pop('representative_contact', None)
        representation_type = validated_data.pop('representation_type', '')

        party = super().update(instance, validated_data)
        self._apply_representation(
            party,
            is_represented=is_represented,
            representative_contact=representative_contact,
            representation_type=representation_type,
        )
        return party


class CaseRepresentationSerializer(serializers.ModelSerializer):
    represented_contact_name = serializers.CharField(source='represented_contact.name', read_only=True)
    representative_contact_name = serializers.CharField(source='representative_contact.name', read_only=True)

    class Meta:
        model = CaseRepresentation
        fields = [
            'id',
            'case',
            'represented_contact',
            'represented_contact_name',
            'representative_contact',
            'representative_contact_name',
            'representation_type',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CaseLinkSerializer(serializers.ModelSerializer):
    """Serializer para vínculos flexíveis entre processos."""

    link_type_display = serializers.CharField(source='get_link_type_display', read_only=True)
    from_case_numero = serializers.CharField(source='from_case.numero_processo_formatted', read_only=True)
    to_case_numero = serializers.CharField(source='to_case.numero_processo_formatted', read_only=True)

    class Meta:
        model = CaseLink
        fields = [
            'id',
            'from_case',
            'from_case_numero',
            'to_case',
            'to_case_numero',
            'link_type',
            'link_type_display',
            'link_date',
            'notes',
            'created_by',
            'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'from_case_numero', 'to_case_numero', 'link_type_display']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)

        from_case = attrs.get('from_case', getattr(instance, 'from_case', None))
        to_case = attrs.get('to_case', getattr(instance, 'to_case', None))
        link_type = attrs.get('link_type', getattr(instance, 'link_type', None))

        obj = instance if instance is not None else CaseLink(from_case=from_case, to_case=to_case, link_type=link_type)
        obj.from_case = from_case
        obj.to_case = to_case
        obj.link_type = link_type
        obj.link_date = attrs.get('link_date', getattr(instance, 'link_date', None))
        obj.notes = attrs.get('notes', getattr(instance, 'notes', ''))
        obj.clean()
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment (Recebimentos)"""
    
    class Meta:
        model = Payment
        fields = [
            'id',
            'case',
            'date',
            'description',
            'value',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense (Despesas)"""
    
    class Meta:
        model = Expense
        fields = [
            'id',
            'case',
            'date',
            'description',
            'value',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CaseDocumentSerializer(serializers.ModelSerializer):
    """Serializer para documentos anexados ao processo."""

    file_url = serializers.SerializerMethodField(read_only=True)
    case_numero = serializers.CharField(source='case.numero_processo', read_only=True)

    class Meta:
        model = CaseDocument
        fields = [
            'id',
            'case',
            'case_numero',
            'file',
            'file_url',
            'original_name',
            'file_extension',
            'mime_type',
            'file_size',
            'tipo_documento',
            'description',
            'uploaded_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'case_numero',
            'original_name',
            'file_extension',
            'mime_type',
            'file_size',
            'uploaded_at',
            'updated_at',
        ]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def validate_file(self, value):
        allowed_extensions = {'pdf', 'xls', 'xlsx', 'doc', 'docx'}
        max_size = 25 * 1024 * 1024

        ext = value.name.split('.')[-1].lower() if '.' in value.name else ''
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                'Formato não permitido. Use: PDF, XLS, XLSX, DOC ou DOCX.'
            )

        if value.size > max_size:
            raise serializers.ValidationError('Arquivo deve ter no máximo 25MB.')

        return value


class CaseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view"""
    numero_processo_formatted = serializers.ReadOnlyField()
    dias_sem_movimentacao = serializers.ReadOnlyField()
    esta_ativo = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tribunal_display = serializers.CharField(source='get_tribunal_display', read_only=True)
    tipo_acao_display = serializers.CharField(source='get_tipo_acao_display', read_only=True)
    cliente_nome = serializers.CharField(source='cliente_principal.name', read_only=True)
    cliente_posicao_display = serializers.CharField(source='get_cliente_posicao_display', read_only=True)
    parties_summary = serializers.SerializerMethodField()
    active_tasks_count = serializers.IntegerField(read_only=True, default=0)
    total_payments = serializers.DecimalField(read_only=True, max_digits=15, decimal_places=2, allow_null=True)
    vinculo_tipo_display = serializers.CharField(source='get_vinculo_tipo_display', read_only=True)
    case_principal_numero = serializers.CharField(source='case_principal.numero_processo_formatted', read_only=True, allow_null=True)

    def get_parties_summary(self, obj):
        return [
            {
                'contact_id': p.contact_id,
                'name': p.contact.name,
                'role': p.role,
                'role_display': p.get_role_display(),
                'is_client': p.is_client,
            }
            for p in obj.parties.all()
        ]

    class Meta:
        model = Case
        fields = [
            'id',
            'numero_processo',
            'numero_processo_formatted',
            'titulo',
            'tribunal',
            'tribunal_display',
            'vara',
            'tipo_acao',
            'tipo_acao_display',
            'status',
            'status_display',
            'auto_status',
            'data_distribuicao',
            'data_ultima_movimentacao',
            'dias_sem_movimentacao',
            'esta_ativo',
            'cliente_principal',
            'cliente_nome',
            'cliente_posicao',
            'cliente_posicao_display',
            'valor_causa',
            'participation_type',
            'participation_percentage',
            'participation_fixed_value',
            'payment_conditional',
            'payment_terms',
            'attorney_fee_amount',
            'attorney_fee_installments',
            'observacoes',
            'tags',
            'case_principal',
            'case_principal_numero',
            'vinculo_tipo',
            'vinculo_tipo_display',
            'parties_summary',
            'active_tasks_count',
            'total_payments',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CaseDetailSerializer(serializers.ModelSerializer):
    """Complete serializer for detail view with all fields and relationships"""
    numero_processo_formatted = serializers.ReadOnlyField()
    dias_sem_movimentacao = serializers.ReadOnlyField()
    esta_ativo = serializers.ReadOnlyField()
    total_publicacoes = serializers.ReadOnlyField()
    publicacoes_recentes = serializers.ReadOnlyField()
    nivel_urgencia = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tribunal_display = serializers.CharField(source='get_tribunal_display', read_only=True)
    tipo_acao_display = serializers.CharField(source='get_tipo_acao_display', read_only=True)
    # Allow saving custom case types (outside Django choices) while keeping display mapping for known ones.
    tipo_acao = serializers.CharField(required=False, allow_blank=True)
    cliente_nome = serializers.CharField(source='cliente_principal.name', read_only=True)
    cliente_document = serializers.CharField(source='cliente_principal.document_number', read_only=True)
    cliente_posicao_display = serializers.CharField(source='get_cliente_posicao_display', read_only=True)
    ultima_movimentacao_resumo = serializers.SerializerMethodField()
    publicacao_origem_data = serializers.DateField(source='publicacao_origem.data_disponibilizacao', read_only=True, allow_null=True)
    publicacao_origem_tipo = serializers.CharField(source='publicacao_origem.tipo_comunicacao', read_only=True, allow_null=True)
    publicacao_origem_numero_processo = serializers.CharField(source='publicacao_origem.numero_processo', read_only=True, allow_null=True)
    publicacao_origem_id_api = serializers.IntegerField(source='publicacao_origem.id_api', read_only=True, allow_null=True)
    
    # Owner (advogado responsável)
    owner_name = serializers.CharField(source='owner.profile.full_name_oab', read_only=True, default='')
    owner_oab = serializers.CharField(source='owner.profile.oab_number', read_only=True, default='')

    vinculo_tipo_display = serializers.CharField(source='get_vinculo_tipo_display', read_only=True)
    case_principal_numero = serializers.CharField(source='case_principal.numero_processo_formatted', read_only=True, allow_null=True)

    # Nested serializer for parties
    parties = CasePartySerializer(source='caseparty_set', many=True, read_only=True)

    # Representações (cliente -> representante) no processo
    representations = CaseRepresentationSerializer(many=True, read_only=True)

    # Vínculos flexíveis (N:N) entre processos
    links_out = CaseLinkSerializer(many=True, read_only=True)
    links_in = CaseLinkSerializer(many=True, read_only=True)
    
    def get_ultima_movimentacao_resumo(self, obj):
        """
        Retorna resumo da última movimentação cadastrada.
        Prioriza descrição (que pode conter HTML) e volta a título se não houver.
        """
        ultima = obj.movimentacoes.order_by('-data').first()
        if ultima:
            # Prioriza descrição completa (pode ter HTML)
            if ultima.descricao:
                return ultima.descricao
            # Volta para título se não houver descrição
            return ultima.titulo
        return None
    
    class Meta:
        model = Case
        fields = [
            'id',
            'numero_processo',
            'numero_processo_formatted',
            'numero_processo_unformatted',
            'titulo',
            'tribunal',
            'tribunal_display',
            'vara',
            'tipo_acao',
            'tipo_acao_display',
            'status',
            'status_display',
            'auto_status',
            'data_distribuicao',
            'data_ultima_movimentacao',
            'ultima_movimentacao_resumo',
            'data_encerramento',
            'dias_sem_movimentacao',
            'esta_ativo',
            'nivel_urgencia',
            'valor_causa',
            'cliente_principal',
            'cliente_nome',
            'cliente_document',
            'cliente_posicao',
            'cliente_posicao_display',
            'observacoes',
            'tags',
            'total_publicacoes',
            'publicacoes_recentes',
            'publicacao_origem',
            'publicacao_origem_id_api',
            'publicacao_origem_data',
            'publicacao_origem_tipo',
            'publicacao_origem_numero_processo',
            'owner_name',
            'owner_oab',
            'parties',
            'representations',
            'links_out',
            'links_in',
            'case_principal',
            'case_principal_numero',
            'vinculo_tipo',
            'vinculo_tipo_display',
            'participation_type',
            'participation_percentage',
            'participation_fixed_value',
            'payment_conditional',
            'payment_terms',
            'attorney_fee_amount',
            'attorney_fee_installments',
            'observations_financial_block_a',
            'observations_financial_block_b',
            'deleted',
            'deleted_at',
            'deleted_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'numero_processo_unformatted',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        """Aplica validações do model (principal/derivado) também via DRF."""
        instance = getattr(self, 'instance', None)

        case_principal = attrs.get('case_principal', getattr(instance, 'case_principal', None))
        vinculo_tipo = attrs.get('vinculo_tipo', getattr(instance, 'vinculo_tipo', ''))

        # Monta um objeto temporário para rodar `clean()`.
        obj = instance if instance is not None else Case(**{})
        if instance is None:
            for k, v in attrs.items():
                setattr(obj, k, v)
        else:
            obj.case_principal = case_principal
            obj.vinculo_tipo = vinculo_tipo

        obj.case_principal = case_principal
        obj.vinculo_tipo = vinculo_tipo
        obj.clean()
        return attrs
    
    def validate_numero_processo(self, value):
        """Validate CNJ number format"""
        import re
        if value:
            # CNJ pattern: 0000000-00.0000.0.00.0000
            pattern = r'^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$'
            if not re.match(pattern, value):
                raise serializers.ValidationError(
                    "Formato inválido. Use: 0000000-00.0000.0.00.0000 (CNJ)"
                )
        return value
    
    def validate_data_encerramento(self, value):
        """Validate that data_encerramento is not before data_distribuicao"""
        if value:
            data_distribuicao = self.initial_data.get('data_distribuicao')
            if data_distribuicao and value < data_distribuicao:
                raise serializers.ValidationError(
                    "Data de encerramento não pode ser anterior à data de distribuição"
                )
        return value

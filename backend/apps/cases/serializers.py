"""Serializers for Cases app"""
import unicodedata
from datetime import date
from rest_framework import serializers
from .models import Case, CaseParty, CaseMovement, CasePrazo, CaseTask, Payment, Expense, CaseDocument


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
        
        return data


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

    def get_parties_summary(self, obj):
        return [
            {
                'name': p.contact.name,
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
            'comarca',
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
            'parties_summary',
            'active_tasks_count',
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
    cliente_nome = serializers.CharField(source='cliente_principal.name', read_only=True)
    cliente_document = serializers.CharField(source='cliente_principal.document_number', read_only=True)
    cliente_posicao_display = serializers.CharField(source='get_cliente_posicao_display', read_only=True)
    ultima_movimentacao_resumo = serializers.SerializerMethodField()
    publicacao_origem_data = serializers.DateField(source='publicacao_origem.data_disponibilizacao', read_only=True, allow_null=True)
    publicacao_origem_tipo = serializers.CharField(source='publicacao_origem.tipo_comunicacao', read_only=True, allow_null=True)
    publicacao_origem_numero_processo = serializers.CharField(source='publicacao_origem.numero_processo', read_only=True, allow_null=True)
    
    # Owner (advogado responsável)
    owner_name = serializers.CharField(source='owner.profile.full_name_oab', read_only=True, default='')
    owner_oab = serializers.CharField(source='owner.profile.oab_number', read_only=True, default='')

    # Nested serializer for parties
    parties = CasePartySerializer(source='caseparty_set', many=True, read_only=True)
    
    def get_ultima_movimentacao_resumo(self, obj):
        """
        Retorna resumo da última movimentação cadastrada.
        """
        ultima = obj.movimentacoes.order_by('-data').first()
        if ultima:
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
            'comarca',
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
            'publicacao_origem_data',
            'publicacao_origem_tipo',
            'publicacao_origem_numero_processo',
            'owner_name',
            'owner_oab',
            'parties',
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

"""
Serializers for Cases app
"""
from rest_framework import serializers
from .models import Case, CaseParty, CaseMovement


class CaseMovementSerializer(serializers.ModelSerializer):
    """Serializer for CaseMovement"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    origem_display = serializers.CharField(source='get_origem_display', read_only=True)
    
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
            'origem',
            'origem_display',
            'publicacao_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'data_limite_prazo', 'created_at', 'updated_at']
    
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
            'observacoes',
            'tags',
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
            'parties',
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

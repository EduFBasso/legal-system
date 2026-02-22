"""
Serializers for Cases app
"""
from rest_framework import serializers
from .models import Case, CaseParty


class CasePartySerializer(serializers.ModelSerializer):
    """Serializer for CaseParty through model"""
    contact_name = serializers.CharField(source='contact.nome', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = CaseParty
        fields = [
            'id',
            'contact',
            'contact_name',
            'role',
            'role_display',
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
            'status',
            'status_display',
            'auto_status',
            'data_distribuicao',
            'data_ultima_movimentacao',
            'dias_sem_movimentacao',
            'esta_ativo',
            'parte_contraria',
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
    
    # Nested serializer for parties
    parties = CasePartySerializer(source='caseparty_set', many=True, read_only=True)
    
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
            'status',
            'status_display',
            'auto_status',
            'data_distribuicao',
            'data_ultima_movimentacao',
            'data_encerramento',
            'dias_sem_movimentacao',
            'esta_ativo',
            'nivel_urgencia',
            'valor_causa',
            'parte_contraria',
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

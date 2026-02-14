"""
Serializers para API REST do app de contatos.
"""
from rest_framework import serializers
from .models import Contact


class ContactListSerializer(serializers.ModelSerializer):
    """
    Serializer para lista de contatos (sidebar).
    Retorna apenas dados essenciais para exibição no mini-card.
    """
    contact_type_display = serializers.CharField(source='get_contact_type_display', read_only=True)
    person_type_display = serializers.CharField(source='get_person_type_display', read_only=True)
    document_formatted = serializers.CharField(read_only=True)
    primary_contact = serializers.CharField(read_only=True)
    has_contact_info = serializers.BooleanField(read_only=True)
    
    # Foto em tamanho pequeno para o card (thumbnail)
    photo_thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Contact
        fields = [
            'id',
            'name',
            'contact_type',
            'contact_type_display',
            'person_type',
            'person_type_display',
            'document_number',
            'document_formatted',
            'primary_contact',
            'has_contact_info',
            'photo',
            'photo_thumbnail',
        ]
    
    def get_photo_thumbnail(self, obj):
        """
        Retorna URL da foto para thumbnail (40x40px no card).
        Se não tiver foto, retorna None (frontend exibe ícone padrão).
        """
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class ContactDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para detalhes completos do contato (modal de visualização).
    Retorna todos os campos + properties calculadas.
    """
    contact_type_display = serializers.CharField(source='get_contact_type_display', read_only=True)
    person_type_display = serializers.CharField(source='get_person_type_display', read_only=True)
    document_formatted = serializers.CharField(read_only=True)
    primary_contact = serializers.CharField(read_only=True)
    has_contact_info = serializers.BooleanField(read_only=True)
    has_complete_address = serializers.BooleanField(read_only=True)
    address_oneline = serializers.CharField(read_only=True)
    
    # Foto em tamanho grande para o modal (200x200px)
    photo_large = serializers.SerializerMethodField()
    
    class Meta:
        model = Contact
        fields = [
            'id',
            'contact_type',
            'contact_type_display',
            'person_type',
            'person_type_display',
            'name',
            'document_number',
            'document_formatted',
            'photo',
            'photo_large',
            'email',
            'phone',
            'mobile',
            'primary_contact',
            'has_contact_info',
            'zip_code',
            'street',
            'number',
            'complement',
            'neighborhood',
            'city',
            'state',
            'has_complete_address',
            'address_oneline',
            'notes',
            'created_at',
            'updated_at',
        ]
    
    def get_photo_large(self, obj):
        """
        Retorna URL da foto para modal (200x200px).
        Mesma URL da foto original (redimensionamento via CSS no frontend).
        """
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class ContactCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para criar/editar contatos.
    Aceita todos os campos incluindo upload de foto.
    """
    class Meta:
        model = Contact
        fields = [
            'contact_type',
            'person_type',
            'name',
            'document_number',
            'photo',
            'email',
            'phone',
            'mobile',
            'zip_code',
            'street',
            'number',
            'complement',
            'neighborhood',
            'city',
            'state',
            'notes',
        ]
    
    def validate_document_number(self, value):
        """
        Validação básica do documento.
        TODO: Integrar com utils/validators.py para validação completa de CPF/CNPJ.
        """
        if value:
            # Remove formatação
            clean = ''.join(filter(str.isdigit, value))
            if len(clean) not in [0, 11, 14]:
                raise serializers.ValidationError(
                    'Documento deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).'
                )
        return value
    
    def validate_photo(self, value):
        """
        Valida o upload da foto.
        """
        if value:
            # Limita tamanho do arquivo (5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError('Foto deve ter no máximo 5MB.')
            
            # Valida extensão
            allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
            ext = value.name.split('.')[-1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError(
                    f'Formato não permitido. Use: {", ".join(allowed_extensions)}'
                )
        return value

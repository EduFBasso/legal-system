"""
Configuração do Django Admin para o app de contatos.
"""
from django.contrib import admin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """
    Interface administrativa para gerenciar contatos.
    Organizado para facilitar busca e visualização de informações principais.
    """
    
    # Lista de contatos
    list_display = [
        'name',
        'contact_type',
        'person_type',
        'primary_contact',
        'city',
        'is_active',
        'updated_at',
    ]
    
    list_filter = [
        'contact_type',
        'person_type',
        'is_active',
        'state',
        'created_at',
    ]
    
    search_fields = [
        'name',
        'document_number',
        'email',
        'phone',
        'mobile',
        'city',
    ]
    
    # Formulário de edição
    fieldsets = (
        ('Identificação', {
            'fields': ('contact_type', 'person_type', 'name', 'document_number')
        }),
        ('Contatos', {
            'fields': ('email', 'phone', 'mobile'),
            'description': 'Informações de contato (exibidas no mini-card se preenchidas)'
        }),
        ('Endereço', {
            'fields': (
                'zip_code',
                ('street', 'number'),
                'complement',
                'neighborhood',
                ('city', 'state'),
            ),
            'description': 'Endereço completo (exibido no mini-card apenas se todos os campos principais estiverem preenchidos)',
            'classes': ('collapse',),  # Começa fechado
        }),
        ('Informações Adicionais', {
            'fields': ('notes', 'is_active'),
            'classes': ('collapse',),
        }),
        ('Metadados', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    # Ações em lote
    actions = ['activate_contacts', 'deactivate_contacts']
    
    def activate_contacts(self, request, queryset):
        """Ativa contatos selecionados."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} contato(s) ativado(s) com sucesso.')
    activate_contacts.short_description = 'Ativar contatos selecionados'
    
    def deactivate_contacts(self, request, queryset):
        """Desativa contatos selecionados."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} contato(s) desativado(s) com sucesso.')
    deactivate_contacts.short_description = 'Desativar contatos selecionados'

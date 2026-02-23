"""
Admin configuration for Cases app
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Case, CaseParty


class CasePartyInline(admin.TabularInline):
    """Inline for CaseParty - display parties within Case admin"""
    model = CaseParty
    extra = 1
    fields = ['contact', 'role', 'observacoes']
    autocomplete_fields = ['contact']
    verbose_name = 'Parte'
    verbose_name_plural = 'Partes do Processo'


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    """Admin interface for Case model"""
    
    list_display = [
        'numero_processo_formatted',
        'titulo',
        'tribunal_badge',
        'status_badge',
        'auto_status_badge',
        'data_distribuicao',
        'dias_sem_movimentacao',
        'created_at',
    ]
    
    list_filter = [
        'tribunal',
        'status',
        'auto_status',
        'deleted',
        'data_distribuicao',
        'data_ultima_movimentacao',
    ]
    
    search_fields = [
        'numero_processo',
        'numero_processo_unformatted',
        'titulo',
        'observacoes',
        'comarca',
        'vara',
        'tipo_acao',
    ]
    
    readonly_fields = [
        'numero_processo_unformatted',
        'numero_processo_formatted',
        'dias_sem_movimentacao',
        'esta_ativo',
        'total_publicacoes',
        'publicacoes_recentes',
        'nivel_urgencia',
        'created_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('Identificação do Processo', {
            'fields': (
                'numero_processo',
                'numero_processo_formatted',
                'numero_processo_unformatted',
                'titulo',
            )
        }),
        ('Localização', {
            'fields': (
                'tribunal',
                'comarca',
                'vara',
            )
        }),
        ('Status e Classificação', {
            'fields': (
                'status',
                'auto_status',
                'tipo_acao',
                'tags',
            )
        }),
        ('Datas', {
            'fields': (
                'data_distribuicao',
                'data_ultima_movimentacao',
                'data_encerramento',
                'dias_sem_movimentacao',
                'esta_ativo',
            )
        }),
        ('Informações Adicionais', {
            'fields': (
                'valor_causa',
                'observacoes',
            )
        }),
        ('Estatísticas', {
            'fields': (
                'total_publicacoes',
                'publicacoes_recentes',
                'nivel_urgencia',
            ),
            'classes': ('collapse',)
        }),
        ('Soft Delete', {
            'fields': (
                'deleted',
                'deleted_at',
                'deleted_reason',
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [CasePartyInline]
    
    actions = ['atualizar_status_automatico', 'marcar_como_arquivado', 'restaurar_deletados']
    
    def tribunal_badge(self, obj):
        """Display tribunal with colored badge"""
        colors = {
            'TJSP': '#1976d2',
            'STF': '#c62828',
            'STJ': '#6a1b9a',
            'TRF1': '#00796b',
            'TRF2': '#00796b',
            'TRF3': '#00796b',
            'TRF4': '#00796b',
            'TRF5': '#00796b',
            'TST': '#f57c00',
        }
        color = colors.get(obj.tribunal, '#757575')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_tribunal_display()
        )
    tribunal_badge.short_description = 'Tribunal'
    
    def status_badge(self, obj):
        """Display status with colored badge"""
        colors = {
            'ATIVO': '#4caf50',
            'INATIVO': '#9e9e9e',
            'SUSPENSO': '#ff9800',
            'ARQUIVADO': '#757575',
            'ENCERRADO': '#2196f3',
        }
        color = colors.get(obj.status, '#757575')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def auto_status_badge(self, obj):
        """Display auto_status with colored badge"""
        if obj.auto_status == 'ATIVO':
            color = '#4caf50'
            icon = '✓'
        else:
            color = '#f44336'
            icon = '✗'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{} {}</span>',
            color,
            icon,
            obj.get_auto_status_display()
        )
    auto_status_badge.short_description = 'Auto Status'
    
    def atualizar_status_automatico(self, request, queryset):
        """Action to update auto_status for selected cases"""
        updated = 0
        for case in queryset:
            case.atualizar_status_automatico()
            case.save()
            updated += 1
        self.message_user(request, f'{updated} processo(s) atualizado(s).')
    atualizar_status_automatico.short_description = 'Atualizar status automático'
    
    def marcar_como_arquivado(self, request, queryset):
        """Action to mark cases as archived"""
        updated = queryset.update(status='ARQUIVADO')
        self.message_user(request, f'{updated} processo(s) arquivado(s).')
    marcar_como_arquivado.short_description = 'Marcar como arquivado'
    
    def restaurar_deletados(self, request, queryset):
        """Action to restore soft-deleted cases"""
        updated = queryset.update(
            deleted=False,
            deleted_at=None,
            deleted_reason=None
        )
        self.message_user(request, f'{updated} processo(s) restaurado(s).')
    restaurar_deletados.short_description = 'Restaurar processos deletados'
    
    def get_queryset(self, request):
        """Include deleted cases in admin (for restoration)"""
        return Case.objects.all()


@admin.register(CaseParty)
class CasePartyAdmin(admin.ModelAdmin):
    """Admin interface for CaseParty model"""
    
    list_display = [
        'case_link',
        'contact_link',
        'role_badge',
        'observacoes_short',
        'created_at',
    ]
    
    list_filter = [
        'role',
        'created_at',
    ]
    
    search_fields = [
        'case__numero_processo',
        'case__titulo',
        'contact__nome',
        'observacoes',
    ]
    
    autocomplete_fields = ['case', 'contact']
    
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Relacionamento', {
            'fields': (
                'case',
                'contact',
                'role',
            )
        }),
        ('Detalhes', {
            'fields': (
                'observacoes',
                'created_at',
            )
        }),
    )
    
    def case_link(self, obj):
        """Link to case admin"""
        return format_html(
            '<a href="/admin/cases/case/{}/change/">{}</a>',
            obj.case.id,
            obj.case.numero_processo_formatted or obj.case.titulo
        )
    case_link.short_description = 'Processo'
    
    def contact_link(self, obj):
        """Link to contact admin"""
        return format_html(
            '<a href="/admin/contacts/contact/{}/change/">{}</a>',
            obj.contact.id,
            obj.contact.nome
        )
    contact_link.short_description = 'Contato'
    
    def role_badge(self, obj):
        """Display role with colored badge"""
        colors = {
            'CLIENTE': '#4caf50',
            'AUTOR': '#2196f3',
            'REU': '#f44336',
            'TESTEMUNHA': '#ff9800',
            'PERITO': '#9c27b0',
            'TERCEIRO': '#757575',
        }
        color = colors.get(obj.role, '#757575')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_role_display()
        )
    role_badge.short_description = 'Papel'
    
    def observacoes_short(self, obj):
        """Display truncated observations"""
        if obj.observacoes:
            return obj.observacoes[:50] + '...' if len(obj.observacoes) > 50 else obj.observacoes
        return '-'
    observacoes_short.short_description = 'Observações'

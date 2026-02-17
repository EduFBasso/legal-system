from django.contrib import admin
from .models import Publication, SearchHistory


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ['id', 'tribunal', 'numero_processo', 'tipo_comunicacao', 
                    'data_disponibilizacao', 'created_at']
    list_filter = ['tribunal', 'tipo_comunicacao', 'data_disponibilizacao']
    search_fields = ['numero_processo', 'texto_completo', 'orgao']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'data_disponibilizacao'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('id_api', 'numero_processo', 'tribunal')
        }),
        ('Tipo e Data', {
            'fields': ('tipo_comunicacao', 'data_disponibilizacao', 'orgao', 'meio')
        }),
        ('Conteúdo', {
            'fields': ('texto_resumo', 'texto_completo')
        }),
        ('Links', {
            'fields': ('link_oficial', 'hash_pub')
        }),
        ('Metadados', {
            'fields': ('search_metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'executed_at', 'total_publicacoes', 'total_novas', 
                    'tribunais_list', 'periodo']
    list_filter = ['executed_at']
    readonly_fields = ['executed_at']
    date_hierarchy = 'executed_at'
    
    def tribunais_list(self, obj):
        return ', '.join(obj.tribunais)
    tribunais_list.short_description = 'Tribunais'
    
    def periodo(self, obj):
        return f"{obj.data_inicio.strftime('%d/%m/%Y')} a {obj.data_fim.strftime('%d/%m/%Y')}"
    periodo.short_description = 'Período'
    
    fieldsets = (
        ('Parâmetros', {
            'fields': ('data_inicio', 'data_fim', 'tribunais')
        }),
        ('Resultados', {
            'fields': ('total_publicacoes', 'total_novas', 'duration_seconds')
        }),
        ('Detalhes', {
            'fields': ('search_params', 'executed_at'),
            'classes': ('collapse',)
        }),
    )

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Buscar publicações para testar
print('\n=== LINKS ATUALIZADOS - ESTRATÉGIA HÍBRIDA ===\n')

pubs = Publication.objects.filter(tribunal='TJSP').order_by('-data_disponibilizacao')[:5]

for pub in pubs:
    foro = pub.numero_processo[-4:] if pub.numero_processo and len(pub.numero_processo) >= 4 else None
    codigo_foro = str(int(foro)) if foro and foro.isdigit() else 'N/A'
    
    print(f'Processo: {pub.numero_processo}')
    print(f'Foro: {codigo_foro}')
    print(f'Órgão: {pub.orgao}')
    print(f'Link: {pub.link_oficial}')
    print()

print('📋 COMO TESTAR:')
print('1. Clique no botão "🔍 Consultar Processo" (copia automaticamente)')
print('2. ESAJ abre e pode:')
print('   ✅ Preencher automaticamente (foros como 533)')
print('   📋 Não preencher, mas número já está copiado (basta colar)')
print()
print('🎯 MELHOR DOS 2 MUNDOS:')
print('   - Automação quando funciona')
print('   - Fallback manual rápido (já copiado)')

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Buscar publicações do dia 10 a 12 de fevereiro (que funcionaram antes)
pubs = Publication.objects.filter(
    data_disponibilizacao__gte='2026-02-10',
    data_disponibilizacao__lte='2026-02-12',
    tribunal='TJSP'
).order_by('data_disponibilizacao')

print(f'\n=== PUBLICAÇÕES DE 10 A 12 DE FEVEREIRO (TJSP) ===')
print(f'Total: {pubs.count()}\n')

for pub in pubs:
    print(f'Processo: {pub.numero_processo}')
    print(f'Data: {pub.data_disponibilizacao}')
    print(f'Link atual no banco: {pub.link_oficial}')
    
    # Extrair código do foro
    foro = pub.numero_processo[-4:] if pub.numero_processo and len(pub.numero_processo) >= 4 else None
    if foro and foro.isdigit():
        codigo_foro = str(int(foro))
        print(f'Código do foro: {codigo_foro}')
    
    print('-' * 80)

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Buscar todas as publicações do TJSP com links no formato antigo
pubs = Publication.objects.filter(
    tribunal='TJSP',
    link_oficial__contains='processo.codigo='
)

print(f'\n=== Atualizando {pubs.count()} publicações ===')

updated = 0
for pub in pubs:
    if pub.numero_processo:
        # Gerar novo link (formato público simples)
        novo_link = f"https://esaj.tjsp.jus.br/cpopg/show.do?processo.numero={pub.numero_processo}"
        
        print(f'\nProcesso: {pub.numero_processo}')
        print(f'Antigo: {pub.link_oficial}')
        print(f'Novo: {novo_link}')
        
        pub.link_oficial = novo_link
        pub.save()
        updated += 1

print(f'\n✅ {updated} publicações atualizadas!')

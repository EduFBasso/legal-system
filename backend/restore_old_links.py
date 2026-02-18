import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Buscar todas as publicações do TJSP
pubs = Publication.objects.filter(tribunal='TJSP')

print(f'\n=== Atualizando {pubs.count()} publicações para formato antigo ===')

updated = 0
for pub in pubs:
    if pub.numero_processo:
        # Extrair código do foro (últimos 4 dígitos)
        foro = pub.numero_processo[-4:] if len(pub.numero_processo) >= 4 else None
        
        if foro and foro.isdigit():
            # Remover zeros à esquerda (0533 → 533)
            codigo_foro = str(int(foro))
            
            # Formato antigo (que funcionava dia 12)
            novo_link = f"https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo={codigo_foro}&processo.numero={pub.numero_processo}"
            
            print(f'\nProcesso: {pub.numero_processo}')
            print(f'Foro: {foro} → {codigo_foro}')
            print(f'Novo link: {novo_link}')
            
            pub.link_oficial = novo_link
            pub.save()
            updated += 1

print(f'\n✅ {updated} publicações atualizadas para formato antigo!')

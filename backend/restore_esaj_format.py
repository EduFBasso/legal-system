import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Restaurar links para formato ESAJ (solução que funciona melhor)
pubs = Publication.objects.filter(tribunal='TJSP')

print(f'\n=== Restaurando {pubs.count()} publicações para formato ESAJ ===')

updated = 0
for pub in pubs:
    if pub.numero_processo:
        foro = pub.numero_processo[-4:] if len(pub.numero_processo) >= 4 else None
        
        if foro and foro.isdigit():
            codigo_foro = str(int(foro))
            
            # Formato ESAJ (funciona para maioria dos casos)
            novo_link = f"https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo={codigo_foro}&processo.numero={pub.numero_processo}"
            
            print(f'Processo: {pub.numero_processo} (foro {codigo_foro})')
            
            pub.link_oficial = novo_link
            pub.save()
            updated += 1

print(f'\n✅ {updated} publicações restauradas para formato ESAJ!')
print('\n📝 OBSERVAÇÃO:')
print('   - Foros como Santo Amaro (2) podem pedir senha (processos sigilosos)')
print('   - Maioria dos foros funciona normalmente')
print('   - Se não preencher, copie o número e busque manualmente')

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Atualizar links para formato com tentativa de preenchimento automático
pubs = Publication.objects.filter(tribunal='TJSP')

print(f'\n=== Atualizando {pubs.count()} links para modo híbrido (auto + cópia) ===')

updated = 0
for pub in pubs:
    if pub.numero_processo:
        foro = pub.numero_processo[-4:] if len(pub.numero_processo) >= 4 else None
        
        if foro and foro.isdigit():
            codigo_foro = str(int(foro))
            
            # Formato com parâmetros (tenta preenchimento automático)
            novo_link = f"https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo={codigo_foro}&processo.numero={pub.numero_processo}"
            
            print(f'Processo: {pub.numero_processo} (foro {codigo_foro})')
            
            pub.link_oficial = novo_link
            pub.save()
            updated += 1

print(f'\n✅ {updated} publicações atualizadas!')
print('\n📝 ESTRATÉGIA HÍBRIDA:')
print('   1. URL tenta preencher automaticamente')
print('   2. Se funcionar (ex: foro 533) → Campos preenchidos ✨')
print('   3. Se não funcionar → Número já copiado para colar 📋')
print('   4. Sempre abre o ESAJ na página certa')

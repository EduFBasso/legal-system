import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Buscar todas as publicações do TJSP
pubs = Publication.objects.filter(tribunal='TJSP')

print(f'\n=== Atualizando {pubs.count()} publicações TJSP ===')

updated_hash = 0
updated_esaj = 0
updated_generic = 0

for pub in pubs:
    # Prioridade 1: Se tiver hash, usar link do DJE
    if pub.hash_pub:
        # Remover www. para evitar erro de certificado SSL
        novo_link = f"https://dje.tjsp.jus.br/Visualizar?hash={pub.hash_pub}"
        pub.link_oficial = novo_link
        pub.save()
        updated_hash += 1
        print(f'✅ Hash: {pub.numero_processo} → DJE com hash')
    
    # Prioridade 2: Se não tiver hash mas tiver número de processo
    elif pub.numero_processo:
        foro = pub.numero_processo[-4:] if len(pub.numero_processo) >= 4 else None
        
        if foro and foro.isdigit():
            codigo_foro = str(int(foro))
            
            # Foros restritos (pedem senha)
            foros_restritos = ['2']  # Santo Amaro - processos de família
            
            if codigo_foro in foros_restritos:
                novo_link = "https://esaj.tjsp.jus.br/cpopg/open.do"
                pub.link_oficial = novo_link
                pub.save()
                updated_generic += 1
                print(f'⚠️  Restrito: {pub.numero_processo} (foro {codigo_foro}) → busca genérica')
            else:
                novo_link = f"https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo={codigo_foro}&processo.numero={pub.numero_processo}"
                pub.link_oficial = novo_link
                pub.save()
                updated_esaj += 1
                print(f'🔧 ESAJ: {pub.numero_processo} (foro {codigo_foro})')

print(f'\n=== RESUMO ===')
print(f'✅ Links com hash (DJE): {updated_hash}')
print(f'🔧 Links ESAJ: {updated_esaj}')
print(f'⚠️  Links genéricos (foros restritos): {updated_generic}')
print(f'📊 Total atualizado: {updated_hash + updated_esaj + updated_generic}')

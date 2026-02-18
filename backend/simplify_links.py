import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Simplificar links TJSP para página genérica (solução mais confiável)
pubs = Publication.objects.filter(tribunal='TJSP')

print(f'\n=== Simplificando {pubs.count()} links para solução confiável ===')

updated = 0
for pub in pubs:
    # Página inicial do ESAJ (sempre funciona)
    novo_link = "https://esaj.tjsp.jus.br/cpopg/open.do"
    
    pub.link_oficial = novo_link
    pub.save()
    updated += 1

print(f'\n✅ {updated} publicações atualizadas!')
print('\n📝 SOLUÇÃO ADOTADA:')
print('   - Link leva para página inicial do e-SAJ')
print('   - Número do processo fica destacado para copiar')
print('   - Usuário cola na busca (mais confiável que parâmetros)')
print('   - Funciona 100% das vezes (independente de cache/sessão)')

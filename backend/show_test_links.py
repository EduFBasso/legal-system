import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication

# Buscar publicações para testar
print('\n=== LINKS ATUALIZADOS PARA TESTE ===\n')

# Processo que pedia senha antes (foro 2)
pub_foro2 = Publication.objects.filter(numero_processo='1051789-54.2019.8.26.0002').first()
if pub_foro2:
    print('1. Processo de Santo Amaro (foro 2) - PEDIA SENHA ANTES:')
    print(f'   Processo: {pub_foro2.numero_processo}')
    print(f'   Novo link: {pub_foro2.link_oficial}')
    print()

# Processo que não preenchia (foro 320)
pub_foro320 = Publication.objects.filter(numero_processo='0000618-47.2026.8.26.0320').first()
if pub_foro320:
    print('2. Processo de Limeira (foro 320) - NÃO PREENCHIA ANTES:')
    print(f'   Processo: {pub_foro320.numero_processo}')
    print(f'   Novo link: {pub_foro320.link_oficial}')
    print()

# Processo que funcionava (foro 533)
pub_foro533 = Publication.objects.filter(numero_processo='1006581-93.2025.8.26.0533').first()
if pub_foro533:
    print('3. Processo de Limeira (foro 533) - FUNCIONAVA ANTES:')
    print(f'   Processo: {pub_foro533.numero_processo}')
    print(f'   Novo link: {pub_foro533.link_oficial}')
    print()

print('\n📋 TESTE NO NAVEGADOR:')
print('   Copie os links acima e teste se abrem sem pedir senha')
print('   Os links do DJE devem funcionar diretamente!')

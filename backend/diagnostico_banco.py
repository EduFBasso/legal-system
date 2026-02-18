import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication, SearchHistory
from collections import Counter

print('\n' + '='*80)
print('DIAGNÓSTICO DO BANCO DE DADOS')
print('='*80)

# 1. Total de publicações
total_pubs = Publication.objects.count()
print(f'\n📊 Total de publicações: {total_pubs}')

# 2. Publicações por data
print('\n📅 Publicações por data:')
pubs_por_data = Publication.objects.values('data_disponibilizacao').annotate(
    count=django.db.models.Count('id_api')
).order_by('-data_disponibilizacao')

for item in pubs_por_data:
    print(f"   {item['data_disponibilizacao']}: {item['count']} publicações")

# 3. Verificar duplicações (mesmo id_api)
print('\n🔍 Verificando duplicações (id_api):')
ids = list(Publication.objects.values_list('id_api', flat=True))
duplicatas = [id_api for id_api, count in Counter(ids).items() if count > 1]

if duplicatas:
    print(f'   ⚠️  ENCONTRADAS {len(duplicatas)} duplicatas!')
    for id_dup in duplicatas[:5]:  # Mostrar só as primeiras 5
        pubs_dup = Publication.objects.filter(id_api=id_dup)
        print(f'   - id_api {id_dup}: {pubs_dup.count()} ocorrências')
else:
    print('   ✅ Nenhuma duplicação encontrada')

# 4. Histórico de buscas
print('\n📝 Histórico de buscas (últimas 5):')
historico = SearchHistory.objects.all().order_by('-executed_at')[:5]

for h in historico:
    print(f'   ID {h.id}: {h.data_inicio} a {h.data_fim}')
    print(f'      Total: {h.total_publicacoes} | Novas: {h.total_novas}')
    print(f'      Executada: {h.executed_at.strftime("%d/%m/%Y %H:%M:%S")}')
    print()

# 5. Publicações por período
print('\n📦 Publicações de 10-12/02 (que deve ter 4):')
pubs_10_12 = Publication.objects.filter(
    data_disponibilizacao__gte='2026-02-10',
    data_disponibilizacao__lte='2026-02-12'
)
print(f'   Total no banco: {pubs_10_12.count()}')
for pub in pubs_10_12:
    print(f'   - {pub.numero_processo} | {pub.data_disponibilizacao}')

print('\n📦 Publicações de 18/02 (hoje):')
pubs_hoje = Publication.objects.filter(data_disponibilizacao='2026-02-18')
print(f'   Total no banco: {pubs_hoje.count()}')
for pub in pubs_hoje:
    print(f'   - {pub.numero_processo} | {pub.data_disponibilizacao}')

print('\n' + '='*80)

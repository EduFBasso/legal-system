import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import SearchHistory

searches = SearchHistory.objects.all().order_by('-executed_at')[:3]

print('\n=== ÚLTIMAS 3 BUSCAS ===')
for s in searches:
    print(f'ID: {s.id} | Data: {s.data_inicio} a {s.data_fim} | Total: {s.total_publicacoes} | Novas: {s.total_novas} | Executada: {s.executed_at}')

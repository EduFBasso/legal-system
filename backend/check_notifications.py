#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.notifications.models import Notification

total = Notification.objects.count()
unread = Notification.objects.filter(read=False).count()
read_count = Notification.objects.filter(read=True).count()

print(f'\n📊 Notificações no Banco de Dados:')
print(f'   Total: {total}')
print(f'   Não lidas: {unread}')
print(f'   Lidas: {read_count}')

if total > 0:
    print(f'\n📋 Últimas 5 notificações:')
    for n in Notification.objects.all()[:5]:
        status = '✓' if n.read else '○'
        print(f'   {status} ID {n.id}: {n.title} ({n.priority}) - {n.created_at.strftime("%d/%m %H:%M")}')
else:
    print('\n❌ Nenhuma notificação encontrada!')

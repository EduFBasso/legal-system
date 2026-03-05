from apps.notifications.models import Notification

# Limpar antes
Notification.objects.all().delete()

# Publicação 1
Notification.objects.create(
    type='publication',
    priority='high',
    title='Nova Publicação - TJSP',
    message='Nova publicação encontrada',
    link='/publications',
    metadata={'tribunal': 'TJSP', 'numero_processo': '0001234-56.2024.8.26.0100', 'tipo_comunicacao': 'Citação'},
    read=False
)

# Publicação 2
Notification.objects.create(
    type='publication',
    priority='medium',
    title='Nova Publicação - TRF3',
    message='Publicação tribunal federal',
    link='/publications',
    metadata={'tribunal': 'TRF3', 'numero_processo': '0012345-67.2024.4.03.6100', 'tipo_comunicacao': 'Despacho'},
    read=False
)

# Alerta 90+ dias 1
Notification.objects.create(
    type='process',
    priority='urgent',
    title='Processo Inativo',
    message='Processo sem movimentação há 95 dias',
    link='/cases',
    metadata={'alert_type': 'stale_90_days', 'case_number': '0001234-56.2024.8.26.0100', 'days_without_activity': 95},
    read=False
)

# Alerta 90+ dias 2
Notification.objects.create(
    type='process',
    priority='urgent',
    title='Processo Inativo',
    message='Processo sem movimentação há 100 dias',
    link='/cases',
    metadata={'alert_type': 'stale_90_days', 'case_number': '0000111-22.2023.8.26.0000', 'days_without_activity': 100},
    read=False
)

print('✅ Notificações de teste criadas com sucesso!')

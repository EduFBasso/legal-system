#!/usr/bin/env python3
"""
Script para criar notificações de teste e validar o layout
"""

import os
import sys
import django
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django.setup()

from apps.notifications.models import Notification

# Limpar notificações antigas para teste
print("🧹 Limpando notificações antigas...")
Notification.objects.all().delete()

# 1. Criar notificação de publicação com tribunal
print("\n📰 Criando notificação de publicação...")
pub_notif = Notification.objects.create(
    type='publication',
    priority='high',
    title='Nova Publicação - TJSP',
    message='Nova publicação encontrada no tribunal de São Paulo',
    link='/publications',
    metadata={
        'tribunal': 'TJSP',
        'numero_processo': '0001234-56.2024.8.26.0100',
        'data_disponibilizacao': '2024-03-05',
        'tipo_comunicacao': 'Citação',
    },
    read=False
)
print(f"✓ Notificação de publicação criada: {pub_notif.id}")

# 2. Criar outra publicação com tribunal diferente
print("\n📰 Criando segunda notificação de publicação...")
pub_notif2 = Notification.objects.create(
    type='publication',
    priority='medium',
    title='Nova Publicação - TRF3',
    message='Publicação do tribunal federal regional',
    link='/publications',
    metadata={
        'tribunal': 'TRF3',
        'numero_processo': '0012345-67.2024.4.03.6100',
        'data_disponibilizacao': '2024-03-05',
        'tipo_comunicacao': 'Despacho',
    },
    read=False
)
print(f"✓ Notificação de publicação 2 criada: {pub_notif2.id}")

# 3. Criar alerta de processo inativo 90+ dias
print("\n⚠️  Criando notificação de alerta 90+ dias...")
now = datetime.now()
ninety_five_days_ago = now - timedelta(days=95)

alert_notif = Notification.objects.create(
    type='process',
    priority='urgent',
    title='Processo Inativo por 95 Dias',
    message='Processo sem movimentação há 95 dias',
    link='/cases',
    metadata={
        'alert_type': 'stale_90_days',
        'case_number': '0001234-56.2024.8.26.0100',
        'days_without_activity': 95,
        'status': 'INATIVO',
    },
    read=False
)
print(f"✓ Notificação de alerta criada: {alert_notif.id}")

# 4. Criar segunda notificação de alerta
print("\n⚠️  Criando segunda notificação de alerta 90+ dias...")
alert_notif2 = Notification.objects.create(
    type='process',
    priority='urgent',
    title='Processo Inativo por 100 Dias',
    message='Processo sem movimentação há 100 dias',
    link='/cases',
    metadata={
        'alert_type': 'stale_90_days',
        'case_number': '0000111-22.2023.8.26.0000',
        'days_without_activity': 100,
        'status': 'INATIVO',
    },
    read=False
)
print(f"✓ Notificação de alerta 2 criada: {alert_notif2.id}")

# 5. Criar notificação lida (para testes de filtro)
print("\n📖 Criando notificação já lida...")
read_notif = Notification.objects.create(
    type='publication',
    priority='low',
    title='Publicação Antiga - STF',
    message='Publicação já processada',
    link='/publications',
    metadata={
        'tribunal': 'STF',
        'numero_processo': '0000999-11.2020.8.00.0000',
        'data_disponibilizacao': '2024-02-01',
        'tipo_comunicacao': 'Intimação',
    },
    read=True
)
print(f"✓ Notificação lida criada: {read_notif.id}")

# Salvar dados em JSON para referência
test_data = {
    'publication_notifications': [
        {'id': pub_notif.id, 'type': 'publication', 'tribunal': 'TJSP'},
        {'id': pub_notif2.id, 'type': 'publication', 'tribunal': 'TRF3'},
    ],
    'alert_notifications': [
        {'id': alert_notif.id, 'type': 'process', 'case_number': '0001234-56.2024.8.26.0100'},
        {'id': alert_notif2.id, 'type': 'process', 'case_number': '0000111-22.2023.8.26.0000'},
    ],
    'read_notification': {
        'id': read_notif.id,
        'type': 'publication',
        'tribunal': 'STF'
    }
}

with open('test_notifications.json', 'w') as f:
    json.dump(test_data, f, indent=2)

print("\n✅ Notificações de teste criadas com sucesso!")
print(f"\n📊 Estatísticas:")
print(f"  - Publicações não lidas: 2")
print(f"  - Alertas 90+ dias: 2")
print(f"  - Publicações lidas: 1")
print(f"  - Total: 5 notificações")
print(f"\n🌐 Acesse http://localhost:5174 para visualizar")
print(f"📋 Dados salvos em test_notifications.json")

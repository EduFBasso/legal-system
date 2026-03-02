#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.cases.models import CaseMovement
from apps.publications.models import Publication

# Verificar movimentações com publicacao_id
print("\n=== MOVIMENTAÇÕES COM publicacao_id ===")
movements = CaseMovement.objects.filter(publicacao_id__isnull=False)[:5]
for mov in movements:
    print(f"\nMovimentação ID: {mov.id}")
    print(f"  publicacao_id: {mov.publicacao_id}")
    print(f"  Case: {mov.case.numero_processo}")
    
    try:
        # publicacao_id armazena id_api, não pk
        pub = Publication.objects.get(id_api=mov.publicacao_id)
        print(f"  ✓ Publication encontrada: ID={pub.id}, id_api={pub.id_api}")
        print(f"  Publication.orgao: '{pub.orgao}'")
        print(f"  Publication.orgao is empty: {not pub.orgao}")
    except Publication.DoesNotExist:
        print(f"  ❌ Publication com id_api={mov.publicacao_id} NÃO ENCONTRADA")
    except Exception as e:
        print(f"  ❌ Erro: {e}")

# Verificar publications sem órgão
print("\n\n=== PUBLICATIONS SEM ÓRGÃO ===")
pubs_without_orgao = Publication.objects.filter(orgao='')[:5]
print(f"Total: {pubs_without_orgao.count()}")
for pub in pubs_without_orgao[:3]:
    print(f"  ID={pub.id}, id_api={pub.id_api}, tipo={pub.tipo_comunicacao}")

# Verificar publications COM órgão
print("\n\n=== PUBLICATIONS COM ÓRGÃO ===")
pubs_with_orgao = Publication.objects.exclude(orgao='')[:5]
print(f"Total: {pubs_with_orgao.count()}")
for pub in pubs_with_orgao[:3]:
    print(f"  ID={pub.id}, id_api={pub.id_api}, orgao='{pub.orgao}'")

print("\n")

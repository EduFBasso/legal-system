#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication
from apps.cases.models import CaseMovement
from apps.cases.serializers import normalize_text

# Verificar publication com id_api=533295300
pub = Publication.objects.get(id_api=533295300)
mov = CaseMovement.objects.get(publicacao_id=533295300)

print("=== TESTE DO get_orgao() ===\n")

# Testar a lógica do get_orgao
print(f"mov.publicacao_id: {mov.publicacao_id}")
print(f"mov.publicacao_id is not None: {mov.publicacao_id is not None}")
print(f"bool(mov.publicacao_id): {bool(mov.publicacao_id)}")

if mov.publicacao_id:
    print(f"\nBuscando Publication com id_api={mov.publicacao_id}...")
    try:
        publication = Publication.objects.get(id_api=mov.publicacao_id)
        print(f"✓ Publication encontrada: {publication.id}")
        print(f"  orgao: '{publication.orgao}'")
        print(f"  orgao bool: {bool(publication.orgao)}")
        
        if publication.orgao:
            print(f"\n  Aplicando normalize_text...")
            normalized = normalize_text(publication.orgao)
            print(f"  Resultado: '{normalized}'")
        else:
            print(f"  orgao é falsy (vazio ou None)")
    except Exception as e:
        print(f"✗ Erro: {type(e).__name__}: {e}")
else:
    print("publicacao_id é falsy")

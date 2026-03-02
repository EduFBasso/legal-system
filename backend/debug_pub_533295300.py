#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication
from apps.cases.models import CaseMovement

# Verificar publication com id_api=533295300
pub = Publication.objects.get(id_api=533295300)
print(f"Publication ID: {pub.id}")
print(f"Publication id_api: {pub.id_api}")
print(f"Publication.orgao: '{pub.orgao}'")
print(f"Publication.orgao is empty: {not pub.orgao}")
print(f"Publication.orgao length: {len(pub.orgao) if pub.orgao else 0}")
print(f"Publication.orgao repr: {repr(pub.orgao)}")

# Verificar movement vinculada
mov = CaseMovement.objects.get(publicacao_id=533295300)
print(f"\nMovement ID: {mov.id}")
print(f"Movement.publicacao_id: {mov.publicacao_id}")
print(f"Movement.case: {mov.case.numero_processo}")

# Testar o serializer
from apps.cases.serializers import CaseMovementSerializer
serializer = CaseMovementSerializer(mov)
print(f"\nSerialized data:")
print(f"  orgao: {serializer.data.get('orgao')}")
print(f"  titulo: {serializer.data.get('titulo')}")
print(f"  descricao: {serializer.data.get('descricao')[:100]}")

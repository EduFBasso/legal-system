#!/usr/bin/env python
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.cases.models import Case
from apps.cases.serializers import CaseDetailSerializer

case = Case.objects.get(id=4)
print("DADOS BRUTOS DO BANCO:")
print(f"  valor_causa: {case.valor_causa}")
print(f"  type: {type(case.valor_causa)}")

print("\nDADOS SERIALIZADOS (O QUE FRONTEND RECEBE):")
serializer = CaseDetailSerializer(case)
data = serializer.data
print(f"  valor_causa: {data['valor_causa']}")
print(f"  type: {type(data['valor_causa'])}")

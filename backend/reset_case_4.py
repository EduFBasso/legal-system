#!/usr/bin/env python
"""
Recriar CASE #4 completamente do zero sem contaminar partes
"""
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.cases.models import Case, CaseParty
from apps.contacts.models import Contact

print("\n" + "="*70)
print("RECRIANDO CASE #4 DO ZERO")
print("="*70)

try:
    # 1. Reusar contatos existentes (não criar novos)
    print("\n1️⃣  OBTENDO CONTATOS")
    print("-"*70)
    
    autor = Contact.objects.get(name='Escola Técnica Sautec Ltda')
    print(f"  ✓ Autor: {autor.name}")
    
    reu = Contact.objects.get(name='Thatiane Migotti')
    print(f"  ✓ Réu: {reu.name}")
    
    # 2. Criar CASE #id específico alterando ID manualmente
    print("\n2️⃣  CRIANDO CASE #4")
    print("-"*70)
    
    case = Case(
        id=4,  # Força ID = 4
        numero_processo='1003306-63.2024.8.26.0019',
        titulo='Ação Ordinária - Demanda contra Terceiros',
        tribunal='TJSP',
        comarca='São Paulo',
        vara='3ª Vara Cível',
        tipo_acao='ACAO_ORDINARIA',
        status='ATIVO',
        data_distribuicao='2026-02-26',
        cliente_principal=autor,
        cliente_posicao='AUTOR',
        valor_causa=Decimal('15000.00'),  # ← EXATAMENTE 15000, NÃO 1500000
        participation_type='percentage',
        participation_percentage=Decimal('20.00'),
        payment_conditional=True,
        observations_financial_block_a='Execução de Título Extrajudicial',
        observations_financial_block_b='Condicionada ao resultado',
    )
    case.save()
    print(f"  ✓ Case criado com ID={case.id}")
    print(f"    - Número: {case.numero_processo}")
    print(f"    - valor_causa: {case.valor_causa} (tipo: {type(case.valor_causa).__name__})")
    print(f"    - participation_percentage: {case.participation_percentage}%")
    
    # 3. Criar PARTES do zero
    print("\n3️⃣  ADICIONANDO PARTES")
    print("-"*70)
    
    # Deletar partes antigas se existirem
    CaseParty.objects.filter(case=case).delete()
    
    # AUTOR
    p1 = CaseParty(
        case=case,
        contact=autor,
        role='AUTOR',
        is_client=True,
        observacoes='Cliente - Requerente'
    )
    p1.save()
    print(f"  ✓ {autor.name} como AUTOR (client_id={p1.id})")
    
    # RÉU
    p2 = CaseParty(
        case=case,
        contact=reu,
        role='REU',
        is_client=False,
        observacoes='Requerida'
    )
    p2.save()
    print(f"  ✓ {reu.name} como RÉU (party_id={p2.id})")
    
    print("\n" + "="*70)
    print("✅ CASE #4 RECRIADO!")
    print("="*70)
    
    # Verificação final
    print(f"\nVERIFICAÇÃO FINAL:")
    case_reload = Case.objects.get(id=4)
    print(f"  ID: {case_reload.id}")
    print(f"  valor_causa: {case_reload.valor_causa}")
    print(f"  participation_percentage: {case_reload.participation_percentage}")
    print(f"  Cálculo: {float(case_reload.valor_causa)} * {float(case_reload.participation_percentage)} / 100 = {float(case_reload.valor_causa) * float(case_reload.participation_percentage) / 100}")
    print(f"\n✅ http://localhost:5173/cases/4\n")
    
except Exception as e:
    print(f"\n❌ Erro: {e}")
    import traceback
    traceback.print_exc()

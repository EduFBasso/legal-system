#!/usr/bin/env python
"""
Script limpo para criar case #4 com valores corretos
"""
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.cases.models import Case, CaseParty
from apps.contacts.models import Contact

print("\n" + "="*70)
print("CRIANDO CASO #4 DO ZERO")
print("="*70)

try:
    # 1. Criar Contatos
    print("\n1️⃣  CRIANDO CONTATOS")
    print("-"*70)
    
    # AUTOR - PJ
    autor, _ = Contact.objects.get_or_create(
        name='Escola Técnica Sautec Ltda',
        defaults={
            'person_type': 'PJ',
            'document_number': '15.123.456/0001-89',
            'email': 'contato@sautec.com.br',
            'phone': '(19) 3461-5000',
        }
    )
    print(f"  ✓ {autor.name} ({autor.person_type})")
    
    # RÉU - PF
    reu, _ = Contact.objects.get_or_create(
        name='Thatiane Migotti',
        defaults={
            'person_type': 'PF',
            'document_number': '123.456.789-10',
            'email': 'thatiane@example.com',
        }
    )
    print(f"  ✓ {reu.name} ({reu.person_type})")
    
    # 2. Criar Case
    print("\n2️⃣  CRIANDO CASE")
    print("-"*70)
    
    case = Case.objects.create(
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
        # IMPORTANTE: Valores CORRETOS SEM multiplicar por 100
        valor_causa=Decimal('15000.00'),  # R$ 15 mil
        participation_type='percentage',
        participation_percentage=Decimal('20.00'),  # 20%
        payment_conditional=True,
        observations_financial_block_a='Execução de Título Extrajudicial',
        observations_financial_block_b='Condicionada ao resultado',
    )
    print(f"  ✓ Case #{case.id}: {case.numero_processo}")
    print(f"    - Valor da Causa: R$ {case.valor_causa}")
    print(f"    - Participação: {case.participation_percentage}%")
    
    # 3. Adicionar Partes
    print("\n3️⃣  ADICIONANDO PARTES")
    print("-"*70)
    
    CaseParty.objects.create(
        case=case,
        contact=autor,
        role='AUTOR',
        is_client=True,
        observacoes='Cliente principal - Requerente'
    )
    print(f"  ✓ {autor.name} como AUTOR")
    
    CaseParty.objects.create(
        case=case,
        contact=reu,
        role='REU',
        is_client=False,
        observacoes='Requerida'
    )
    print(f"  ✓ {reu.name} como RÉU")
    
    print("\n" + "="*70)
    print("✅ CASE #4 CRIADO COM SUCESSO!")
    print("="*70)
    print(f"\n📱 Abra em: http://localhost:5173/cases/{case.id}\n")
    
    # Verificar valores
    print("VERIFICAÇÃO:")
    print(f"  valor_causa no banco: {case.valor_causa}")
    print(f"  Cálculo esperado: {float(case.valor_causa)} * {float(case.participation_percentage)} / 100 = {float(case.valor_causa) * float(case.participation_percentage) / 100}")
    
except Exception as e:
    print(f"\n❌ Erro: {e}")
    import traceback
    traceback.print_exc()

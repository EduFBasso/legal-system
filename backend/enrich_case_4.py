#!/usr/bin/env python
"""
Script simples para enriquecer o caso #4 com partes
"""
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.cases.models import Case, CaseParty
from apps.contacts.models import Contact

print("\n" + "="*70)
print("ENRIQUECENDO CASO #4 COM PARTES E FINANCEIRO")
print("="*70)

try:
    case = Case.objects.get(id=4)
    print(f"\n📋 Caso encontrado: {case.numero_processo}")
    
    # 1. Adicionar AUTOR
    print("\n" + "-"*70)
    print("1️⃣  ADICIONANDO PARTES")
    print("-"*70)
    
    # AUTOR
    autor, created = Contact.objects.get_or_create(
        name='Escola Técnica Sautec Ltda',
        defaults={
            'person_type': 'PJ',
            'document_number': '15.123.456/0001-89',
            'email': 'contato@sautec.com.br',
            'phone': '(19) 3461-5000',
        }
    )
    
    case_party_autor, created = CaseParty.objects.get_or_create(
        case=case,
        contact=autor,
        defaults={'role': 'AUTOR'}
    )
    
    print(f"  ✓ Autor: {autor.name}")
    
    # RÉU
    reu, created = Contact.objects.get_or_create(
        name='Thatiane Migotti',
        defaults={
            'person_type': 'PF',
            'document_number': '123.456.789-10',
            'email': 'thatiane@example.com',
        }
    )
    
    case_party_reu, created = CaseParty.objects.get_or_create(
        case=case,
        contact=reu,
        defaults={'role': 'REU'}
    )
    
    print(f"  ✓ Réu: {reu.name}")
    
    # 2. Atualizar dados financeiros
    print("\n" + "-"*70)
    print("2️⃣  CONFIGURANDO FINANCEIRO")
    print("-"*70)
    
    case.cliente_principal = autor
    case.cliente_posicao = 'AUTOR'
    case.valor_causa = Decimal('15000.00')
    case.participation_type = 'percentage'
    case.participation_percentage = Decimal('20.00')
    case.payment_conditional = True
    case.observations_financial_block_a = "Execução de Título Extrajudicial - Obrigações"
    case.observations_financial_block_b = "Custos processuais e honorários condicionados ao resultado"
    case.save()
    
    print(f"  ✓ Valor da Causa: R$ 15.000,00")
    print(f"  ✓ Participação: 20% (condicionada ao ganho)")
    
    print("\n" + "="*70)
    print("✅ CASO COMPLETAMENTE PREENCHIDO!")
    print("="*70)
    print(f"\n📱 Abra em: http://localhost:5173/cases/{case.id}\n")
    
except Case.DoesNotExist:
    print("\n❌ Caso #4 não encontrado")
except Exception as e:
    print(f"\n❌ Erro: {e}")
    import traceback
    traceback.print_exc()

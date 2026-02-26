#!/usr/bin/env python
"""
Script para enriquecer os dados do caso criado a partir da publicação
- Adicionar partes (autor e réu)
- Configurar financeiro
- Adicionar movimentação inicial
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.cases.models import Case, CaseParty
from apps.contacts.models import Contact
from apps.cases.models import CaseMovement
from decimal import Decimal

print("\n" + "="*70)
print("ENRIQUECENDO DADOS DO CASO #4")
print("="*70)

try:
    case = Case.objects.get(id=4)
    print(f"\n📋 Caso encontrado: {case.numero_processo}")
    
    # 1. Adicionar partes (AUTOR e RÉU baseado na publicação)
    print("\n" + "-"*70)
    print("1️⃣  ADICIONANDO PARTES AO PROCESSO")
    print("-"*70)
    
    # Criar ou buscar contato: AUTOR (Escola Técnica Sautec Ltda)
    autor, autor_created = Contact.objects.get_or_create(
            name='Escola Técnica Sautec Ltda',
        defaults={
                'person_type': 'PJ',
                'document_number': '15123456000189',
            'email': 'contato@sautec.com.br',
            'telefone': '(19) 3461-5000',
        }
    )
    
    if autor_created:
            print(f"  ✨ Novo contato criado: {autor.name}")
    else:
            print(f"  ∞ Contato existente: {autor.name}")
    
    # Adicionar AUTOR ao caso
    case_party_autor, created = CaseParty.objects.get_or_create(
        case=case,
        contact=autor,
        defaults={
            'position': 'AUTOR',
                'role': 'AUTOR'
        }
    )
    if created:
            print(f"  → {autor.name} adicionado como AUTOR")
    else:
            print(f"  → {autor.name} já era parte do processo")
    
    # Criar ou buscar contato: RÉU (Thatiane Migotti - citado na publicação)
    reu, reu_created = Contact.objects.get_or_create(
            name='Thatiane Migotti',
        defaults={
                'person_type': 'PF',
                'document_number': '12345678910',
            'email': 'thatiane@example.com',
        }
    )
    
    if reu_created:
            print(f"  ✨ Novo contato criado: {reu.name}")
    else:
            print(f"  ∞ Contato existente: {reu.name}")
    
    # Adicionar RÉU ao caso
    case_party_reu, created = CaseParty.objects.get_or_create(
        case=case,
        contact=reu,
        defaults={
            'position': 'REU',
            'role': 'REU'
        }
    )
    if created:
        print(f"  → {reu.name} adicionado como RÉU")
    else:
        print(f"  → {reu.name} já era parte do processo")
    
    # Definir cliente principal
    case.cliente_principal = autor
    case.cliente_posicao = 'AUTOR'
    
    # 2. Configurar dados financeiros
    print("\n" + "-"*70)
    print("2️⃣  CONFIGURANDO DADOS FINANCEIROS")
    print("-"*70)
    
    case.valor_causa = Decimal('15000.00')  # Valor típico de execução extrajudicial
    case.participation_type = 'percentage'
    case.participation_percentage = Decimal('20.00')  # 20%
    case.payment_conditional = True  # Paga só se ganhar
    case.observations_financial_block_a = "Execução de Título Extrajudicial - Obrigações. Valor estimado derivado de dívida não paga."
    case.observations_financial_block_b = "Custos processuais e honorários condicionados ao resultado da demanda."
    
    case.save()
    
    print(f"  ✓ Valor da causa: R$ {case.valor_causa:,.2f}".replace(',', '#').replace('.', ',').replace('#', '.'))
    print(f"  ✓ Participação: {case.participation_percentage}% (condicionada ao ganho)")
    print(f"  ✓ Cliente principal: {case.cliente_principal.nome}")
    
    # 3. Adicionar movimentação inicial
    print("\n" + "-"*70)
    print("3️⃣  ADICIONANDO MOVIMENTAÇÃO INICIAL")
    print("-"*70)
    
    movimento, created = CaseMovement.objects.get_or_create(
        case=case,
        data=case.data_ultima_movimentacao,
        defaults={
            'tipo': 'INTIMACAO',
            'titulo': 'Intimação - Publicação DJE',
            'descricao': 'Primeira movimentação: Intimação do processo publicada no Diário da Justiça Eletrônico',
            'tribunal': 'TJSP',
        }
    )
    
    if created:
        print(f"  ✓ Movimentação criada: {movimento.titulo}")
    else:
        print(f"  ✓ Movimentação já existia: {movimento.titulo}")
    
    # 4. Resumo final
    print("\n" + "="*70)
    print("✅ CASO COMPLETAMENTE PREENCHIDO!")
    print("="*70)
    
    print(f"""
📋 RESUMO DO CASO:
   Número: {case.numero_processo}
   Tribunal: {case.tribunal}
   Status: {case.status}
   Data Distribuição: {case.data_distribuicao}
   
💰 FINANCEIRO:
   Valor da Causa: R$ {case.valor_causa:,.2f}
   Participação: {case.participation_percentage}%
   Condicionada ao Ganho: Sim
   
👥 PARTES:
   Autor: {case.cliente_principal.nome}
   Réu: {reu.nome}
   Autor: {case.cliente_principal.name}
   Réu: {reu.name}
   
📍 ACESSE: http://localhost:5173/cases/{case.id}
""".replace(',', '#').replace('.', ',').replace('#', '.').replace(':\n', ':\n   '))
    
    print("="*70 + "\n")
    
except Case.DoesNotExist:
    print("\n❌ Caso não encontrado (ID=4)")
except Exception as e:
    print(f"\n❌ Erro ao processar: {e}")
    import traceback
    traceback.print_exc()

#!/usr/bin/env python
"""
Script para buscar publicação e criar novo caso com seus dados
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.publications.models import Publication
from apps.cases.models import Case
from datetime import datetime, timedelta

# Buscar publicação com número do processo
print("\n" + "="*60)
print("BUSCANDO PUBLICAÇÃO: 1003306-63.2024.8.26.0019")
print("="*60)

pub = Publication.objects.filter(
    numero_processo__icontains='1003306-63.2024.8.26.0019'
).first()

if pub:
    print("\n✅ PUBLICAÇÃO ENCONTRADA!")
    print(f"\nDados da Publicação:")
    print(f"  ID API: {pub.id_api}")
    print(f"  Processo: {pub.numero_processo}")
    print(f"  Tribunal: {pub.tribunal}")
    print(f"  Tipo: {pub.tipo_comunicacao}")
    print(f"  Data: {pub.data_disponibilizacao}")
    print(f"  Órgão: {pub.orgao}")
    print(f"  Resumo: {pub.texto_resumo[:150]}...")
    
    # Agora criar um novo caso com esses dados
    print("\n" + "-"*60)
    print("CRIANDO NOVO CASO COM DADOS DA PUBLICAÇÃO")
    print("-"*60)
    
    # Parsear número do processo
    numero_processo = pub.numero_processo.strip()
    if numero_processo:
        try:
            # Verificar se já existe
            existing = Case.objects.filter(numero_processo=numero_processo).first()
            if existing:
                print(f"\n⚠️  Caso já existe: {existing.id}")
                print(f"   Acessível em: /cases/{existing.id}")
            else:
                # Criar novo caso
                case = Case.objects.create(
                    numero_processo=numero_processo,
                    numero_processo_unformatted=numero_processo.replace('.', '').replace('-', ''),
                    titulo=f"{pub.tipo_comunicacao} - {pub.tribunal}",
                    tribunal=pub.tribunal,
                    tipo_acao='CIVEL',
                    status='ATIVO',
                    data_distribuicao=pub.data_disponibilizacao,
                    data_ultima_movimentacao=pub.data_disponibilizacao,
                    observacoes=f"Criado a partir de publicação de {pub.data_disponibilizacao}\n\nOrgão: {pub.orgao}\nTipo: {pub.tipo_comunicacao}\n\nResumo:\n{pub.texto_resumo}",
                    auto_status=True
                )
                print(f"\n✅ NOVO CASO CRIADO COM SUCESSO!")
                print(f"  ID: {case.id}")
                print(f"  Número: {case.numero_processo}")
                print(f"  Tribunal: {case.tribunal}")
                print(f"  Data Distribuição: {case.data_distribuicao}")
                print(f"  Status: {case.status}")
                print(f"\n📱 Acesse em: http://localhost:5173/cases/{case.id}")
                
        except Exception as e:
            print(f"\n❌ Erro ao criar caso: {e}")
    else:
        print("\n❌ Número de processo não encontrado na publicação")
else:
    print("\n❌ PUBLICAÇÃO NÃO ENCONTRADA")
    print("\nBuscando publicações recentes no banco...")
    recent = Publication.objects.order_by('-data_disponibilizacao')[:5]
    
    if recent:
        print(f"\nEncontradas {recent.count()} publicações recentes:")
        for p in recent:
            print(f"\n  📄 Processo: {p.numero_processo}")
            print(f"     Tribunal: {p.tribunal}")
            print(f"     Data: {p.data_disponibilizacao}")
            print(f"     Tipo: {p.tipo_comunicacao}")
            print(f"     Resumo: {p.texto_resumo[:100]}...")
    else:
        print("\n⚠️  Nenhuma publicação encontrada no banco de dados")
        print("    Execute uma busca de publicações primeiro!")

print("\n" + "="*60 + "\n")

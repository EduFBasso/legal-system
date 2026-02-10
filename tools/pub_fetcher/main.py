#!/usr/bin/env python3
"""
Publication Fetcher - CLI tool to fetch legal publications from PJe Comunica API.

Usage:
  python main.py --tribunal TJSP --oab 507553 --today
  python main.py --tribunal TJSP --oab 507553 --from 2026-01-30 --to 2026-02-02
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

import click
import requests


# Constants
API_URL = "https://comunicaapi.pje.jus.br/api/v1/comunicacao"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


def fetch_publications(tribunal, oab, data_inicio, data_fim):
    """Fetch publications from PJe Comunica API."""
    params = {
        "siglaTribunal": tribunal,
        "numeroOab": oab,
    }
    
    if data_inicio:
        params["dataDisponibilizacaoInicio"] = data_inicio
    if data_fim:
        params["dataDisponibilizacaoFim"] = data_fim
    
    try:
        click.echo(f"🔍 Consultando PJe Comunica API...", err=True)
        click.echo(f"   Tribunal: {tribunal}, OAB: {oab}", err=True)
        if data_inicio:
            click.echo(f"   Data início: {data_inicio}", err=True)
        if data_fim:
            click.echo(f"   Data fim: {data_fim}", err=True)
        
        response = requests.get(API_URL, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('status') != 'success':
            click.secho(f"❌ Erro na API: {data.get('message')}", fg='red', err=True)
            return None
        
        return data
        
    except requests.exceptions.RequestException as e:
        click.secho(f"❌ Erro ao conectar com API: {e}", fg='red', err=True)
        return None
    except json.JSONDecodeError:
        click.secho(f"❌ Erro ao decodificar resposta da API", fg='red', err=True)
        return None


def normalize_publications(items):
    """Normalize publications for storage and display."""
    import re
    
    normalized = []
    pattern = r'(\d{7})-(\d{2})\.(\d{4})\.(\d{1})\.(\d{2})\.(\d{4})\.(\d{5})'
    
    for item in items:
        texto = item.get('texto', '')
        matches = re.findall(pattern, texto)
        
        numero_processo = None
        if matches:
            m = matches[0]
            numero_processo = f"{m[0]}-{m[1]}.{m[2]}.{m[3]}.{m[4]}.{m[5]}.{m[6]}"
        
        pub = {
            "id_api": item.get('id'),
            "numero_processo": numero_processo,
            "tribunal": item.get('siglaTribunal'),
            "data_disponibilizacao": item.get('data_disponibilizacao'),
            "tipo_comunicacao": item.get('tipoComunicacao'),
            "orgao": item.get('nomeOrgao'),
            "meio": item.get('meio', ''),
            "texto_resumo": texto[:300] + "..." if len(texto) > 300 else texto,
            "texto_completo": texto,
            "hash": abs(hash(item.get('id'))) % 10**8
        }
        normalized.append(pub)
    
    return normalized


def save_to_json(data, filename):
    """Save data to JSON file."""
    filepath = OUTPUT_DIR / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return filepath


def display_summary(publications):
    """Display summary of fetched publications."""
    click.echo()
    click.secho(f"✅ Sucesso! {len(publications)} publicações obtidas.\n", fg='green', bold=True)
    
    for i, pub in enumerate(publications, 1):
        click.echo(f"📋 Publicação {i}")
        click.echo(f"   Processo: {pub['numero_processo'] or 'Não identificado'}")
        click.echo(f"   Tribunal: {pub['tribunal']}")
        click.echo(f"   Data: {pub['data_disponibilizacao']}")
        click.echo(f"   Tipo: {pub['tipo_comunicacao']}")
        click.echo(f"   Órgão: {pub['orgao']}")
        click.echo(f"   Resumo: {pub['texto_resumo'][:100]}...\n")


@click.command()
@click.option('--tribunal', default='TJSP', help='Sigla do tribunal (padrão: TJSP)')
@click.option('--oab', required=True, help='Número da OAB (obrigatório, sem formatação)')
@click.option('--today', is_flag=True, help='Usar data de hoje como período')
@click.option('--from', 'data_inicio', default=None, help='Data inicial (YYYY-MM-DD)')
@click.option('--to', 'data_fim', default=None, help='Data final (YYYY-MM-DD)')
@click.option('--output', default=None, help='Nome do arquivo de saída (padrão: auto-gerado)')
def main(tribunal, oab, today, data_inicio, data_fim, output):
    """
    Busca publicações jurídicas do PJe Comunica.
    
    Exemplos de uso:
    
    \b
    python main.py --tribunal TJSP --oab 507553 --today
    python main.py --tribunal TJSP --oab 507553 --from 2026-01-30 --to 2026-02-02
    """
    
    # Validar argumentos
    if today and (data_inicio or data_fim):
        click.secho("❌ Use --today OU --from/--to, não ambos.", fg='red')
        sys.exit(1)
    
    # Definir período
    if today:
        hoje = datetime.now().strftime('%Y-%m-%d')
        data_inicio = hoje
        data_fim = hoje
    elif not (data_inicio and data_fim):
        click.secho("❌ Especifique --today OU --from e --to.", fg='red')
        sys.exit(1)
    
    # Buscar dados
    result = fetch_publications(tribunal, oab, data_inicio, data_fim)
    
    if not result:
        sys.exit(1)
    
    # Processar e salvar
    publications = normalize_publications(result.get('items', []))
    
    if not publications:
        click.secho("⚠️  Nenhuma publicação encontrada para o período.", fg='yellow')
        sys.exit(0)
    
    # Gerar nome do arquivo se não especificado
    if not output:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output = f"publications_{tribunal}_{oab}_{timestamp}.json"
    
    # Salvar resultado
    filepath = save_to_json(publications, output)
    click.secho(f"💾 Salvo em: {filepath}", fg='cyan')
    
    # Exibir resumo
    display_summary(publications)


if __name__ == '__main__':
    main()

import requests
import json

# Testar API diretamente para ver todos os campos
api_url = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao'

params = {
    'siglaTribunal': 'TJSP',
    'numeroOab': '507553',
    'dataDisponibilizacaoInicio': '2026-02-18',
    'dataDisponibilizacaoFim': '2026-02-18'
}

print('Consultando API...')
response = requests.get(api_url, params=params, timeout=15)

if response.status_code == 200:
    data = response.json()
    
    print(f'\nTipo de resposta: {type(data)}')
    
    # Se for dicionário, mostrar chaves
    if isinstance(data, dict):
        print(f'Chaves: {list(data.keys())}')
        
        # Buscar lista de itens
        items = data.get('items', []) or data.get('data', []) or data.get('publicacoes', [])
        
        if not items and 'content' in data:
            items = data['content']
        
        print(f'\nTotal de itens: {len(items)}')
        
        if items:
            print('\n=== CAMPOS DISPONÍVEIS NO PRIMEIRO ITEM ===')
            first_item = items[0]
            
            # Mostrar todos os campos
            for key, value in first_item.items():
                if isinstance(value, str) and len(value) > 100:
                    print(f'{key}: {value[:100]}...')
                else:
                    print(f'{key}: {value}')
            
            # Salvar JSON completo para análise
            with open('api_response_sample.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print('\n✅ Resposta completa salva em api_response_sample.json')
    else:
        print(f'\nTotal de resultados: {len(data)}')
        
        if data:
            print('\n=== CAMPOS DISPONÍVEIS NO PRIMEIRO ITEM ===')
            first_item = data[0]
            
            # Mostrar todos os campos
            for key, value in first_item.items():
                if isinstance(value, str) and len(value) > 100:
                    print(f'{key}: {value[:100]}...')
                else:
                    print(f'{key}: {value}')
            
            # Salvar JSON completo para análise
            with open('api_response_sample.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print('\n✅ Resposta completa salva em api_response_sample.json')
else:
    print(f'Erro: {response.status_code}')

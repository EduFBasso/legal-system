import requests

# Testar endpoint
response = requests.get('http://127.0.0.1:8000/api/publications/today')
data = response.json()

if data.get('success') and data.get('publicacoes'):
    print('\n=== TESTE DE LINKS ===')
    for pub in data['publicacoes'][:3]:
        print(f"\nProcesso: {pub['numero_processo']}")
        print(f"Link: {pub['link_oficial']}")
else:
    print('Nenhuma publicação encontrada')

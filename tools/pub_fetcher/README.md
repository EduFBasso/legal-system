# Publication Fetcher

CLI tool para buscar publicações jurídicas do PJe Comunica.

## Instalação

### Pré-requisitos
- Python 3.8+
- pip (gerenciador de pacotes Python)

### Passos
1. Clonar ou extrair este diretório.
2. Abrir terminal/prompt na pasta.
3. Instalar dependências:
   ```bash
   pip install -r requirements.txt
   ```

## Uso

### Opção 1: Buscar publicações de hoje
```bash
python main.py --tribunal TJSP --oab 507553 --today
```

### Opção 2: Buscar publicações de um período
```bash
python main.py --tribunal TJSP --oab 507553 --from 2026-01-30 --to 2026-02-02
```

### Parâmetros
- `--tribunal` (padrão: TJSP): Sigla do tribunal (ex: TJSP, TRF3, TRT15)
- `--oab` (obrigatório): Número da OAB sem formatação (ex: 507553)
- `--today`: Usar data de hoje como período
- `--from` e `--to`: Data inicial e final (formato YYYY-MM-DD)
- `--output` (opcional): Nome customizado para arquivo de saída

## Saída

Os resultados são salvos em JSON na pasta `output/` com nome:
```
publications_TJSP_507553_20260210_143022.json
```

Exemplo de estrutura:
```json
[
  {
    "id_api": 516309493,
    "numero_processo": "1003498-11.2021.8.26.0533",
    "tribunal": "TJSP",
    "data_disponibilizacao": "2026-01-30",
    "tipo_comunicacao": "Intimação",
    "orgao": "Unidade de Processamento Judicial de Direito Privado 3",
    "texto_resumo": "DESPACHO...",
    "texto_completo": "...",
    "hash": 16309493
  }
]
```

## Gerando .exe para Windows

### No macOS/Linux (compilação cruzada):
```bash
pip install pyinstaller
pyinstaller --onefile main.py --name pub_fetcher
```
(Nota: Para gerar .exe real, é melhor usar Windows)

### No Windows (recomendado):
1. Clonar repositório no Windows.
2. Instalar Python 3.8+ (https://python.org).
3. Abrir PowerShell/CMD na pasta.
4. Executar:
   ```bash
   pip install -r requirements.txt
   pip install pyinstaller
   pyinstaller --onefile main.py --name pub_fetcher
   ```
5. Executável gerado em: `dist/pub_fetcher.exe`

## Troubleshooting

**"ModuleNotFoundError: No module named 'click'"**
- Solução: `pip install -r requirements.txt`

**"ConnectionError"**
- Verifique conexão com internet
- Verifique se a API do PJe está online

**"0 publicações encontradas"**
- Verifique se o número da OAB está correto
- Verifique se há publicações no período solicitado

## Future Enhancements
- Suporte para múltiplos tribunais na mesma busca
- Busca por número de processo
- Integração direta com banco de dados do sistema

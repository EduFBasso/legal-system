# Build Guide: Gerando .exe para Windows

## O que é PyInstaller?

PyInstaller é uma ferramenta que transforma programas Python em executáveis standalone, sem necessidade de instalar Python no computador do usuário final.

## Opção 1: Gerar .exe no Windows (Recomendado)

### Pré-requisitos
1. Windows 10 ou superior
2. Python 3.8+ instalado (https://python.org)

### Passos

1. **Clonar/extrair o repositório no Windows**
   ```
   C:\Users\seu_usuario\Documents\legal-system\
   ```

2. **Abrir PowerShell ou CMD na pasta do projeto**
   ```
   cd C:\Users\seu_usuario\Documents\legal-system\tools\pub_fetcher
   ```

3. **Criar ambientes virtual (opcional, mas recomendado)**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

4. **Instalar dependências**
   ```bash
   pip install -r requirements.txt
   pip install pyinstaller
   ```

5. **Gerar executável**
   ```bash
   pyinstaller --onefile main.py --name pub_fetcher
   ```

6. **Resultado**
   - Executável estará em: `dist\pub_fetcher.exe`
   - Você pode copiar este arquivo e enviar para qualquer computador Windows

## Opção 2: Gerar .exe no macOS (Compilação Cruzada)

**Nota**: A compilação cruzada no macOS gera .exe para Windows, mas com a ressalva de que o Windows pode precisar de Visual C++ Redistributable.

### Passos

```bash
cd /Users/eduardofigueiredobasso/Documents/legal-system/tools/pub_fetcher

# Instalar PyInstaller
pip install pyinstaller

# Gerar executável
pyinstaller --onefile main.py --name pub_fetcher --target-arch x86_64 --win-private-code-key

# O resultado sairá em: dist/pub_fetcher.exe
```

## Como usar o .exe

### No computador da advogada (Windows)

1. **Copiar o arquivo `pub_fetcher.exe` para qualquer pasta** (ex: Desktop)

2. **Abrir PowerShell/CMD naquela pasta**
   ```
   Shift + Right-click > Open PowerShell window here
   ```

3. **Executar**
   ```bash
   .\pub_fetcher.exe --tribunal TJSP --oab 507553 --today
   
   # ou com período personalizado
   .\pub_fetcher.exe --tribunal TJSP --oab 507553 --from 2026-01-30 --to 2026-02-02
   ```

4. **Arquivo de saída** será criado em: `output\publications_TJSP_507553_....json`

## Otimizações (opcional)

Se o .exe ficar muito grande (>100MB), você pode:

```bash
# Gerar sem console (executa silenciosamente)
pyinstaller --onefile --noconsole main.py --name pub_fetcher

# Ou com UPX compression (mais rápido)
pip install upx
pyinstaller --onefile --upx-dir=/path/to/upx main.py
```

## Troubleshooting

**"'pyinstaller' is not recognized"**
- Certifique-se de que instalou: `pip install pyinstaller`

**Arquivo .exe muito grande (>200MB)**
- É normal. Inclui embutido o Python runtime.
- Para reduzir, use: `pyinstaller --onefile -w main.py`

**Antivírus marca como suspeito**
- PyInstaller às vezes dispara falsos positivos
- Solução: adicionar exceção no antivírus (comum em corporações)

## Próximas Steps

Assim que o .exe estiver construído:
1. Teste localmente no Windows
2. Envie para a advogada via WhatsApp
3. Peça feedback sobre a interface e funcionalidade
4. Faça ajustes conforme necessário

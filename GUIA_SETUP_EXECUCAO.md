# 🚀 GUIA COMPLETO DE SETUP E EXECUÇÃO

**Objetivo:** Fazer o projeto rodar em minutos usando scripts automatizados ou manualmente.

---

## 📋 CHECKLIST PRÉ-REQUISITOS

Antes de começar, verifique se tem instalado:

### Software Obrigatório

- [ ] **Python 3.11+** → [python.org](https://www.python.org/downloads/)
  ```bash
  python --version
  ```
- [ ] **Node.js 20.20.0 LTS** → [nodejs.org](https://nodejs.org/)
  ```bash
  node --version
  npm --version
  ```
- [ ] **Git** → [git-scm.com](https://git-scm.com/)
  ```bash
  git --version
  ```
- [ ] **Visual Studio Code** (recomendado)

### Windows PowerShell

```bash
# Verifique se está em PowerShell
$PSVersionTable.PSVersion
# Deve ser 5.1+ ou 7+
```

---

## ⚡ INICIALIZAÇÃO RÁPIDA (Automática)

### Opção 1: Duplo Clique (Más Fácil)

1. Vá para `c:\dev\legal-system`
2. Duplo clique em **`INICIAR_SISTEMA.bat`**
3. Aguarde ~15 segundos
4. O navegador abre automaticamente em `http://localhost:5173`

**Pronto!** ✅

### Opção 2: PowerShell (Com Mais Controle)

```powershell
# 1. Abre PowerShell no diretório do projeto
cd c:\dev\legal-system

# 2. Ativa o ambiente virtual
& .venv\Scripts\Activate.ps1

# 3. Inicia o backend (em uma aba)
cd backend
python manage.py runserver 0.0.0.0:8000

# 4. Em outra aba do PowerShell (Ctrl+Shift+N)
cd c:\dev\legal-system
cd frontend
npm run dev

# 5. Navegador abre em http://localhost:5173
```

---

## 🔧 CONFIGURAÇÃO MANUAL (Primeira Vez)

### Passo 1: Clone o Repositório

```bash
# Se ainda não tem o projeto
git clone https://github.com/seu-repo/legal-system.git
cd legal-system
```

---

### Passo 2: Configure o Ambiente Python

#### 2.1 Crie Virtual Environment (primeira vez)

```bash
# Windows PowerShell
python -m venv .venv

# Ativa
& .venv\Scripts\Activate.ps1

# Verifique (deve ter (.venv) no prompt)
python --version
```

#### 2.2 Instale Dependências Django

```bash
cd backend

# Instale do requirements.txt
pip install -r requirements.txt

# Verifique instalação
pip list | grep Django
# Deve mostrar Django 4.2.28
```

#### 2.3 Configure Variáveis de Ambiente

```bash
# Crie arquivo .env no backend/
cat > .env << EOF
DEBUG=True
SECRET_KEY=django-insecure-sua-chave-secreta-aqui-123456789
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
EOF
```

#### 2.4 Configure Banco de Dados

```bash
# Dentro de backend/
python manage.py migrate

# Crie superuser (opcional)
python manage.py createsuperuser
# Username: admin
# Password: sua-senha

# Carregue dados de teste (se houver)
python manage.py loaddata data/contacts_sample.json  # Se existir
```

#### 2.5 Teste Backend

```bash
python manage.py runserver 0.0.0.0:8000
# Acesse: http://localhost:8000/api/contacts/
# Deve retornar JSON
```

---

### Passo 3: Configure o Ambiente React

#### 3.1 Instale Dependências Node

```bash
cd frontend

# Instale node_modules
npm install

# Verifique
npm list react react-dom
# Deve mostrar React 19.2.0
```

#### 3.2 Configure .env Frontend (se necessário)

```bash
# frontend/.env (caso precise customizar)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
EOF
```

#### 3.3 Teste Frontend

```bash
npm run dev
# Abre http://localhost:5173 automaticamente
```

---

## 🎮 USANDO O SISTEMA

### Interface Principal

```
┌─────────────────────────────────────────────────────┐
│ 🏛️ LEGAL SYSTEM - Sistema Jurídico                 │
├──────────┬──────────────────┬──────────────────────┤
│ MENU     │                  │   SIDEBAR DIREITA    │
│          │                  │  (Contatos/Casos)    │
│ 📋 Página│    CONTEÚDO      │                      │
│ Contatos │     PRINCIPAL    │  Cards com dados     │
│          │                  │                      │
│ 📰 Publ. │      (exibe      │  [+ Novo]            │
│          │    detalhes      │  [🔍 Search...]      │
│ 📁 Casos │     ou lista)    │                      │
│          │                  │                      │
│ ⚙️ Settings                 │                      │
└──────────┴──────────────────┴──────────────────────┘
```

### Navegação

| Seção           | O que faz                           | Pronto? |
| --------------- | ----------------------------------- | ------- |
| **Contatos**    | CRUD de clientes, advogados, partes | ✅ 100% |
| **Publicações** | Busca de intimações em tribunais    | ✅ 100% |
| **Casos**       | Gestão de processos judiciais       | ⏳ 30%  |
| **⚙️ Settings** | Preferências, senha de exclusão     | ✅ 100% |

---

## 📱 ACESSANDO OS SERVIÇOS

### Frontend (Aplicação Principal)

```
http://localhost:5173

Principais páginas:
- Contatos: http://localhost:5173/#/contacts
- Publicações: http://localhost:5173/#/publications
- Casos: http://localhost:5173/#/cases
```

### Backend API

```
http://localhost:8000/api/

Endpoints:
- GET    /api/contacts/               # Listar contatos
- POST   /api/contacts/               # Criar contato
- GET    /api/contacts/{id}/          # Detalhe
- PUT    /api/contacts/{id}/          # Editar
- DELETE /api/contacts/{id}/          # Deletar

GET    /api/publications/             # Histórico
POST   /api/publications/search/      # Nova busca

GET    /api/cases/                    # Listar casos
POST   /api/cases/                    # Criar caso
```

### Django Admin

```
http://localhost:8000/admin/

Acesso:
- Username: admin
- Password: sua-senha (criada com createsuperuser)

Gerenciar:
- Contatos (/admin/contacts/contact/)
- Publicações (/admin/publications/publication/)
- Casos (/admin/cases/case/)
```

---

## 🧪 EXECUTANDO TESTES

### Backend - Testes Unitários

```bash
cd backend

# Rodar todos os testes
pytest

# Rodar com verbosidade
pytest -v

# Rodar apenas um app
pytest apps/contacts/

# Com coverage (cobertura)
pytest --cov=apps --cov-report=html
# Abre htmlcov/index.html
```

### Frontend - Testes Unitários

```bash
cd frontend

# Rodar testes
npm run test

# Com UI interativa
npm run test:ui

# Cobertura
npm run test:coverage

# Relatório em coverage/index.html
```

### Linting (Verificação de Código)

```bash
# Backend (pylint, flake8)
cd backend
flake8 apps/
pylint apps/

# Frontend (ESLint)
cd frontend
npm run lint
```

---

## 🛑 PARANDO O SISTEMA

### Opção 1: Duplo Clique

```
c:\dev\legal-system\PARAR_SISTEMA.bat
```

### Opção 2: PowerShell (em cada aba)

```bash
# Para backend (na aba)
Ctrl+C

# Para frontend (na aba)
Ctrl+C
```

### Opção 3: Kill Processes

```bash
# Se ficar travado, force
Get-Process python | Stop-Process -Force
Get-Process node | Stop-Process -Force
```

---

## 🐛 TROUBLESHOOTING COMUM

### ❌ Erro: "ModuleNotFoundError: No module named 'django'"

**Solução:**

```bash
# 1. Verifique se venv está ativado
& .venv\Scripts\Activate.ps1

# 2. Reinstale dependências
pip install -r backend/requirements.txt

# 3. Verifique a instalação
pip list | grep Django
```

---

### ❌ Erro: "Port 8000 already in use"

**Solução 1: Libere a porta**

```bash
# Encontre o processo usando porta 8000
Get-NetTCPConnection -LocalPort 8000 -ErrorAction Ignore

# Mate o processo (substitua <PID> pelo ID real)
Stop-Process -Id <PID> -Force

# Reinicie o Django
python manage.py runserver
```

**Solução 2: Use outra porta**

```bash
python manage.py runserver 8001
# Acesse http://localhost:8001
```

---

### ❌ Erro: "npm: command not found"

**Solução:**

```bash
# Verifique instalação do Node
node --version
npm --version

# Se não reconhecer, reinstale Node.js
# https://nodejs.org/ (LTS)

# Depois acrescente ao PATH se necessário
$env:Path += ";C:\Program Files\nodejs"
```

---

### ❌ Erro: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solução:** (já está configurado, mas se não funcionar)

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
```

Reinicie backend:

```bash
python manage.py runserver
```

---

### ❌ Erro: "Error: ENOSPC: no space to watch file changes"

**Solução:**

```bash
# Suba o limite de inotify (Linux/WSL)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### ❌ Database locked ou corrupto

**Solução:**

```bash
# Backup do antigo
ren backend\db.sqlite3 db.sqlite3.bak

# Recrie limpo
cd backend
python manage.py migrate

# Carregue dados se houver
python manage.py loaddata initial_data.json
```

---

## 💾 BACKUP E RESTAURAÇÃO

### Backup Manual

```bash
# Copiar banco de dados
Copy-Item backend\db.sqlite3 backend\db.sqlite3.bak

# Backup completo (com compressão)
Compress-Archive -Path . -DestinationPath legal-system-backup.zip
```

### Restauração

```bash
# Restaurar banco
Copy-Item backend\db.sqlite3.bak backend\db.sqlite3

# Ou recriar
cd backend
python manage.py migrate
python manage.py loaddata backup.json
```

---

## 🔄 ATUALIZAR DEPENDÊNCIAS

### Backend

```bash
cd backend

# Ver atualizações disponíveis
pip list --outdated

# Atualizar tudo
pip install --upgrade -r requirements.txt

# Atualizar package específico
pip install --upgrade Django
```

### Frontend

```bash
cd frontend

# Ver atualizações disponíveis
npm outdated

# Atualizar tudo
npm update

# Atualizar package específico
npm install react@latest
```

---

## 📊 VERIFICAR STATUS DO SISTEMA

### Script de Diagnóstico

```bash
# Crie diagnostic.ps1
cat > diagnostic.ps1 << 'EOF'
Write-Host "=== DIAGNÓSTICO DO SISTEMA ===" -ForegroundColor Green
Write-Host ""

# Python
Write-Host "Python:" -ForegroundColor Yellow
python --version

# Django
Write-Host "Django:" -ForegroundColor Yellow
python -c "import django; print(f'Django {django.get_version()}')"

# Node
Write-Host "Node.js:" -ForegroundColor Yellow
node --version

# npm
Write-Host "npm:" -ForegroundColor Yellow
npm --version

# Verifique portas
Write-Host "Portas em uso:" -ForegroundColor Yellow
Get-NetTCPConnection -State Listen | Select-Object @{Name="Process";Expression={(Get-Process | Where-Object {$_.Id -eq $_.OwningProcess} | Select-Object -ExpandProperty Name)}}, LocalAddress, LocalPort

# Banco de dados
Write-Host "Banco de dados:" -ForegroundColor Yellow
if (Test-Path backend\db.sqlite3) {
    $size = (Get-Item backend\db.sqlite3).Length / 1KB
    Write-Host "db.sqlite3: $([math]::Round($size, 2)) KB"
} else {
    Write-Host "db.sqlite3: NÃO ENCONTRADO"
}

EOF

# Execute
.\diagnostic.ps1
```

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

Leia na seguinte ordem:

1. **[ESTADO_DO_PROJETO.md](ESTADO_DO_PROJETO.md)** - Visão geral e status
2. **[ARQUITETURA_VISUAL.md](docs/ARQUITETURA_VISUAL.md)** - Diagramas e fluxos
3. **[DECISOES_CONFIRMADAS.md](docs/DECISOES_CONFIRMADAS.md)** - Por que cada decisão foi tomada
4. **[README.md](README.md)** - Documentação geral
5. **[CHANGELOG.md](docs/CHANGELOG.md)** - Histórico de commits

---

## 🎓 PRÓXIMOS PASSOS

### Se quer contribuir:

1. Leia os documentos acima
2. Escolha uma feature da lista [ROADMAP]
3. Crie um branch: `git checkout -b feature/nome-da-feature`
4. Desenvolva, teste, faça commit
5. Abra um Pull Request

### Se quer usar o sistema:

1. Siga "Inicialização Rápida"
2. Comece na página Contatos
3. Teste CRUD (Create, Read, Update, Delete)
4. Explore Publicações
5. Reporte erros ou sugestões

---

## ✅ CHECKLIST FINAL

Antes de considerar pronto:

- [ ] Backend rodando em `http://localhost:8000`
- [ ] Frontend rodando em `http://localhost:5173`
- [ ] API respondendo com JSON em `/api/contacts/`
- [ ] Admin Django acessível em `/admin/`
- [ ] Banco de dados criado com tabelas
- [ ] Testes passam (`pytest` e `npm run test`)
- [ ] Sem erros de CORS no console
- [ ] Contatos podem ser criados/editados/deletados

---

**Última atualização:** 24 de fevereiro de 2026

Precisa de ajuda? Verifique os troubleshooting acima! 🚀

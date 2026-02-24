# 📊 ESTADO DO PROJETO - Legal System

**Data:** 24 de fevereiro de 2026  
**Versão:** 0.2.0 (Publicações + Contatos)  
**Tipo:** Sistema jurídico local-first para escritório de advocacia  
**Cliente:** 1 Advogado (rede local)

---

## 🎯 Visão Geral do Projeto

Sistema de gestão jurídica minimalista e funcional, desenvolvido com:

- **Backend:** Django REST Framework
- **Frontend:** React com Vite
- **Database:** SQLite3 nativo (local)
- **Deployment:** Rede local (LAN) - sem internet
- **Filosofia:** "Roupa sob medida" - apenas o que é realmente usado

### Diferenciais

✅ Acessibilidade (fontes grandes, alto contraste)  
✅ Funciona totalmente offline  
✅ Instalação simples (duplo clique)  
✅ Zero custo (sem mensalidade)  
✅ Escalável para múltiplos usuários

---

## 🏗️ ARQUITETURA ATUAL

### Stack Tecnológico

```
BACKEND (Python)
├── Django 4.2.28
├── Django REST Framework 3.16.1
├── Django Filters 24.2
├── Django CORS Headers 4.6.0
├── SQLite3 (nativo)
└── Pillow 12.1.1 (imagens)

FRONTEND (JavaScript)
├── React 19.2.0
├── Vite 7.3.1
├── React Router DOM 7.13.0
├── Lucide React (ícones)
└── CSS Modules + Variables

INFRA
├── Python 3.11+
├── Node.js 20.20.0 LTS
└── Windows (local)
```

### Estrutura de Pastas

```
legal-system/
│
├── backend/                          # 🟦 API Django
│   ├── config/                       # Settings, URLs, WSGI/ASGI
│   │   ├── settings.py              # Django settings
│   │   ├── urls.py                  # Router principal
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── apps/                        # Feature-based apps
│   │   ├── contacts/                # ✅ IMPLEMENTADO
│   │   │   ├── models.py           # Model Contact (19 campos)
│   │   │   ├── views.py            # ViewSet ContactViewSet
│   │   │   ├── serializers.py      # Serializers (List + Detail)
│   │   │   ├── urls.py
│   │   │   ├── admin.py            # Admin interface
│   │   │   ├── filters.py          # django-filter
│   │   │   └── migrations/
│   │   │
│   │   ├── publications/            # ✅ IMPLEMENTADO
│   │   │   ├── models.py           # Publication, SearchHistory
│   │   │   ├── views.py            # PublicationsViewSet
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── migrations/
│   │   │
│   │   ├── cases/                   # ⏳ EM DESENVOLVIMENTO
│   │   │   ├── models.py           # Case, CaseParty, CaseMovement
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── migrations/
│   │   │
│   │   └── notifications/           # 🔜 PLANEJADO
│   │
│   ├── services/                    # Business logic
│   │   └── pje_comunica.py         # Integração com API PJe
│   │
│   ├── scripts/                     # Ferramentas admin
│   │   ├── check_history.py
│   │   ├── fix_links.py
│   │   └── ... (15+ scripts)
│   │
│   ├── db.sqlite3                  # 📦 Banco de dados local
│   ├── manage.py
│   ├── requirements.txt            # Dependências Python
│   └── conftest.py                # Testes
│
├── frontend/                        # 🟨 SPA React
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # 🆕 Componentes reutilizáveis
│   │   │   │   ├── Toast.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   └── FormField.jsx
│   │   │   │
│   │   │   ├── contacts/           # ✅ IMPLEMENTADO
│   │   │   │   ├── ContactCard.jsx
│   │   │   │   ├── ContactDetailModal.jsx
│   │   │   │   └── ContactForm.jsx
│   │   │   │
│   │   │   ├── publications/       # ✅ IMPLEMENTADO
│   │   │   │   ├── PublicationsList.jsx
│   │   │   │   ├── PublicationsStats.jsx
│   │   │   │   └── PublicationDetailModal.jsx
│   │   │   │
│   │   │   ├── cases/              # ⏳ COMEÇADO
│   │   │   │   ├── CaseCard.jsx
│   │   │   │   ├── CaseDetailModal.jsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── Header.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── MainContent.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   ├── contexts/               # Global state (Context API)
│   │   │   ├── SettingsContext.jsx
│   │   │   ├── PublicationsContext.jsx
│   │   │   └── CasesContext.jsx
│   │   │
│   │   ├── hooks/                  # Custom hooks
│   │   │   ├── usePublications.js
│   │   │   └── useCases.js
│   │   │
│   │   ├── pages/                  # Page-level components
│   │   │   ├── ContactsPage.jsx
│   │   │   ├── PublicationsPage.jsx
│   │   │   ├── CasesPage.jsx
│   │   │   └── ...
│   │   │
│   │   ├── services/               # API clients
│   │   │   ├── api.js             # HTTP client (axios-like)
│   │   │   ├── contactsService.js
│   │   │   ├── publicationsService.js
│   │   │   └── casesService.js
│   │   │
│   │   ├── utils/                  # Helper functions
│   │   │   ├── masks.js           # Input masks (CPF, CNPJ, etc)
│   │   │   └── formatters.js      # Data formatters
│   │   │
│   │   ├── styles/
│   │   │   ├── palette.css        # Design system
│   │   │   └── ...
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── vitest.config.js
│
├── docs/                           # 📚 Documentação técnica
│   ├── DECISOES_CONFIRMADAS.md
│   ├── CASES_STUDY.md
│   ├── PUBLICATIONS_SPEC.md
│   ├── LAYOUT_SPEC.md
│   ├── CHANGELOG.md
│   └── ... (12+ documentos)
│
├── data/                           # 📦 Dados para desenvolvimento
├── tools/                          # 🔧 Scripts utilitários
│   └── pub_fetcher/               # Scraper de publicações
│
└── infra/                         # 🚀 Scripts operacionais
    ├── INICIAR_SISTEMA.bat
    ├── PARAR_SISTEMA.bat
    └── install_sqlite.ps1
```

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1️⃣ APP: CONTACTS (Contatos) - ✅ 100% COMPLETO

**O que faz:** Gestão completa de clientes e pessoas de interesse

#### Backend

- ✅ Model `Contact` com 19 campos
- ✅ Admin interface completa com filtros
- ✅ API REST (CRUD completo)
- ✅ Serializers: `ContactListSerializer` + `ContactDetailSerializer`
- ✅ Validações: CPF/CNPJ com algoritmo correto
- ✅ Filtros: por tipo, busca textual

#### Frontend

- ✅ ContactsPage com layout 3-coluna
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Busca em tempo real (filtro in-memory)
- ✅ ContactDetailModal com 3 modos: VIEW/EDIT/CREATE
- ✅ Máscaras de input: CPF, CNPJ, telefone, CEP
- ✅ Settings modal (preferências, senha de exclusão)
- ✅ Mini-cards com ícones (PF/PJ)

#### Status

- **Estado:** Pronto para produção
- **Teste:** Manual validado com a advogada
- **Dados:** 6 contatos de teste no banco

---

### 2️⃣ APP: PUBLICATIONS (Publicações) - ✅ 100% COMPLETO

**O que faz:** Busca automática de intimações em tribunais

#### Backend

- ✅ Model `Publication` com todos os campos
- ✅ Model `SearchHistory` para rastrear buscas
- ✅ API para busca multi-tribunal
- ✅ Integração com PJe Comunica (8 estratégias paralelas)
- ✅ Parser de HTML com preservação de formatação

#### Frontend

- ✅ PublicationsPage com formulário de busca
- ✅ Filtros: período + seleção de tribunais
- ✅ Busca com spinner/loading state
- ✅ Lista de resultados com cards
- ✅ PublicationDetailModal com HTML renderizado
- ✅ PublicationsStats widget (última busca)
- ✅ Botão "Consultar no ESAJ" com auto-copy

#### Status

- **Estado:** Pronto para produção
- **Teste:** Manual validado, todas as features funcionando
- **Tribunais:** TJSP, TRF3, TRT2, TRT15 (escalável)

---

### 3️⃣ APP: CASES (Processos) - ⏳ EM DESENVOLVIMENTO

**O que faz:** Gestão de processos judiciais com relacionamento a clientes

#### Backend - ✅ Modelos Prontos

```python
✅ Case           # Processo (número CNJ, tribunal, status)
✅ CaseParty      # Partes envolvidas (cliente, contrários)
✅ CaseMovement   # Movimentações (datas, eventos)
```

- ✅ Model `Case` com 25 campos bem estruturados
- ✅ Validação de número CNJ (formato regulado)
- ✅ Relacionamento ManyToMany com Contacts
- ✅ Cálculo automático de prazos
- ✅ Admin interface
- ✅ Migrations criadas

#### Frontend - 🔨 Em Progresso

- ⏳ CasesPage (lista)
- ⏳ CaseCard component
- ⏳ CaseDetailModal (CRUD com integração de partes)
- ⏳ Máscara CNJ em input
- ⏳ Modal de gerenciamento de partes

#### Status

- **Backend:** ~80% pronto (models validados, faltam viewsets)
- **Frontend:** ~30% pronto (estrutura iniciada)
- **Timeline:** Próximo foco após publicações

---

### 4️⃣ APP: NOTIFICATIONS (Notificações) - 🔜 PLANEJADO

**O que faz:** Alertas de prazos, intimações e eventos

#### Planejado

- Notificações Web Push
- Email para lembrete de prazos
- Dashboard de pendências
- Sincronização de datas de prazos

---

## 📋 TECNOLOGIAS UTILIZADAS

### Backend

| Tecnologia          | Versão | Propósito                |
| ------------------- | ------ | ------------------------ |
| Django              | 4.2.28 | Framework web            |
| DRF                 | 3.16.1 | API REST                 |
| django-filter       | 24.2   | Filtros na API           |
| django-cors-headers | 4.6.0  | CORS para frontend       |
| Pillow              | 12.1.1 | Processamento de imagens |
| reportlab           | 4.4.9  | Relatórios PDF (futuro)  |
| requests            | 2.32.5 | HTTP requests            |
| python-decouple     | 3.8    | Variáveis de ambiente    |

### Frontend

| Tecnologia   | Versão  | Propósito        |
| ------------ | ------- | ---------------- |
| React        | 19.2.0  | UI framework     |
| Vite         | 7.3.1   | Build tool       |
| React Router | 7.13.0  | Roteamento       |
| Lucide React | 0.574.0 | Ícones           |
| Vitest       | 4.0.18  | Testes unitários |
| ESLint       | 9.39.1  | Linting          |

### Database

- **SQLite3** (nativo) - ideal para local-first
- **Localizado em:** `backend/db.sqlite3`
- **Tamanho:** Pequeno (< 1MB com dados de teste)

---

## 🚀 COMO EXECUTAR O PROJETO

### Pré-requisitos

```bash
✅ Python 3.11+
✅ Node.js 20.20.0 LTS
✅ Git
✅ PowerShell (Windows)
```

### Instalação Inicial

#### 1. Clone o repositório

```bash
cd c:\dev\legal-system
```

#### 2. Configure o Backend

```bash
# Ative o virtual environment
& c:\dev\legal-system\.venv\Scripts\Activate.ps1

# Instale dependências
pip install -r backend/requirements.txt

# Execute migrations
cd backend
python manage.py migrate

# Crie superuser (opcional)
python manage.py createsuperuser

# Inicie o servidor
python manage.py runserver 0.0.0.0:8000
```

#### 3. Configure o Frontend

```bash
cd frontend

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

#### 4. Acesse no navegador

```
http://localhost:5173  # Frontend (Vite)
http://localhost:8000/admin  # Django Admin
http://localhost:8000/api/  # API REST
```

### Atalhos (Produção)

```bash
# Executar tudo com duplo clique
INICIAR_SISTEMA.bat    # Inicia backend + frontend
PARAR_SISTEMA.bat      # Para ambos os servidores
```

---

## 🔄 FLUXO DE DESENVOLVIMENTO

### Padrão de Feature

1. **Criar branch** `feature/nome-feature`
2. **Desenvolver com TDD:**
   - Backend: Django app com models, serializers, views
   - Frontend: Componentes, contexts, services
3. **Testar manualmente** com a advogada
4. **Merge para `main`** após validação

### Convenções

- **Apps:** Inglês (contacts, publications, cases)
- **Comentários:** Português
- **Commits:** Conventional Commits (feat:, fix:, chore:, docs:)
- **Database:** Migrations automáticas por app

---

## 📊 ROADMAP - PRÓXIMAS FASES

### 🔄 Fase 2: Refatoração (EM ANDAMENTO)

**Objetivo:** Criar componentes comuns reutilizáveis

Componentes já criados:

- ✅ `Toast.jsx` - Notificações temporárias
- ✅ `ConfirmDialog.jsx` - Modal de confirmação
- ✅ `FormField.jsx` - Input field com validação

Componentes pendentes:

- 🔨 `Button` - Botões padronizados
- 🔨 `Badge` - Etiquetas de status
- 🔨 `SearchBox` - Campo de busca reutilizável

**Estimativa:** 1 semana

---

### 📁 Fase 4: Cases (PRÓXIMO FOCO) - 4-6 SEMANAS

#### Backend (1 semana)

```
✅ Models: Case, CaseParty, CaseMovement
⏳ ViewSets: CaseViewSet, CasePartyViewSet
⏳ Serializers: Case (Detail + List)
⏳ Filters: por tipo, status, tribunal
⏳ Admin interface
```

#### Frontend (2-3 semanas)

```
⏳ CasesPage (lista + sidebar)
⏳ CaseCard (mini-card com info essencial)
⏳ CaseDetailModal (VIEW/EDIT/CREATE)
⏳ CasePartyManager (modal para gerenciar partes)
⏳ Máscaras: CNJ (1234567-89.2021.8.26.0100)
⏳ Validações: número CNJ, datas lógicas
⏳ Timeline de movimentações
```

#### Testes (1 semana)

```
⏳ Testes manuais com advogada
⏳ Validação de fluxos CRUD
⏳ Testes de integração (contacts + cases)
```

---

### 📅 Fase 5: Notificações & Agenda - 6-8 SEMANAS

**Features:**

- Alertas de prazos (X dias antes)
- Notificações Web Push
- Dashboard de pendências
- Calendário de audiências
- Email de lembretes

---

### 📊 Fase 6: Relatórios - 2-4 SEMANAS (FUTURO)

**Features:**

- Relatórios por cliente
- Estatísticas de casos (ganhos/perdidos)
- Gráficos de atividade
- Exportar para PDF/Excel

---

### 🔐 Fase 7: Múltiplos Usuários - FUTURO

**Features:**

- Sistema de autenticação (Login/Logout)
- Permissões por usuário
- Histórico de ações
- Backup automático

---

## 🎓 TIPO DE AGENTE RECOMENDADO PARA ESTE PROJETO

Considerando a natureza do projeto (Django + React, backend SQLite, rede local), minha recomendação é:

### ✅ **AGENTE ESPECIALISTA EM STACK FULL-STACK**

**Por quê?**

1. **Projeto possui ambos:** Backend Django + Frontend React
2. **Integração necessária:** API REST com CORS configurado
3. **Database local:** SQLite3 exige conhecimento de migrations e ORM
4. **Escalabilidade incremental:** Fases bem definidas com dependências

### Seu Perfil Ideal

- ✅ **Experiência Django:** Modelos, ORM, serializers, viewsets
- ✅ **Experiência React:** Hooks, Context API, componentização
- ✅ **Full-stack mindset:** Pensar em como frontend consume backend
- ✅ **Boas práticas:** Migrations, testes, versionamento
- ✅ **Acessibilidade:** Importante para este cliente (advogada)

### Tags/Skills para Buscar

```
#django #drf #react #vite #sqlite3 #responsive
#accessibility #fullstack #local-first #small-team
```

### Recomendação de Estrutura de Trabalho

1. **Um dev full-stack** (ou 2: 1 backend + 1 frontend)
2. **Pair programming** regularmente (integração API-React)
3. **Testes manuais com a advogada** a cada feature
4. **Design thinking:** Interface deve ser super intuitiva (cliente não é dev)

---

## 🧪 TESTES

### Backend

```bash
# Rodar testes unitários
cd backend
pytest

# Com cobertura
pytest --cov=apps
```

### Frontend

```bash
# Rodar testes unitários
cd frontend
npm run test

# Com UI
npm run test:ui

# Cobertura
npm run test:coverage
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

Veja os arquivos em `docs/`:

| Arquivo                                                     | Propósito                                 |
| ----------------------------------------------------------- | ----------------------------------------- |
| [DECISOES_CONFIRMADAS.md](docs/DECISOES_CONFIRMADAS.md)     | Decisões arquiteturais com justificativas |
| [CASES_STUDY.md](docs/CASES_STUDY.md)                       | Análise completa do app Cases             |
| [PUBLICATIONS_SPEC.md](docs/PUBLICATIONS_SPEC.md)           | Especificação técnica de publicações      |
| [LAYOUT_SPEC.md](docs/LAYOUT_SPEC.md)                       | Design system e layout                    |
| [CHANGELOG.md](docs/CHANGELOG.md)                           | Histórico de todas as mudanças            |
| [MANUAL_TESTING_PLAN.md](docs/MANUAL_TESTING_PLAN.md)       | Plano de testes manuais                   |
| [MODULARIZACAO_COMPLETA.md](docs/MODULARIZACAO_COMPLETA.md) | Refatoração de componentes                |

---

## 🔗 ENDPOINTS DA API

### Contacts

```
GET    /api/contacts/                 # Lista todos
POST   /api/contacts/                 # Criar novo
GET    /api/contacts/{id}/            # Detalhes
PUT    /api/contacts/{id}/            # Editar
DELETE /api/contacts/{id}/            # Deletar
```

### Publications

```
GET    /api/publications/             # Histórico
POST   /api/publications/search/      # Nova busca
GET    /api/publications/{id}/        # Detalhes
GET    /api/publications/today        # Busca do dia
```

### Cases

```
GET    /api/cases/                    # Lista
POST   /api/cases/                    # Criar
GET    /api/cases/{id}/               # Detalhes
PUT    /api/cases/{id}/               # Editar
DELETE /api/cases/{id}/               # Deletar
POST   /api/cases/{id}/parties/       # Adicionar parte
```

---

## 🐛 TROUBLESHOOTING

### Backend não inicia

```bash
# Verifique se há erro de migrations
python manage.py migrate --dry-run

# Recrie o banco (desenvolvimento)
rm db.sqlite3
python manage.py migrate
```

### Frontend não conecta ao backend

```bash
# Verifique CORS em settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Reinicie ambos os servidores
```

### Porta 8000 ou 5173 já em uso

```bash
# Encontre qual processo está usando
Get-NetTCPConnection -LocalPort 8000 -ErrorAction Ignore

# Kill o processo
Stop-Process -Id <PID> -Force
```

---

## 💾 BACKUP & DADOS

### Arquivo de Banco de Dados

```
backend/db.sqlite3  # ⚠️ Copiar regularmente
```

### Export/Import de Contatos

```bash
# Export
python manage.py dumpdata apps.contacts > backup_contacts.json

# Import
python manage.py loaddata backup_contacts.json
```

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Revisar este documento** com a advogada
2. **Validar roadmap:** Fase 4 (Cases) é realmente a próxima?
3. **Planejar sprint:** Semanas para cada fase?
4. **Escolher agente:** Full-stack ou separado (backend + frontend)?
5. **Iniciar Fase 4:** Implementar Cases com feedback contínuo

---

## 📞 CONTATO & SUPORTE

**Cliente:** Escritório de Advocacia  
**Tipo de Suporte:** Local (sem cloud)  
**Gestor:** [Seu nome]  
**Data de Atualização:** 24 de fevereiro de 2026

---

**Última atualização:** 2026-02-24

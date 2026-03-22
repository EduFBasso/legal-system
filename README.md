# Legal System - Sistema de Gestão Jurídica

> Sistema sob medida para advogados, focado em simplicidade e acessibilidade.

## 📋 Visão Geral

Sistema de gestão jurídica desenvolvido com arquitetura moderna, priorizando:

- **Roupa sob medida**: Apenas funcionalidades realmente utilizadas
- **Acessibilidade**: Fontes grandes, alto contraste, interface limpa
- **Local-first**: Funciona localmente, preparado para expansão LAN/cloud

## 🏗️ Arquitetura

### Stack Tecnológica

**Backend**

- Python 3.11+
- Django 4.2.28
- Django REST Framework 3.16.1
- SQLite (desenvolvimento)
- django-cors-headers 4.6.0
- django-filter 24.2

**Frontend**

- React 19.2.0
- Vite 7.3.1
- Node.js 20.20.0 LTS
- CSS Variables (design system com palette.css)

### Estrutura de Diretórios

```
legal-system/
├── backend/              # Django API
│   ├── apps/            # Domain apps (feature-based)
│   │   └── contacts/    # ✅ Gestão de contatos (IMPLEMENTADO)
│   ├── config/          # Settings, URLs, WSGI/ASGI
│   ├── services/        # Business logic e integrações
│   └── storage/         # Upload de arquivos
│
├── frontend/            # React SPA
│   └── src/
│       ├── components/  # UI components
│       │   ├── Modal.jsx
│       │   ├── ContactCard.jsx
│       │   ├── ContactDetailModal.jsx
│       │   └── SettingsModal.jsx
│       ├── contexts/    # React Context API
│       │   └── SettingsContext.jsx
│       ├── pages/       # Page components
│       │   └── ContactsPage.jsx
│       ├── services/    # API communication
│       │   └── api.js
│       └── utils/       # Helper functions
│           └── masks.js # Input masks (CPF, CNPJ, Phone, CEP)
│
├── docs/                # Documentação técnica
├── tools/               # Scripts e utilitários
│   └── pub_fetcher/     # Scraper de publicações TJSP
└── infra/               # Scripts operacionais
```

## ✅ Features Implementadas

### 🎯 App: Contacts (feature/contacts)

#### Backend

- ✅ Model Contact com 19 campos
  - Identificação: nome, tipo de pessoa (PF/PJ), tipo de contato
  - Documento: CPF/CNPJ com formatação automática
  - Contato: email, telefone, celular
  - Endereço completo: logradouro, número, complemento, bairro, cidade, estado, CEP
  - Observações: campo texto livre
  - Metadados: created_at, updated_at
- ✅ Properties computed: `document_formatted`, `address_oneline`, `has_contact_info`, `has_complete_address`
- ✅ Admin interface com busca, filtros e ações em lote
- ✅ API REST completa (CRUD)
- ✅ Serializers: `ContactListSerializer` (cards), `ContactDetailSerializer` (modal)
- ✅ Filters: por tipo de contato, tipo de pessoa, busca textual

#### Frontend

- ✅ **ContactsPage**: Layout principal com sidebar e área de conteúdo
- ✅ **Busca em tempo real**: Filtro instantâneo de contatos
- ✅ **ContactCard**: Mini-cards com foto (40x40px) ou ícone (👤 PF / 🏢 PJ)
- ✅ **ContactDetailModal**: Modal híbrido VIEW/EDIT/CREATE
  - **VIEW**: Exibição organizada em seções (Básicas, Contato, Endereço, Observações, Metadados)
  - **EDIT**: Edição inline com validação
  - **CREATE**: Formulário de novo contato
- ✅ **Máscaras de input em tempo real** (utils/masks.js):
  - CPF: `000.000.000-00`
  - CNPJ: `00.000.000/0000-00`
  - Telefone: Auto-detecta fixo `(00) 0000-0000` vs celular `(00) 00000-0000`
  - CEP: `00000-000`
  - Validações: Algoritmos completos de CPF e CNPJ
- ✅ **DELETE com senha de proteção**:
  - Modal de confirmação com aviso de irreversibilidade
  - Campo de senha opcional (configurável em Settings)
  - Validação antes de excluir
- ✅ **SettingsModal**:
  - Toggle: Exibir campos vazios
  - Senha para exclusão de contatos
  - Persistência em localStorage
- ✅ **Design System**:
  - CSS Variables (palette.css)
  - Fontes grandes para acessibilidade
  - Alto contraste
  - Ícones emoji (sem dependências externas)

#### Estado Atual

- **Branch**: `feature/contacts`
- **Commits**: 22 commits
- **Database**: 6 contatos de teste
- **CRUD**: 100% funcional (Create, Read, Update, Delete)

## 🚀 Como Executar

### Pré-requisitos

- Python 3.11+
- Node.js 20.20.0 LTS
- Git

### 1. Clone do Repositório

```bash
git clone <repository-url>
cd legal-system
```

### 2. Backend (Django)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # Roda em http://127.0.0.1:8000
```

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev  # Roda em http://localhost:5173
```

### 4. Acesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8000/api/contacts/
- **Django Admin**: http://127.0.0.1:8000/admin/

## 📝 Workflow de Desenvolvimento

### Feature Branches

- Um app = uma branch
- Exemplo: `feature/contacts`, `feature/cases`, `feature/agenda`
- Testing completo antes de merge para `main`

### Convenções

- **Nomes**: Apps em inglês, comentários em português
- **Commits**: Conventional Commits (feat, fix, chore, docs)
- **Database**: Migrations versionadas por app

### Exemplo de Commit

```bash
feat(frontend): adiciona máscaras de input em tempo real
fix(backend): corrige validação de CPF
chore(frontend): remove código não utilizado
docs: atualiza README com features implementadas
```

## 🔮 Roadmap

> **Ordem alinhada com o workflow real da advogada**

### ✅ Fase 1: Contacts (CONCLUÍDO)

- CRUD completo
- Máscaras de input
- Exclusão protegida por senha
- Settings modal

### 🔄 Fase 2: Refatoração (EM ANDAMENTO)

**Importante**: Esta fase será repetida em cada app para organizar, modularizar e solidificar a base.

- Componentes comuns reutilizáveis:
  - `ConfirmDialog`: Modal de confirmação genérico
  - `Toast`: Notificações temporadas auto-close
  - `FormField`: Input field com label, mask e validação
  - `Button`: Botões padronizados
  - `Badge`: Etiquetas de status
- Estrutura `components/common/` para componentes genéricos
- Documentação JSDoc em todos os componentes
- **Aplicar estas práticas em todos os próximos apps**

### 📰 Fase 3: Publicações (PRÓXIMO)

**Por que primeiro?** Primeira ação da advogada ao iniciar o sistema - consultar publicações.

- Integração com PJe Comunica API
- Utilizar scraper existente (tools/pub_fetcher)
- Auto-cadastro de prazos a partir de publicações
- Notificações de intimações
- Dashboard de pendências (Em aberto, Lidas, Excluídas)
- View "Intimações e Publicações" na página principal

### 📁 Fase 4: Cases

- Model Case (processos judiciais)
- Relacionamento ManyToMany com Contacts
- Campo número do processo com máscara CNJ
- Integração com publicações (vincular intimações a processos)
- Anotações e timeline de eventos
- Refatoração: Aplicar componentes comuns da Fase 2

### 📅 Fase 5: Agenda

- Sistema de agendamento com status visual
- Tipos: TAREFA, PRAZO, JULGAMENTO
- Categorias de urgência:
  - Em aberto
  - Data fatal (hoje)
  - Atrasados
  - Período fatal
- View mensal estilo calendário
- Relacionamento com Cases e Contacts
- Prazos gerados automaticamente das Publicações
- Refatoração: Aplicar componentes comuns da Fase 2

### 🧪 Fase 6: Testes Automatizados (FUTURO)

- Implementar após estrutura completa (Publicações, Cases, Agenda)
- Vitest + React Testing Library
- Unit tests para utils (masks, validações)
- Integration tests para pages
- E2E tests para fluxos críticos

## 🎨 Design System

### Palette CSS

Cores definidas em `frontend/src/palette.css`:

- `--color-primary`: Azul principal
- `--color-success`: Verde (ações positivas)
- `--color-danger`: Vermelho (exclusões, avisos)
- `--color-warning`: Laranja (alertas)
- `--color-text`: Texto principal
- `--color-text-muted`: Texto secundário
- `--color-bg`: Background
- `--color-border`: Bordas e separadores

### Acessibilidade

- Fontes grandes: `--font-text: 16px`, `--font-title: 24px`
- Alto contraste em todos os elementos
- Ícones emoji (não dependem de bibliotecas)
- Focus states visíveis em todos os inputs
- Labels descritivos

## 🧪 Testing

### Checklist de Testes Manuais (Contacts)

- [x] CREATE: Criar contato com todos os campos
- [x] CREATE: Criar contato com campos mínimos (apenas nome)
- [x] READ: Visualizar detalhes de contato
- [x] UPDATE: Editar todos os campos
- [x] DELETE: Excluir sem senha configurada
- [x] DELETE: Excluir com senha configurada (senha correta)
- [x] DELETE: Excluir com senha configurada (senha incorreta - deve falhar)
- [x] MASKS: Verificar formatação em tempo real (CPF, CNPJ, Phone, CEP)
- [x] SEARCH: Buscar contatos por nome
- [x] SETTINGS: Toggle "Exibir campos vazios"
- [x] SETTINGS: Configurar senha de exclusão

## 📚 Documentação Adicional

- [STRUCTURE.md](docs/STRUCTURE.md): Estrutura detalhada do projeto
- [PRODUCT_NOTES.md](docs/PRODUCT_NOTES.md): Observações de produto e UX
- [PUBLICATIONS_SPEC.md](docs/PUBLICATIONS_SPEC.md): Especificação de integração com publicações
- [tools/pub_fetcher/README.md](tools/pub_fetcher/README.md): Documentação do scraper TJSP

## 🤝 Contribuindo

Contribuições são bem-vindas através de:

1. Fork do repositório
2. Feature branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit com mensagens descritivas
4. Push e Pull Request

## 📄 Licença

Todos os direitos reservados.

## 📧 Contato

**Desenvolvedor**: Eduardo  
**Advogado**: Vitória Rocha

---

**Versão**: 0.1.0 (feature/contacts)  
**Última atualização**: 16 de fevereiro de 2026  
**Status**: 🟢 Em desenvolvimento ativo

# Project Structure

This document describes the folder layout and responsibilities across backend and frontend.

## Top-level

- **backend/** : Django REST API (models, serializers, viewsets, services)
- **frontend/** : Vite + React SPA (components, pages, contexts, utils)
- **infra/** : Local scripts and operational helpers
- **docs/** : Technical and functional documentation
- **data/** : Local development data and fixtures
- **tools/** : Utility scripts (pub_fetcher for TJSP scraping)

## Backend Structure

### Core Configuration

- **backend/config/** : Django settings, URLs, WSGI/ASGI
  - `settings.py` : Main settings (INSTALLED_APPS, CORS, etc)
  - `urls.py` : URL routing (includes app URLs)

### Domain Apps (Feature-based)

- **backend/apps/** : Domain-specific applications
  - **contacts/** ✅ **IMPLEMENTADO**
    - `models.py` : Contact model (19 campos)
    - `serializers.py` : ContactListSerializer, ContactDetailSerializer
    - `views.py` : ContactViewSet (CRUD completo)
    - `urls.py` : API routes `/api/contacts/`
    - `admin.py` : Django admin interface
  - **publications/** 📰 **PRÓXIMO** (tools/pub_fetcher já existe)
  - **cases/** 📁 Planejado
  - **agenda/** 📅 Planejado

### Support Layers

- **backend/api/** : (Planejado) Shared serializers, viewsets, routers
- **backend/services/** : Business logic e integrações externas
- **backend/storage/** : Upload de arquivos e attachments

### Database

- **SQLite** (desenvolvimento): `backend/db.sqlite3`
- Migrations versionadas por app: `backend/apps/contacts/migrations/`

## Frontend Structure

### Application Source (`frontend/src/`)

#### Components (`components/`)

Componentes React organizados por funcionalidade:

**Genéricos (reutilizáveis)**

- `Modal.jsx` : Modal genérico com 3 tamanhos (small, medium, large)
- `Header.jsx` : Cabeçalho com logo, título, Settings
- `Menu.jsx` : Menu lateral de navegação
- `MainContent.jsx` : Container principal para conteúdo
- `Sidebar.jsx` : Sidebar lateral com scroll

**Componentes Comuns (`components/common/`)** 🆕

- `Toast.jsx` : Notificação temporária com auto-close
  - Tipos: success, error, warning, info
  - Auto-close configurável (padrão 3s)
  - Baseado no SystemMessageModal do clinic-system
  - Cores do palette.css
- `ConfirmDialog.jsx` : Modal de confirmação genérico
  - Tipos: danger (delete), warning, info
  - Suporte a senha de confirmação (opcional)
  - Extraído do padrão de exclusão do ContactDetailModal
  - Botões: Cancelar + Confirmar (type-colored)
- `index.js` : Barrel export para facilitar imports

**Específicos de Contacts**

- `ContactCard.jsx` : Mini-card para lista (40x40px foto/ícone + nome + tipo)
- `ContactDetailModal.jsx` : Modal híbrido VIEW/EDIT/CREATE
  - Refatorado: usa ConfirmDialog para exclusão (removido ~50 linhas)
- `SettingsModal.jsx` : Modal de configurações (showEmptyFields, deletePassword)

**Estilos**

- Cada componente tem seu `.css` correspondente
- `palette.css` : Design system com CSS Variables

#### Pages (`pages/`)

- `ContactsPage.jsx` : Página principal de contatos
  - Layout: Header + Menu + Sidebar (cards) + MainContent (modal)
  - Busca em tempo real
  - Botão "➕ Novo Contato"
  - Gerenciamento de estado (contacts, selectedContactId, isModalOpen)

#### Contexts (`contexts/`)

- `SettingsContext.jsx` : Global settings com localStorage
  - `showEmptyFields` : Toggle para exibir campos vazios
  - `deletePassword` : Senha para exclusão de contatos

#### Services (`services/`)

- `api.js` : Communication layer com backend
  - `contactsAPI.getAll()` : GET /api/contacts/
  - `contactsAPI.getById(id)` : GET /api/contacts/:id/
  - `contactsAPI.create(data)` : POST /api/contacts/
  - `contactsAPI.update(id, data)` : PUT /api/contacts/:id/
  - `contactsAPI.delete(id)` : DELETE /api/contacts/:id/
  - Tratamento de erros centralizado

#### Utils (`utils/`)

- `masks.js` : Input masks e validações (186 linhas, zero dependências)
  - `maskCPF(value)` : Formata CPF 000.000.000-00
  - `maskCNPJ(value)` : Formata CNPJ 00.000.000/0000-00
  - `maskPhone(value)` : Auto-detecta fixo vs celular
  - `maskCEP(value)` : Formata CEP 00000-000
  - `maskDocument(value, personType)` : CPF ou CNPJ automático
  - `maskProcessNumber(value)` : Formato CNJ (futuro app cases)
  - `unmask(value)` : Remove formatação
  - `isValidCPF(cpf)` : Validação completa com dígitos verificadores
  - `isValidCNPJ(cnpj)` : Validação completa com dígitos verificadores

#### Assets & Styles

- `App.jsx` : Root component com SettingsProvider
- `main.jsx` : Entry point (ReactDOM.render)
- `index.css` : Global styles + CSS reset
- `App.css` : App-level styles

## Apps Status

### ✅ Implemented

#### contacts (branch: feature/contacts)

**Backend**

- **Model**: Contact
- **Fields**: 19 campos
  - Identificação: `name`, `person_type` (PF/PJ), `contact_type` (CLIENT, OPPOSING, WITNESS, LAWYER, OTHER)
  - Documento: `document_number` (CPF ou CNPJ)
  - Contato: `email`, `phone`, `mobile`
  - Endereço: `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `zip_code`
  - Observações: `notes` (TextField)
  - Metadados: `created_at`, `updated_at` (auto)
- **Properties**: `document_formatted`, `address_oneline`, `has_contact_info`, `has_complete_address`, `person_type_display`, `contact_type_display`
- **Database**: Tabela `contacts_contact` com 2 índices otimizados (name, contact_type)
- **Admin**: Interface completa com busca, filtros e ações em lote
- **API**: ViewSet completo (list, retrieve, create, update, destroy)
- **Serializers**:
  - `ContactListSerializer` : Para sidebar cards (campos essenciais)
  - `ContactDetailSerializer` : Para modal (todos os campos + properties)
- **Filters**: django-filter para busca e filtragem

**Frontend**

- **CRUD Completo**:
  - CREATE: ➕ Novo Contato com validação (nome obrigatório)
  - READ: Visualização detalhada em modal com seções organizadas
  - UPDATE: ✏️ Edição inline de todos os campos
  - DELETE: 🗑️ Exclusão com confirmação e senha opcional
- **Máscaras de Input**: Formatação em tempo real (CPF, CNPJ, Phone, CEP)
- **Validações**: Algoritmos completos de CPF e CNPJ
- **Settings**: Modal de configurações com localStorage
  - Toggle: Exibir campos vazios
  - Senha para exclusão
- **Design**: Interface acessível com fontes grandes e alto contraste
- **Estado**: 22 commits, 6 contatos de teste

### 🔜 Planned

> **Ordem baseada no workflow real da advogada**

- **publications** 📰 **PRÓXIMO (Fase 3)**: Primeira ação da advogada ao iniciar o sistema
  - Integração com PJe Comunica API
  - Utilizar scraper existente (tools/pub_fetcher)
  - Auto-cadastro de prazos a partir de publicações
  - Notificações de intimações
  - Dashboard de pendências (Em aberto, Lidas, Excluídas)
  - **Refatoração**: Aplicar componentes comuns (ConfirmDialog, Toast, FormField)
- **cases** 📁 **(Fase 4)**: Processos judiciais com relacionamento a contacts
  - Model: Case com número do processo (máscara CNJ)
  - ManyToMany: contacts (partes envolvidas)
  - Timeline de eventos
  - Integração com publications (vincular intimações a processos)
  - **Refatoração**: Aplicar componentes comuns
- **agenda** 📅 **(Fase 5)**: Sistema de agendamento com status visual
  - Types: TAREFA, PRAZO, JULGAMENTO
  - Status: Em aberto, Data fatal, Atrasados, Período fatal
  - View: Calendário mensal
  - Relacionamentos: cases, contacts
  - Prazos gerados automaticamente das publications
  - **Refatoração**: Aplicar componentes comuns

## Data Flow

### Contacts CRUD Flow

**CREATE (Novo Contato)**
Frontend → POST /api/contacts/ → Backend

1. User preenche form no ContactDetailModal (isCreating = true)
2. Máscaras aplicadas em tempo real durante digitação
3. handleSave: Unmask + validação (nome obrigatório)
4. POST com dados limpos (sem formatação)
5. Backend: Serializer valida e cria registro
6. Response: Contact completo com properties computadas
7. Frontend: Aplica máscaras novamente e adiciona ao topo da lista

**READ (Visualizar)**
Frontend → GET /api/contacts/:id/ → Backend

1. User clica em ContactCard
2. GET request para detalhes
3. Backend: ContactDetailSerializer retorna todos os campos + properties
4. Frontend: Aplica máscaras para exibição formatada
5. Renderiza modal em modo VIEW

**UPDATE (Editar)**
Frontend → PUT /api/contacts/:id/ → Backend

1. User clica em "✏️ Editar"
2. Modal entra em modo EDIT (campos editáveis)
3. Máscaras aplicadas durante digitação
4. handleSave: Unmask + validação
5. PUT com dados limpos
6. Backend: Atualiza e retorna contact atualizado
7. Frontend: Aplica máscaras e atualiza na lista

**DELETE (Excluir)**
Frontend → DELETE /api/contacts/:id/ → Backend

1. User clica em "🗑️ Excluir"
2. Modal de confirmação (showDeleteConfirm)
3. Se senha configurada: valida password
4. DELETE request
5. Backend: Remove registro (204 No Content)
6. Frontend: Remove da lista e fecha modal

### Settings Flow

1. User configura settings no SettingsModal
2. updateSettings: Atualiza context + localStorage
3. Todas as páginas reagem às mudanças via useSettings hook

## Development Workflow

### Feature Branches

- **Padrão**: Uma feature = uma branch
- **Exemplo**: `feature/contacts`, `feature/cases`, `feature/agenda`
- **Testing**: Validação completa antes de merge para `main`
- **Commits**: Conventional Commits (feat, fix, chore, docs)

### Commit Convention

```bash
feat(scope): adiciona nova funcionalidade
fix(scope): corrige bug
chore(scope): tarefas de manutenção
docs: atualiza documentação
refactor(scope): refatora código sem mudar comportamento
style: formatação, espaços, ponto-e-vírgula
test: adiciona ou corrige testes
```

### Development Setup

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # http://127.0.0.1:8000

# Frontend
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### Testing Checklist (Manual)

- [ ] CRUD operations funcionando
- [ ] Máscaras aplicadas corretamente
- [ ] Validações impedindo dados inválidos
- [ ] Settings persistindo em localStorage
- [ ] Responsividade em diferentes resoluções
- [ ] Acessibilidade (tab navigation, contraste)
- [ ] Error handling (API offline, campos inválidos)

### Database Migrations

- **Criação**: `python manage.py makemigrations contacts`
- **Aplicação**: `python manage.py migrate`
- **Reversão**: `python manage.py migrate contacts 0001` (volta para migration 0001)
- **Versionamento**: Migrations commitadas no git

## Future Architecture

### Planned Relationships

```
contacts ↔ cases ↔ agenda
    ↓         ↓
    └─ publications
```

**Intersections**:

- Contact pode estar em múltiplos Cases
- Case pode ter múltiplos Contacts (partes envolvidas)
- Case pode gerar múltiplos Agenda items (prazos, audiências)
- Publication pode criar automaticamente Agenda items
- Publication está vinculada a um Case

### Scalability Considerations

- **Current**: Local SQLite (desenvolvimento)
- **Next**: PostgreSQL (produção LAN)
- **Future**: Cloud deployment com multi-tenancy

## Notes

- **Naming**: Apps em inglês, comentários em português
- **No external libs for masks**: Zero dependencies, full control
- **Design System**: CSS Variables para consistência
- **Accessibility First**: Fontes grandes, alto contraste
- **Local-first**: Funciona offline, sync futuro

---

**Última atualização**: 16 de fevereiro de 2026  
**Versão**: 0.1.0 (feature/contacts completo)

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 📚 Documentation

- Comprehensive README.md with project overview and setup instructions
- Updated STRUCTURE.md with complete frontend and backend architecture
- Updated frontend/README.md with component documentation and conventions
- This CHANGELOG.md

### ♻️ Refactor

- CaseDetail: extração de lógica de orquestração para hooks dedicados (documentos, vínculos, auto-refresh, guards de auto-save do financeiro, e fluxo de link por query params)
- CaseDetail: redução de prop-drilling no conteúdo das abas (objeto `caseDetail` memoizado)

### ✨ Features

- Cases: padronização de dropdowns dinâmicos com baseline fixa via `backend/apps/cases/defaults.py` (não fica vazio após purge/reset)
- API: `GET /cases/titulo-options/` agora retorna defaults + persistidos + sugestões dinâmicas (com dedup + `?q=`)
- API: `GET /cases/representation-type-options/` agora retorna defaults + persistidos (POST não persiste default; PATCH bloqueia renomear para default)
- Maintenance: migration `cases.0025_sync_case_select_options_defaults` desativa opções persistidas antigas/não usadas e duplicatas que batem com defaults

### ✅ Tests

- Backend: cobertura para `titulo-options` e `representation-type-options` garantindo defaults mesmo com tabelas vazias

## [0.2.0] - 2026-02-27 - "Cases & Publications Complete"

### ✨ Features

#### Backend

- **Publications Integration**
  - Added `case` FK to Publication model (optional, for integration tracking)
  - Added `integration_status`, `integration_attempted_at`, `integration_notes` fields
  - New migration for publication integration fields
  - Endpoint: GET `/publications/{id_api}/` para obter publicação por ID

#### Frontend

- **New Cases App** (Complete workflow)
  - CaseDetailPage: Full-width editor para criar/editar casos
  - Suporte a criação de casos a partir de publicações (com prefill automático)
  - Integração com publicações: numero_processo, tribunal, vara, observacoes

- **Publication → Case Workflow**
  - Publicações abrem em **nova janela** (não modal)
  - PublicationDetailsPage: Página dedicada com layout full-width
  - Rota: `/publications/:idApi/details`
  - Carga de dados com logging e feedback visual

- **Case Parties Management** (Draft Pattern)
  - Parties podem ser adicionadas antes de salvar o caso
  - Sistema de "draft parties": armazenadas em state local com `is_draft: true`
  - Salvamento orchestrado: Create case → Add parties → Integrate publication
  - Tratamento de falhas parciais (alguns parties falham, mas caso criado)

- **Case Movements (Movimentações)**
  - Modal de Movimentação Processual com styling padronizado
  - Validação obrigatória: Caso deve estar salvo antes de adicionar movimentação
  - Font size aumentado +20% para melhor legibilidade
  - Botão "Adicionar Movimentação" agora removido do form de edição
  - Campos de movimento: data, tipo, título, descrição, prazo, origem

- **Improved UI/UX**
  - Modal movimentação: form-row para campos lado-a-lado
  - Input styling consistente (date, text, number, select, textarea)
  - Helper text com classe dedicada `.form-helper-text`
  - Button estados: disabled com validação clara
  - Tooltip ao passar mouse em botão desabilitado

### 🐛 Bug Fixes

- Movimentação: Extrair corretamente dados da publicação da resposta da API
- Publications: Serviço ajustado para retornar dados corretos
- Modal: Correção de z-index e overlay
- Form validation: Parties não validarem antes do caso ser salvo

### 🧹 Chores

- Removido campo "Última Movimentação" do form de edição de caso
- Removido modal de publicação (substituído por nova janela)
- Limpeza de imports não utilizados (PublicationDetailModal do PublicationsPage)
- Geração de migrations para Publication model
- .gitignore: Documentação em desenvolvimento ignorada

### 📚 Documentation

- **NEW**: API_ROUTES_MAP.md - Documentação completa de rotas com exemplos
  - 8 recursos principais (Cases, Parties, Movements, Payments, Expenses, Contacts, Publications, Notifications)
  - Todos os endpoints, métodos, campos, filtros
  - Status codes e padrões de resposta
  - Exemplos práticos de requisição
  - ⚠️ Avisos sobre ordem de criação obrigatória

### 🔧 Technical Details

- **Frontend**: React 19.2.0, React Router v6, Vite 7.3.1
- **Backend**: Django 4.2.28, DRF 3.16.1
- **Branch**: feature/cases (1 novo commit)
- **Build**: 1852 modules (Vite build validated)
- **Validação**: Fluxo completo testado (Publicação → Caso → Parties → Movimentações)

## [0.1.0] - 2026-02-16 - "Contacts CRUD Complete"

### ✨ Features

#### Backend

- **Contacts App** (Complete CRUD API)
  - Model Contact with 19 fields (identification, document, contact info, full address, notes, metadata)
  - Computed properties: `document_formatted`, `address_oneline`, `has_contact_info`, `has_complete_address`
  - Django Admin interface with search, filters, and bulk actions
  - REST API ViewSet with list, retrieve, create, update, destroy
  - Two serializers: `ContactListSerializer` (cards), `ContactDetailSerializer` (modal)
  - django-filter integration for search and filtering
  - CORS configuration for frontend communication

#### Frontend

- **Complete CRUD Interface**
  - CREATE: ➕ New contact form with validation (name required)
  - READ: Detailed view in organized modal with sections
  - UPDATE: ✏️ Inline editing of all fields
  - DELETE: 🗑️ Deletion with confirmation and optional password protection

- **Layout & Components**
  - Three-column layout: Header + Menu + Sidebar (cards) + MainContent (modal)
  - Breadcrumb navigation
  - ContactCard component (40x40px photo/icon + name + type)
  - ContactDetailModal: Hybrid VIEW/EDIT/CREATE modal (695 lines)
  - Modal component: Generic reusable modal (small, medium, large)
  - SettingsModal: Global settings with localStorage persistence

- **Input Masks & Validation** (utils/masks.js - 186 lines, zero dependencies)
  - Real-time formatting during typing
  - CPF: `000.000.000-00`
  - CNPJ: `00.000.000/0000-00`
  - Phone: Auto-detect landline `(00) 0000-0000` vs mobile `(00) 00000-0000`
  - CEP: `00000-000`
  - Process Number: `0000000-00.0000.0.00.0000` (CNJ format for future cases app)
  - Full validation algorithms for CPF and CNPJ with check digits
  - `unmask()` function to clean data before API calls

- **Settings System**
  - SettingsContext with React Context API
  - Toggle: "Show empty fields"
  - Password for contact deletion
  - localStorage persistence

- **Design System**
  - palette.css with CSS Variables
  - Large fonts for accessibility (16px minimum, 24px titles)
  - High contrast (WCAG AA)
  - Emoji icons (no external dependencies)
  - Consistent spacing and colors

- **Real-time Search**
  - Instant filtering of contacts by name
  - No page reload required

### 🐛 Bug Fixes

- Fixed JSX structure: Wrapped multiple modals in Fragment (`<>...</>`)
- Fixed field name mapping between frontend and backend:
  - Frontend `document` ↔ Backend `document_number`
  - Frontend `address_line1` ↔ Backend `street`
  - Frontend `address_number` ↔ Backend `number`
- Fixed contact_type enum values to match backend choices (CLIENT, OPPOSING, WITNESS, LAWYER, OTHER)
- Fixed duplicate code for City and State fields
- Fixed syntax errors in ContactDetailModal
- Fixed CORS for Vite port 5173
- Applied field mapping when loading contact for editing
- Applied field mapping when saving contact (create/update)

### 🧹 Chores

- Removed unused `renderField` function (64 lines of dead code)
- Updated .gitignore

### 🔧 Technical Details

- **Backend**: Django 4.2.28, DRF 3.16.1, SQLite, django-filter 24.2, django-cors-headers 4.6.0
- **Frontend**: React 19.2.0, Vite 7.3.1, Node.js 20.20.0 LTS
- **Branch**: feature/contacts (22 commits)
- **Database**: 6 test contacts

## [0.0.1] - 2026-02-14 - "Project Bootstrap"

### ✨ Features

- Project structure setup (backend, frontend, docs, data, tools, infra)
- Django backend configuration
- React + Vite frontend setup
- Documentation: STRUCTURE.md, PRODUCT_NOTES.md, PUBLICATIONS_SPEC.md
- pub_fetcher tool for TJSP publications scraping

### 🔧 Configuration

- Python 3.11+ environment
- Django settings with CORS configuration
- Vite dev server configuration
- ESLint setup

## [Previous Work] - Before 2026-02-14

### Legacy Features (Pre-refactor)

- Theme system with 5 high-contrast themes
- Font size controls
- Database models for clinic management (previous project)
- PySide6 desktop application framework
- Mac ARM compatibility (PySide6 6.8.0)

---

## Versioning Strategy

- **MAJOR** (X.0.0): Breaking changes, major architecture refactors
- **MINOR** (0.X.0): New features, new apps (contacts, cases, agenda)
- **PATCH** (0.0.X): Bug fixes, small improvements

## Branch Strategy

- **main**: Stable releases
- **feature/[app-name]**: Feature development (e.g., feature/contacts, feature/cases)
- **fix/[description]**: Bug fixes
- **docs/[description]**: Documentation updates
- **refactor/[description]**: Code refactoring

## Commit Convention

- `feat(scope):` New feature
- `fix(scope):` Bug fix
- `chore(scope):` Maintenance tasks
- `docs:` Documentation
- `refactor(scope):` Code refactoring
- `style:` Formatting, whitespace
- `test:` Tests

---

**Last Updated**: 16 de fevereiro de 2026  
**Current Version**: 0.1.0  
**Branch**: feature/contacts

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

# Project Structure

This document describes the initial folder layout and responsibilities.

## Top-level

- backend/ : Django backend (API, services, data access).
- frontend/ : Vite + React frontend (SPA).
- infra/ : Local scripts and operational helpers.
- docs/ : Technical and functional documentation.
- data/ : Local development data and fixtures.

## Backend

- backend/config/ : Django settings, URLs, WSGI/ASGI.
- backend/apps/ : Domain apps (implemented with feature branches).
  - **contacts/** : Gestão de contatos (clientes, partes contrárias, testemunhas).
  - agenda/ : Sistema de agendamento com status visual (planejado).
  - cases/ : Processos judiciais e anotações (planejado).
  - publications/ : Integração com PJe Comunica API (planejado).
- backend/api/ : Serializers, viewsets, routers.
- backend/services/ : Integrations and complex business rules.
- backend/storage/ : File storage and attachments.

## Frontend

- frontend/src/ : Application source code.

## Apps Status

### ✅ Implemented

#### contacts (branch: feature/contacts)
- **Model**: Contact
- **Fields**: 19 campos (identificação, contatos, endereço completo, metadados)
- **Database**: Tabela `contacts_contact` com 2 índices otimizados
- **Admin**: Interface completa com busca, filtros e ações em lote
- **Features**: 
  - Properties para lógica de mini-cards (has_contact_info, has_complete_address, etc)
  - Formatação automática de CPF/CNPJ e endereço
  - Suporte a diferentes tipos de contato (cliente, parte contrária, testemunha, etc)

### 🔜 Planned

- **cases**: Processos judiciais com relacionamento a contacts
- **appointments**: Sistema de agendas com status visual e controle de tempo
- **publications**: Integração com API PJe Comunica

## Development Workflow

- **Feature branches**: Um app = uma branch (ex: `feature/contacts`, `feature/cases`)
- **Naming**: Apps em inglês, comentários em português
- **Testing**: Validação completa antes de merge para main
- **Database**: Migrations versionadas para cada app

## Notes

This structure supports a local-first setup and a future move to LAN and online usage.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### � Documentação: Features Futuras para Tarefas (2026-03-03)

#### Added

- **Dashboard de Tarefas por Urgência** (seção 5 em MOVIMENTACOES_TAREFAS_FLUXO.md)
  - Visão consolidada de TODAS as tarefas do escritório
  - Agrupamento por urgência: URGENTÍSSIMA, URGENTE, NORMAL
  - Links diretos para movimentação de origem
  - Filtros rápidos: críticas, esta semana, por caso
  - Ordenação inteligente: dias restantes, caso, data criação
  - Fase 2: notificações push, integração com calendário, relatórios

- **Mini-Calendário de Datas Limite** (seção 6 em MOVIMENTACOES_TAREFAS_FLUXO.md)
  - Widget no sidebar direito (abaixo de "Sumário de Prazos")
  - Visualização mensal com marcadores de tarefas/prazos
  - Hover para listar tarefas do dia selecionado
  - Fase 1: navegação mês anterior/próximo, zoom semanal
  - Fase 2: integração com calendário do SO, sincronização

- **Sistema de Monitoramento: Detecção de Estagnação** (seção 7 em MOVIMENTACOES_TAREFAS_FLUXO.md)
  - Alerta automático para processos sem movimento por 90+ dias
  - Cron job semanal que verifica e notifica advogadas
  - Fluxo: detecta → alerta → contexto (últimas 5 movimentações) → ação
  - Opções de resposta: Adicionar movimentação, Criar tarefa, Arquivar, Snooze 30d
  - Localização: Sidebar "Alertas", Dashboard "Processos Parados", Email semanal

#### Changed

- **MOVIMENTACOES_TAREFAS_FLUXO.md** - Enhancements (phase 20)
  - Seção "Extração Automática de Prazo": linguagem refinada
    - Alterado de "data_limite = data + prazo" para "sugerida"
    - Adicionada explicação de variáveis legais: dias úteis vs corridos, feriados, tribunal-specific
    - Incluído exemplo real (Caso 9) com 2 prazos distintos
  - Seção "Cálculo Automático de Urgência": justificativa expandida (180+ linhas)
    - Novo header: "Por que 3 níveis? → Criar hierarquia visual de importância"
    - Mockup de dashboard mostrando agrupamento por urgência
    - 4-point benefits: dashboard filtering, alert strategy, smart ordering, audit trail
    - Explicação de auditoria: snapshots históricos para análise temporal
  - Sumário (TOC) atualizado com 3 novas seções

- **Table of Contents** reorganizada para refletir 9 seções principais

#### Documentation

- **Refinamento da precisão**: Data limite agora documentada como "sugerida"
  - Reflete realidade: cálculo automático (data + prazo) pode não ser exato
  - Advogada valida e interpreta conforme regras legais tributárias
  - Exemplo: Caso 9 com múltiplos prazos no mesmo texto
  
- **Justificativa de design**: Por qué 3-level urgency system?
  - Não é apenas classificação, é criação de hierarquia visual
  - Habilita: dashboard filtering, alerting, smart ordering, auditoria histórica
  - Campo persiste no DB para análise: "quando/por quê a urgência mudou?"

---

### �📚 Documentação: Movimentações e Tarefas (2026-03-03)

#### Added

**Documentação Atualizada**

- **MOVIMENTACOES_TAREFAS_FLUXO.md** - Documentação completa do fluxo atual
  - Fluxo Publicação → Movimentação com extração de prazo via regex
  - Sistema de tarefas vinculadas (inline CRUD)
  - Decisão de produto: tarefas SEMPRE manuais (não automáticas)
  - Cálculo automático de urgência (NORMAL/URGENTE/URGENTISSIMO)
  - Modelos de dados: CaseMovement, CaseTask, CasePrazo
  - Interface inline na aba Movimentações
  - Design system: cores vinho escuro (#6b21a8)
  - Endpoints da API documentados
  - Exemplos práticos com caso real (Caso 9)
  - Backlog de próximos passos

- **README.md** (docs/) - Índice navegável da documentação
  - Separação clara: documentos atuais vs legacy
  - Busca rápida por tema
  - Template para novos documentos
  - Guia de contribuição

#### Changed

- **Estrutura de docs/** reorganizada
  - Documentos atuais na raiz (`docs/`)
  - Documentos antigos/desatualizados em `docs/legacy/`
  - Facilita manutenção e evita confusão com docs obsoletos

#### Documentation

- Decisão confirmada: **Tarefas não são criadas automaticamente**
  - Motivo: segurança jurídica (interpretação incorreta pode gerar perda de prazo)
  - Badge de prazo serve apenas como alerta visual
  - Advogada sempre lê, interpreta e cria tarefas manualmente
- **Urgência calculada automaticamente** para evitar inconsistências
  - Regra 15/7/3: 0-3d (Urgentíssimo), 4-7d (Urgente), 8+d (Normal)
  - Campo não é editável no formulário
- **CasePrazo vs CaseTask**: modelos com propósitos diferentes
  - CasePrazo: prazos processuais formais (hierárquicos)
  - CaseTask: tarefas operacionais internas (flat)

### 🆕 Fase 2: Refatoração - Componentes Comuns (2025-02-10)

#### Added

**Common Components** (`frontend/src/components/common/`)

- **Toast.jsx** - Notificação temporária com auto-close
  - Tipos: success, error, warning, info
  - Auto-close configurável (padrão 3s)
  - Baseado no SystemMessageModal do clinic-system
  - Cores do palette.css com semantic tokens
  - Design responsivo (280-420px)
  - Botão OK para fechar manualmente

- **ConfirmDialog.jsx** - Modal de confirmação genérico
  - Tipos: danger (delete), warning, info
  - Suporte a senha de confirmação opcional
  - Mensagem de aviso adicional (ex: "irreversível")
  - Botões com cores semânticas (type-colored)
  - Layout responsivo (mobile: botões empilhados)
  - Validação de senha integrada

- **index.js** - Barrel export para facilitar imports
  - `import { Toast, ConfirmDialog } from '../common'`

#### Changed

- **ContactDetailModal.jsx** - Refatoração com ConfirmDialog
  - Substituído modal de exclusão embarcado por ConfirmDialog
  - Removido ~50 linhas de código duplicado
  - Mantida funcionalidade de senha de proteção
  - Código mais limpo e reutilizável

- **ContactsPage.jsx** - Integração com Toast
  - Notificações de sucesso após criar/editar/excluir
  - Helper `displayToast(message, type)` para facilitar uso
  - Melhor feedback visual ao usuário
  - Auto-close em 3 segundos

#### Documentation

- **STRUCTURE.md** - Seção de componentes comuns adicionada
  - Documentação completa dos novos componentes
  - Exemplos de uso futuro (Publications, Cases, Agenda)
- **frontend/README.md** - Nova seção "Common Components"
  - Documentação detalhada com props e tipos
  - Exemplos de código completos
  - Casos de uso e impacto da refatoração

---

## [0.1.0] - Fase 1: CRUD de Contatos (2025-02-09)

### ✅ Implemented

**Backend** (Django 5.1.5 + Django REST Framework)

- API completa de contatos: GET, GET/:id, POST, PUT, DELETE
- Modelo Contact com 14+ campos (name, document, email, phones, address, etc)
- Serialização e validação com DRF
- CORS configurado para desenvolvimento
- SQLite database

**Frontend** (React 19 + Vite 7)

- **ContactsPage** - Página principal
  - Lista de contatos com busca em tempo real
  - Botão "Novo Contato"
  - Loading e error states
- **ContactCard** - Mini-card para lista
  - Foto 40x40px ou ícone (👤 PF / 🏢 PJ)
  - Nome destacado + tipo de contato
  - Highlight em hover e selected
- **ContactDetailModal** - Modal híbrido VIEW/EDIT/CREATE
  - Três modos: visualização, edição, criação
  - Máscaras em tempo real (CPF, CNPJ, Phone, CEP)
  - Validação: nome obrigatório
  - Exclusão com senha de proteção
  - Field mapping: Frontend ↔ Backend
- **SettingsModal** - Configurações globais
  - Toggle: "Exibir campos vazios"
  - Input: Senha para exclusão
  - Persistência: localStorage

**Utils & Services**

- **masks.js** (186 linhas) - Input masks zero dependências
  - maskCPF, maskCNPJ, maskPhone, maskCEP, maskDocument
  - isValidCPF, isValidCNPJ (algoritmos completos)
  - unmask para limpeza
- **api.js** - Cliente HTTP
  - contactsAPI: getAll, getById, create, update, delete
  - Error handling centralizado
- **SettingsContext** - Context API
  - Global settings com localStorage
  - Provider em App.jsx

**Design System**

- **palette.css** - CSS Variables
  - Cores semânticas: primary, success, danger, warning, ongoing, done, pending
  - Typography tokens: font-title-lg/md, font-body, font-small
  - Card tokens: card-radius, card-padding
  - Espelhado do clinic-system

**Components Structure**

- Header, Menu, MainContent, Sidebar
- Modal genérico (small, medium, large)
- Layout responsivo e acessível

### Documentation

- **README.md** - Overview do projeto
  - Stack completo: Backend + Frontend
  - Quick start e comandos
  - Roadmap detalhado (6 fases)
- **STRUCTURE.md** - Arquitetura técnica
  - Estrutura de diretórios completa
  - Descrição de cada componente
  - Status de implementação
- **frontend/README.md** - Frontend específico
  - Arquitetura e design system
  - Documentação de componentes
  - Utils e services
- **PRODUCT_NOTES.md** - Visão de produto
  - User stories e requisitos
  - Fluxo de uso
- **PUBLICATIONS_SPEC.md** - Especificação futura
  - Detalhamento do app de publicações
  - Estrutura de dados

### Commits

Total de 26 commits na branch `feature/contacts`:

1. `feat(backend): adiciona CRUD completo de contatos com DRF` (api, model, serializer)
2. `feat(frontend): adiciona ContactsPage com busca e modal` (ContactsPage, ContactCard)
3. `feat(frontend): adiciona ContactDetailModal VIEW/EDIT/CREATE` (695 linhas)
4. `feat(frontend): adiciona máscaras de input zero dependências` (masks.js)
5. `feat(frontend): adiciona SettingsModal e Context` (settings globais)
6. `feat(frontend): adiciona validação de CPF/CNPJ` (isValidCPF, isValidCNPJ)
7. `fix(frontend): corrige auto-detecção de telefone fixo vs celular` (maskPhone)
8. `fix(frontend): corrige field mapping document ↔ document_number` (bug crítico)
9. `fix(frontend): adiciona exclusão com senha de proteção` (deletePassword)
10. `fix(frontend): corrige display de campos vazios` (showEmptyFields)
11. `feat(frontend): adiciona highlight de card selecionado` (UX improvement)
12. `fix(frontend): corrige validação de nome obrigatório` (CREATE mode)
13. `feat(frontend): adiciona loading e error states` (UX feedback)
14. `refactor(frontend): extrai ContactCard para componente separado` (modularização)
15. `style(frontend): ajusta palette com cores do clinic-system` (design consistency)
16. `docs: adiciona README.md completo com roadmap` (overview)
17. `docs: adiciona STRUCTURE.md com arquitetura técnica` (technical docs)
18. `docs: adiciona frontend/README.md específico` (frontend docs)
19. `docs: adiciona JSDoc em todos os componentes` (inline docs)
20. `docs: adiciona PRODUCT_NOTES.md com user stories` (product vision)
21. `docs: adiciona PUBLICATIONS_SPEC.md detalhado` (future planning)
22. `fix(backend): configura CORS para desenvolvimento` (backend compatibility)
23. `feat(frontend): adiciona auto-close após CREATE` (UX improvement)
24. `docs: adiciona CHANGELOG.md completo` (this file)
25. `feat(common): adiciona componentes Toast e ConfirmDialog` (refactoring phase 2) 🆕
26. `docs: atualiza CHANGELOG com Fase 2` (current commit)

---

## Roadmap Futuro

### Fase 3: Publicações (próximo)

- Listar publicações sincronizadas
- Visualizar detalhes completos
- Filtros: status, origem, período
- Vincular a processos (Cases)

### Fase 4: Cases (Processos)

- CRUD completo de processos
- Vincular a contatos e publicações
- Timeline de eventos
- Gestão de documentos

### Fase 5: Agenda

- Calendário de compromissos
- Vincular a processos e contatos
- Notificações de prazos
- Sincronização com Google Calendar

### Fase 6: Testes Automatizados

- Testes unitários (vitest)
- Testes de integração
- Testes E2E (playwright)
- CI/CD pipeline

---

## Nomenclatura de Commits

- `feat(scope):` Nova funcionalidade
- `fix(scope):` Correção de bug
- `refactor(scope):` Refatoração sem mudança de funcionalidade
- `style(scope):` Estilos e formatação
- `docs:` Documentação
- `test:` Testes
- `chore:` Tarefas de manutenção

**Scopes**: `backend`, `frontend`, `common`, `contacts`, `publications`, `cases`, `agenda`

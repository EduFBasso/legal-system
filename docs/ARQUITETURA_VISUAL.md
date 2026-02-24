# 🏗️ ARQUITETURA DO PROJETO - Diagramas e Fluxos

---

## 1. ARQUITETURA GERAL DO SISTEMA

```mermaid
graph TB
    User["👤 Advogado<br/>(1 usuário local)"]

    User -->|HTTP| Frontend["🟨 Frontend<br/>React + Vite<br/>localhost:5173"]
    User -->|HTTP| DjangoAdmin["⚙️ Django Admin<br/>localhost:8000/admin"]

    Frontend -->|API REST<br/>JSON| API["🟦 Backend API<br/>Django REST Framework<br/>localhost:8000/api"]

    API -->|ORM| DB["📦 SQLite3<br/>backend/db.sqlite3"]

    API -->|HTTP| Services["🌐 External Services<br/>PJe Comunica API<br/>TJSP, TRF3, etc"]

    style User fill:#f9d5e5
    style Frontend fill:#fff4e6
    style API fill:#e6f2ff
    style DB fill:#e6ffe6
    style Services fill:#f0e6ff
```

---

## 2. FLUXO DE DADOS - APP CONTACTS

```mermaid
sequenceDiagram
    participant User as Advogado
    participant UI as React Component<br/>ContactDetailModal
    participant Service as Service Layer<br/>contactsService.js
    participant API as Django API<br/>ContactViewSet
    participant ORM as Django ORM
    participant DB as SQLite3<br/>contacts_contact

    User->>UI: Clica em contato
    UI->>Service: contactsService.getById(id)
    Service->>API: GET /api/contacts/{id}/
    API->>ORM: Contact.objects.get(id=id)
    ORM->>DB: SELECT * FROM contacts_contact WHERE id=?
    DB-->>ORM: Row data
    ORM-->>API: Contact instance
    API->>API: ContactDetailSerializer(contact)
    API-->>Service: JSON response
    Service-->>UI: Parsed data
    UI->>UI: Render detail modal

    User->>UI: Edita campo + salva
    UI->>Service: contactsService.update(id, data)
    Service->>API: PUT /api/contacts/{id}/
    API->>ORM: Contact.objects.get(id=id)<br/>.update(data)
    ORM->>DB: UPDATE contacts_contact SET ...
    DB-->>ORM: Success
    ORM-->>API: Updated instance
    API-->>Service: JSON response
    Service-->>UI: Success notification
    UI->>UI: Toast: "Salvo com sucesso"
```

---

## 3. ARQUITETURA DO FRONTEND

```mermaid
graph LR
    subgraph Pages["📄 Pages"]
        ContactsPage["ContactsPage.jsx"]
        PublicationsPage["PublicationsPage.jsx"]
        CasesPage["CasesPage.jsx"]
    end

    subgraph Components["🧩 Components"]
        ContactCard["ContactCard.jsx"]
        ContactDetailModal["ContactDetailModal.jsx"]
        PublicationsList["PublicationsList.jsx"]
        CaseCard["CaseCard.jsx"]
    end

    subgraph Common["🔄 Common Components"]
        Toast["Toast.jsx"]
        ConfirmDialog["ConfirmDialog.jsx"]
        Modal["Modal.jsx"]
        FormField["FormField.jsx"]
    end

    subgraph State["🎯 Global State"]
        SettingsContext["SettingsContext"]
        PublicationsContext["PublicationsContext"]
        CasesContext["CasesContext"]
    end

    subgraph Services["🌐 Services"]
        ContactsService["contactsService.js"]
        PublicationsService["publicationsService.js"]
        CasesService["casesService.js"]
        API["api.js<br/>(HTTP client)"]
    end

    subgraph Utils["🛠️ Utils"]
        Masks["masks.js"]
        Formatters["formatters.js"]
    end

    ContactsPage --> ContactCard
    ContactCard -->|click| ContactDetailModal
    ContactDetailModal --> Common
    ContactDetailModal --> State
    ContactDetailModal --> Services

    ContactsService --> API
    Services --> API

    ContactDetailModal --> Masks
    ContactDetailModal --> Formatters

    style Pages fill:#fff4e6
    style Components fill:#e6f9ff
    style Common fill:#f0fff0
    style State fill:#ffe6ff
    style Services fill:#fff0f0
    style Utils fill:#f0f0f0
```

---

## 4. ARQUITETURA DO BACKEND

```mermaid
graph TB
    subgraph Apps["📦 Django Apps"]
        ContactsApp["Contacts App<br/>✅ COMPLETO"]
        PublicationsApp["Publications App<br/>✅ COMPLETO"]
        CasesApp["Cases App<br/>⏳ EM DESENVOLVIMENTO"]
        NotificationsApp["Notifications App<br/>🔜 PLANEJADO"]
    end

    subgraph Models["📊 Models"]
        Contact["Contact<br/>19 campos"]
        Publication["Publication<br/>Histórico de buscas"]
        Case["Case<br/>Processo judicial"]
        CaseParty["CaseParty<br/>Partes do processo"]
        CaseMovement["CaseMovement<br/>Movimentações"]
    end

    subgraph ViewSets["📡 ViewSets (API)"]
        ContactViewSet["ContactViewSet<br/>CRUD completo"]
        PublicationViewSet["PublicationViewSet<br/>Search + History"]
        CaseViewSet["CaseViewSet<br/>CRUD + Relationships"]
    end

    subgraph Serializers["🔄 Serializers"]
        ContactListSerializer["ContactListSerializer<br/>(mini-card)"]
        ContactDetailSerializer["ContactDetailSerializer<br/>(modal)"]
        PublicationSerializer["PublicationSerializer"]
        CaseSerializer["CaseSerializer"]
    end

    subgraph Filters["🔍 Filters"]
        ContactFilter["ContactFilter<br/>tipo, pessoa, search"]
        CaseFilter["CaseFilter<br/>status, tribunal"]
    end

    subgraph Services["🌐 Services"]
        PJEComunica["pje_comunica.py<br/>API integration"]
        SearchService["search_service.py<br/>Multi-tribunal search"]
    end

    subgraph URLs["🔗 URLs"]
        ContactsURL["api/contacts/"]
        PublicationsURL["api/publications/"]
        CasesURL["api/cases/"]
    end

    ContactsApp --> Models
    PublicationsApp --> Models
    CasesApp --> Models

    Models --> Serializers
    Serializers --> ViewSets
    ViewSets --> Filters

    ViewSets --> URLs

    PublicationViewSet --> Services

    style Apps fill:#e6f2ff
    style Models fill:#e6ffe6
    style ViewSets fill:#fff4e6
    style Serializers fill:#ffe6f0
    style Services fill:#f0e6ff
```

---

## 5. FLUXO DE BUSCA DE PUBLICAÇÕES

```mermaid
graph LR
    User["👤 Advogado<br/>na PublicationsPage"]

    User -->|1. Seleciona datas<br/>+ tribunais| Form["📋 Search Form"]

    Form -->|2. POST /api/publications/search/| Backend["🟦 Django Backend"]

    Backend -->|3. Inicia 8 tasks paralelas| Parallel["🔄 Parallel Search<br/>TJSP (OAB+Nome)<br/>TRF3 (OAB+Nome)<br/>TRT2 (OAB+Nome)<br/>TRT15 (OAB+Nome)"]

    Parallel -->|4. Cada task faz HTTP| APIs["🌐 Externa APIs<br/>PJe Comunica<br/>Publicações Oficiais"]

    APIs -->|5. Retorna HTML| Parser["🔍 HTML Parser<br/>Extrai dados + tabelas"]

    Parser -->|6. Salva no banco| DB["📦 SQLite3<br/>publications_publication<br/>+ publicações_searchhistory"]

    DB -->|7. Retorna JSON| Frontend["🟨 Frontend"]

    Frontend -->|8. Renderiza em lista| Results["📰 Results<br/>Cards com publicações<br/>+ HTML renderizado"]

    Results -->|click| DetailModal["📄 Detail Modal<br/>Texto completo<br/>Botões de ação"]

    DetailModal -->|ESAJ| OpenBrowser["🔗 Abre consulta<br/>no portal do tribunal"]

    style User fill:#f9d5e5
    style Form fill:#fff4e6
    style Backend fill:#e6f2ff
    style Parallel fill:#e6f2ff
    style APIs fill:#f0e6ff
    style Parser fill:#e6f2ff
    style DB fill:#e6ffe6
    style Frontend fill:#fff4e6
    style Results fill:#fff4e6
    style DetailModal fill:#fff4e6
    style OpenBrowser fill:#ffe6e6
```

---

## 6. FLUXO DE GESTÃO DE CASOS

```mermaid
graph TB
    CasesPage["📁 CasesPage<br/>Lista de casos"]

    CasesPage -->|Click em caso| Detail["📄 CaseDetailModal<br/>Visualização"]
    CasesPage -->|Botão +| Create["➕ Create Modal<br/>Novo caso"]

    Detail -->|Edit| Edit["✏️ Edit Modal<br/>Modifica dados"]
    Detail -->|Gerenciar Partes| PartyModal["👥 CasePartyModal<br/>Adiciona contatos<br/>como partes"]

    PartyModal -->|Seleciona contato| ContactSearch["🔍 ContactSearch<br/>Lista de contatos<br/>do banco"]

    Edit -->|Save| API["🟦 API PUT<br/>/api/cases/{id}/"]
    Create -->|Save| APICreate["🟦 API POST<br/>/api/cases/"]

    API -->|ORM Update| DB["📦 cases_case<br/>changes_caseparty<br/>changes_casemovement"]
    APICreate -->|ORM Create| DB

    DB -->|Success| Toast["✅ Toast<br/>Caso salvo"]

    Toast -->|Atualiza| CasesPage

    style CasesPage fill:#fff4e6
    style Detail fill:#fff4e6
    style Create fill:#fff4e6
    style Edit fill:#fff4e6
    style PartyModal fill:#fff4e6
    style ContactSearch fill:#fff4e6
    style API fill:#e6f2ff
    style DB fill:#e6ffe6
    style Toast fill:#e6ffe6
```

---

## 7. ESTRUTURA DE BANCO DE DADOS

```mermaid
erDiagram
    CONTACT ||--o{ CASE_PARTY : "via M2M"
    CONTACT ||--o{ PUBLICATION : "buscas por"
    CASE ||--o{ CASE_PARTY : "has"
    CASE ||--o{ CASE_MOVEMENT : "has"
    CASE ||--o{ SEARCH_HISTORY : "references"
    PUBLICATION ||--o{ SEARCH_HISTORY : "from"

    CONTACT {
        int id
        string name "not null"
        string person_type "PF ou PJ"
        string contact_type "CLIENT, OPPOSING, etc"
        string document_number "CPF/CNPJ"
        string email
        string phone
        string mobile
        string street
        string number
        string complement
        string neighborhood
        string city
        string state
        string zip_code
        text notes
        datetime created_at
        datetime updated_at
    }

    CASE {
        int id
        string numero_processo "CNJ format"
        string titulo
        string tribunal
        string comarca
        string vara
        string tipo_acao
        string status "ATIVO, INATIVO, etc"
        date data_ajuizamento
        text resumo
        datetime created_at
        datetime updated_at
    }

    CASE_PARTY {
        int id
        int case_id FK
        int contact_id FK
        string posicao "CLIENTE, CONTRARIO"
        date data_vinculacao
    }

    CASE_MOVEMENT {
        int id
        int case_id FK
        string tipo "CITACAO, SENTENÇA, etc"
        date data_movimento
        text descricao
        datetime created_at
    }

    PUBLICATION {
        int id
        int id_api
        string numero_processo
        string tribunal
        string tipo_comunicacao
        date data_disponibilizacao
        int orgao
        string meio
        text texto_resumo
        text texto_completo
        string link_oficial
        json search_metadata
        datetime created_at
    }

    SEARCH_HISTORY {
        int id
        int publication_id fk
        string oab
        string nome_parte
        date data_inicio
        date data_fim
        string tribunais "JSON"
        datetime data_busca
    }
```

---

## 8. FLUXO DE CI/CD RECOMENDADO (FUTURO)

```mermaid
graph LR
    Dev["👨‍💻 Desenvolvedor<br/>Código Local"]

    Dev -->|git push| GitHub["🐙 GitHub<br/>feature/xxx"]

    GitHub -->|Pull Request| Review["👀 Code Review<br/>Checklist"]

    Review -->|Aprovado| CI["🔄 CI Pipeline<br/>GitHub Actions"]

    CI -->|1. Backend| BackendTest["✅ Backend Tests<br/>pytest"]
    CI -->|2. Frontend| FrontendTest["✅ Frontend Tests<br/>vitest"]
    CI -->|3. Lint| Lint["✅ Linting<br/>eslint"]

    BackendTest -->|Pass| Merge["✔️ Merge to Main"]
    FrontendTest -->|Pass| Merge
    Lint -->|Pass| Merge

    Merge -->|Deploy| Local["🚀 Deploy Local<br/>INICIAR_SISTEMA.bat"]

    Local -->|Test| UserTest["👩 Advogada<br/>Valida features"]

    style Dev fill:#e6f2ff
    style GitHub fill:#f0f0f0
    style Review fill:#fff4e6
    style CI fill:#fff0f0
    style BackendTest fill:#e6ffe6
    style FrontendTest fill:#e6ffe6
    style Lint fill:#e6ffe6
    style Merge fill:#ffe6f0
    style Local fill:#e6f9ff
    style UserTest fill:#f9d5e5
```

---

## 9. MAPA MENTAL - COMPONENTES DO FRONTEND

```
Frontend (React + Vite)
├── 📄 Pages
│   ├── ContactsPage ✅
│   ├── PublicationsPage ✅
│   ├── CasesPage ⏳
│   └── NotificationsPage 🔜
│
├── 🧩 Componentes Específicos
│   ├── Contacts
│   │   ├── ContactCard ✅
│   │   ├── ContactDetailModal ✅
│   │   └── ContactForm ✅
│   ├── Publications
│   │   ├── PublicationsList ✅
│   │   ├── PublicationsStats ✅
│   │   └── PublicationDetailModal ✅
│   └── Cases
│       ├── CaseCard ⏳
│       ├── CaseDetailModal ⏳
│       └── CasePartyManager ⏳
│
├── 🔄 Componentes Reutilizáveis (common/)
│   ├── Toast ✅
│   ├── ConfirmDialog ✅
│   ├── Modal (base) ✅
│   ├── FormField ✅
│   ├── Button 🔜
│   ├── Badge 🔜
│   └── SearchBox 🔜
│
├── 🏗️ Layout
│   ├── Header ✅
│   ├── Menu ✅
│   ├── MainContent ✅
│   └── Sidebar ✅
│
├── 🎯 Global State (Context API)
│   ├── SettingsContext ✅
│   ├── PublicationsContext ✅
│   └── CasesContext ⏳
│
├── 🔗 Services Layer
│   ├── api.js (HTTP client) ✅
│   ├── contactsService ✅
│   ├── publicationsService ✅
│   └── casesService ⏳
│
├── 🛠️ Utils
│   ├── masks.js (formatação) ✅
│   ├── formatters.js ✅
│   └── validators.js 🔜
│
└── 🎨 Styles
    ├── palette.css (design system) ✅
    ├── index.css (reset) ✅
    └── [Component].css (por componente) ✅
```

---

## 10. STACK VISUAL

```
┌─────────────────────────────────────────┐
│          USUÁRIO (Advogado)             │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│         FRONTEND (React + Vite)         │
│  - ContactsPage                         │
│  - PublicationsPage                     │
│  - CasesPage                            │
│  - UI Components (Toast, Modal, etc)    │
│  - localStorage (para settings)         │
└─────────────────────────────────────────┘
           HTTP (localhost:5173)
                    │
                    ↓
┌─────────────────────────────────────────┐
│     BACKEND (Django REST Framework)     │
│  - Config (settings, urls, middleware)  │
│  - Apps (contacts, publications, cases) │
│  - Models (Contact, Case, Publication)  │
│  - ViewSets (API endpoints)             │
│  - Serializers (JSON conversion)        │
│  - Filters (search, filtering)          │
│  - Admin (Django admin interface)       │
│  - Services (external APIs)             │
└─────────────────────────────────────────┘
         SQLite3 ORM (localhost:8000)
                    │
                    ↓
┌─────────────────────────────────────────┐
│   DATABASE (SQLite3 local)              │
│  - db.sqlite3 (arquivo único)           │
│  - Tables: contacts, cases, cases_party │
│  - Tables: publications, search_history │
│  - All data local (no cloud)            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  EXTERNAL SERVICE (PJe Comunica API)    │
│  - Busca de publicações                 │
│  - API de tribunais                     │
│  - Acesso de leitura (read-only)        │
└─────────────────────────────────────────┘
```

---

## 11. MATURIDADE DO PROJETO POR FASE

```
Fase 1: Contacts       |████████████████ 100% ✅
Fase 2: Refatoração    |██████████░░░░░░░ 60%
Fase 3: Publications   |████████████████ 100% ✅
Fase 4: Cases          |████░░░░░░░░░░░░ 30%
Fase 5: Notifications  |░░░░░░░░░░░░░░░░░ 0%
Fase 6: Relatórios     |░░░░░░░░░░░░░░░░░ 0%
Fase 7: Multi-User     |░░░░░░░░░░░░░░░░░ 0%
```

---

**Última atualização:** 24 de fevereiro de 2026

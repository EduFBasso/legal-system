# 📋 PLANO DE AUDITORIA + REFACTOR - CASES SYSTEM

## 🎯 Objetivo
Auditar e refatorar o sistema de Cases desde o backend, garantindo:
- Estrutura limpa (sem duplicações)
- Padrão de nomenclatura consistente
- Modularização de componentes
- Testes de cada etapa

---

## 📊 ESTRUTURA ATUAL

### Backend (Django)
```
Case (modelo principal)
├── numero_processo (CNJ format)
├── titulo, tribunal, comarca, vara
├── status (ATIVO/INATIVO/SUSPENSO/ARQUIVADO/ENCERRADO)
├── clients (ManyToMany através de CaseParty)
└── Relacionamentos:
    ├── movimentacoes (CaseMovement) 1:N
    ├── tasks (CaseTask) 1:N
    └── prazos (CasePrazo) 1:N

CaseMovement
├── case (FK)
├── data, tipo, titulo, descricao
├── prazo, data_limite_prazo
├── completed (bool)
├── origem (MANUAL/DJE/ESAJ/PJE)
└── tasks (CaseTask relação reversa) 1:N

CaseTask
├── case (FK)
├── movimentacao (FK, nullable) ← PONTO CRÍTICO
├── titulo, descricao
├── urgencia (NORMAL, URGENTE, URGENTISSIMO) ← PRECISA MUDAR
├── data_vencimento
├── status (PENDENTE/EM_ANDAMENTO/CONCLUIDA/CANCELADA)
└── cor_urgencia, vencida (properties)
```

### Frontend (React)
```
DeadlinesPage
├── Agrupamento por urgencia (URGENTISSIMO/URGENTE/NORMAL)
├── Seleção por task
├── Links para CaseDetailPage (nova janela)
└── Links para MovimentacoesTab (nova janela com highlight)

CaseDetailPage
├── CaseInfoTab
├── MovimentacoesTab
│   ├── Movement cards
│   ├── Task cards (clicáveis)
│   └── Publication links
├── Contatos (parties)
└── Prazos

MovimentacoesTab
├── Timeline de movimentações
├── Tarefas vinculadas a cada movimentação
├── Seleção de task com destaque azul (3s)
└── Real-time sync via BroadcastChannel
```

---

## 🔍 DUPLICAÇÕES IDENTIFICADAS

### Backend
- [ ] Verificar se `data_limite_prazo` em CaseMovement duplica com CaseTask.data_vencimento
- [ ] Verificar campos redundantes em Case (auto_status vs status)
- [ ] Imports e imports repetidos

### Frontend
- [ ] DeadlinesPage: 3 seções idênticas (URGENTISSIMO/URGENTE/NORMAL)
- [ ] Handlers repetidos: `onClick` → setSelectedTaskId
- [ ] CSS duplicado: selection styles para 3 urgências
- [ ] MovimentacoesTab: task rendering repetido

### Nomenclatura
- [ ] Backend: `urgencia=URGENTISSIMO` vs Frontend: `urgentissimo` (CSS classes)
- [ ] Necessidade de padrão em INGLÊS: CRITICAL, URGENT, NORMAL

---

## 📝 PLANO DE EXECUÇÃO (Por Etapas)

### FASE 1: AUDITORIA BACKEND
**Objetivo:** Mapear estrutura, identificar problemas

- [ ] **Etapa 1.1**: Revisar models.py (Case, CaseMovement, CaseTask)
  - Duplicações em data_limite_prazo vs data_vencimento?
  - Campos redundantes?
  - Relacionamentos corretos?
  - _Commit_: `audit: document Case model structure`

- [ ] **Etapa 1.2**: Revisar serializers.py
  - Quantos serializers para Case?
  - Duplicação em nested serializers?
  - _Commit_: `audit: document Case serializers`

- [ ] **Etapa 1.3**: Revisar views.py
  - Quantos endpoints para Case, Movement, Task?
  - Lógica duplicada em filters?
  - _Commit_: `audit: document Case API endpoints`

### FASE 2: AUDITORIA FRONTEND
**Objetivo:** Mapear componentes, identificar problemas

- [ ] **Etapa 2.1**: DeadlinesPage.jsx
  - Extrair estrutura das 3 seções (URGENTISSIMO/URGENTE/NORMAL)
  - Medir duplicação (~quantas linhas?)
  - _Commit_: `audit: analyze DeadlinesPage structure`

- [ ] **Etapa 2.2**: CaseDetailPage.jsx + MovimentacoesTab.jsx
  - Quantas vezes renderiza tasks?
  - Handlers duplicados?
  - _Commit_: `audit: analyze CaseDetail structure`

- [ ] **Etapa 2.3**: CSS (DeadlinesPage.css, MovimentacoesTab.css)
  - Classes redundantes?
  - Padrão de nomes?
  - _Commit_: `audit: analyze CSS duplication`

### FASE 3: PLANO DE REFACTOR
**Objetivo:** Criar roadmap detalhado

- [ ] **Etapa 3.1**: Decidir nomenclatura padrão
  - CRITICAL, URGENT, NORMAL (inglês)
  - Manter compatibilidade com migrations
  - _Commit_: `docs: define naming standard for urgency levels`

- [ ] **Etapa 3.2**: Criar componentes reutilizáveis
  - TaskCard.jsx (reutilizável)
  - TaskSelectionLogic (hook)
  - _Commit_: `refactor: create TaskCard component`

- [ ] **Etapa 3.3**: Modularizar DeadlinesPage
  - Unificar 3 seções em 1 loop
  - Usar TaskCard
  - _Commit_: `refactor: modularize DeadlinesPage`

- [ ] **Etapa 3.4**: Limpar CSS
  - Remover duplicações
  - Consolidar estilos de urgência
  - _Commit_: `refactor: consolidate CSS selectors`

- [ ] **Etapa 3.5**: Refatorar TasksTab (nova aba de tarefas)
  - Adicionar seleção clicável (selectedTaskId)
  - Ajustar estilos visuais (borda 3px, box-shadow)
  - Trazer handleOpenMovement (links em nova janela)
  - Consolidar CSS (remover `.publicacao-card`)
  - _Commits_:
    - `refactor: add task selection to TasksTab`
    - `refactor: standardize TasksTab styling with DeadlinesPage pattern`
    - `refactor: update TasksTab movement links to window.open`

- [ ] **Etapa 3.6**: Documentar arquitetura
  - README de Cases
  - Fluxo: Case → Movement → Task
  - _Commit_: `docs: document Cases architecture`

### FASE 4: PRÓXIMO ESCOPO
**Objetivo:** Preparar para Tarefas vinculadas a Process (não a Movement)

- [ ] Criar nova guia em CaseDetailPage: "Tarefas do Processo"
- [ ] Diferenciar: Task vinculada a Movement vs Task vinculada a Case
- [ ] Preparar para Google Calendar integration

---

## ⚠️ RISCOS + MITIGAÇÃO

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking change em serializers | ALTA | CRIT | Test + commit pequeno |
| Mudança em migrations | MÉDIA | ALTO | Backup antes, testar localmente |
| Front não sincroniza | MÉDIA | ALTO | BroadcastChannel + console.log |
| CSS quebrado após consolidação | ALTA | MÉDIO | Screenshots de antes/depois |

---

## 📋 CHECKLIST

**Começo:**
- [ ] Clonar repo, verificar versão
- [ ] Terminal backend: `python manage.py test`
- [ ] Terminal frontend: `npm run dev` (sem erros)

**Cada commit:**
- [ ] Fazer change isolado
- [ ] Testar: backend console + frontend console (sem erros)
- [ ] Screenshot (antes/depois se visual)
- [ ] Commit message detalhado

**Cada fase:**
- [ ] Resumo do que foi feito
- [ ] O que será próximo
- [ ] Riscos identificados

---

## 🚀 COMEÇAR PELA ETAPA 1.1: MODELS

Quer rodar a auditoria do models.py agora?

```bash
cd backend
python manage.py shell
# Explorar:
# from apps.cases.models import Case, CaseMovement, CaseTask
# Case._meta.fields
# CaseTask.movimentacao.field
```

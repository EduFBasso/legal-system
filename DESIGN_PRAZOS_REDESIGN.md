# 📋 REDESIGN - ABA PRAZOS (DEADLINES TAB) - v3 FINAL

## Conceito: Movimentação → Prazos → Tarefas Vinculadas

**Nova estrutura de dados:**
- Cada **Movimentação** pode ter múltiplos **Prazos** (via model CasePrazo)
- Cada **Movimentação** pode ter múltiplas **Tarefas** vinculadas
- Tarefas podem ser:
  - **Automáticas**: Criadas pelo sistema quando detecta prazo
  - **Manuais**: Criadas pela advogada com botão "+ Adicionar Tarefa"
- **Tarefas gerais** (não vinculadas) ficam na aba "Tarefas" separada

## Layout Proposto (Cards Hierárquicos)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  PROCESSO: 0000623-69.2026.8.26.0320                    [🗂 Detalhes]  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📅 PRAZOS PROCESSUAIS                                                  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 📅 18/02/2026  |  🏛️ Foro de Limeira - 2ª Vara Cível          │   │
│  │                                                                │   │
│  │ ═══════════════════════════════════════════════════════════   │   │
│  │                                                                │   │
│  │ ☑  21/02/2026  |  ⏰ URGENTÍSSIMO (2 dias restantes)          │   │
│  │    Manifestação ao cumprimento de sentença                    │   │
│  │                                                                │   │
│  │ ☐  11/03/2026  |  ✅ NO PRAZO (37 dias restantes)             │   │
│  │    Apresentar contrarrazões ao recurso                        │   │
│  │                                                                │   │
│  │ ─────────────────────────────────────────────────────────────  │   │
│  │ 📌 TAREFAS VINCULADAS                                         │   │
│  │                                                                │   │
│  │    ☐  Anexar documentos comprobatórios                        │   │
│  │    ☑  Analisar cálculos apresentados                          │   │
│  │    ☐  Elaborar impugnação                                     │   │
│  │                                                                │   │
│  │    + [Adicionar tarefa]                                        │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 📅 25/01/2026  |  🏛️ Foro de Limeira - 4ª Vara Cível          │   │
│  │                                                                │   │
│  │ ═══════════════════════════════════════════════════════════   │   │
│  │                                                                │   │
│  │ ☐  07/03/2026  |  ✅ NO PRAZO (33 dias restantes)             │   │
│  │    Recurso de apelação ao TJ                                  │   │
│  │                                                                │   │
│  │ ─────────────────────────────────────────────────────────────  │   │
│  │ 📌 TAREFAS VINCULADAS                                         │   │
│  │                                                                │   │
│  │    (nenhuma tarefa criada)                                    │   │
│  │                                                                │   │
│  │    + [Adicionar tarefa]                                        │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Estrutura do Banco de Dados

### Modelo CasePrazo (NOVO)

```python
class CasePrazo(models.Model):
    movimentacao = ForeignKey(CaseMovement, related_name='prazos')
    prazo_dias = IntegerField()  # 15, 30, 45, etc
    data_limite = DateField()  # auto-calculado: data_mov + prazo_dias
    descricao = CharField(max_length=255)  # "Manifestação", "Recurso", etc
    completed = BooleanField(default=False)
    
    @property
    def dias_restantes(self):
        return (self.data_limite - today).days
    
    @property
    def status_urgencia(self):
        # URGENTISSIMO (0-3), URGENTE (4-7), PROXIMO (8-15), NO_PRAZO (16+)
```

### Relacionamentos

```
Case (processo)
  └─ CaseMovement[] (movimentações)
       ├─ CasePrazo[] (prazos: 15 dias, 30 dias, etc)
       └─ CaseTask[] (tarefas vinculadas: auto + manual)
```

## Estrutura de Campos UI

### Header da Movimentação
| Campo | Fonte | Exemplo |
|-------|-------|---------|
| Data | CaseMovement.data | 18/02/2026 |
| Órgão | Publication.orgao (via FK) | Foro de Limeira - 2ª Vara Cível |

### Card de Prazo
| Campo | Tipo | Cálculo |
|-------|------|---------|
| Checkbox | Boolean | CasePrazo.completed |
| Data Limite | Date | CasePrazo.data_limite |
| Status Badge | Calculated | baseado em dias_restantes |
| Descrição | String | CasePrazo.descricao |

### Tarefas Vinculadas
| Campo | Fonte |
|-------|-------|
| Checkbox | CaseTask.completed |
| Título | CaseTask.titulo |
| FK | CaseTask.movimentacao_id = CaseMovement.id |

## Cores/Status (Baseado em Dias Restantes)

```
0-3 dias:   ⏰ URGENTÍSSIMO  (#fecaca / #991b1b)
4-7 dias:   🔴 URGENTE       (#fed7aa / #92400e)
8-15 dias:  🟡 PRÓXIMO       (#fef3c7 / #78350f)
16+ dias:   ✅ NO PRAZO      (#d1fae5 / #065f46)
Concluído:  ✔️ CONCLUÍDO     (#e0e7ff / #3730a3)
Vencido:    ❌ VENCIDO       (#f3f4f6 / #6b7280, line-through)
```

## Componentes React

```
DeadlinesTab
├─ Header (número processo)
└─ MovementDeadlineCard[] (para cada movimentação com prazos)
    ├─ MovementHeader (📅 data | 🏛️ órgão)
    ├─ PrazoRow[] (prazos desta movimentação)
    │   ├─ Checkbox (completed)
    │   ├─ Data limite + Status Badge
    │   └─ Descrição
    └─ TasksSection
        ├─ TaskRow[] (tarefas com movimentacao FK)
        └─ AddTaskButton (+ Adicionar tarefa)
```

## API Endpoints

```
GET /api/case-prazos/?case_id=123           # Todos os prazos do processo
GET /api/case-prazos/?movimentacao_id=456   # Prazos de uma movimentação
POST /api/case-prazos/                      # Criar novo prazo
PATCH /api/case-prazos/{id}/                # Atualizar prazo (completed, etc)

GET /api/case-movements/?case_id=123        # Retorna movements com nested prazos
GET /api/case-tasks/?movimentacao_id=456    # Tarefas vinculadas à movimentação
POST /api/case-tasks/                       # Criar tarefa manual
```

## Fluxo de Dados Frontend

```jsx
// Carregar movimentações (já inclui prazos nested)
const movements = await caseMovementsService.getMovementsByCase(caseId);
// movements[].prazos[] já vem populado

// Filtrar apenas movimentações com prazos
const movementsWithPrazos = movements.filter(m => m.prazos && m.prazos.length > 0);

// Carregar tarefas do caso e agrupar por movimentação
const tasks = await caseTasksService.getTasksByCase(caseId);
const tasksByMovement = groupBy(tasks, 'movimentacao');
```

## Separação de Abas

| Aba | Conteúdo | Filtro |
|-----|----------|--------|
| **Prazos** | Movimentações com prazos + tarefas vinculadas | `movements.filter(m => m.prazos.length > 0)` |
| **Tarefas** | Tarefas gerais do processo | `tasks.filter(t => !t.movimentacao_id)` |
| **Movimentações** | Todas as movimentações | Sem filtro |

## Lógica de Notificações

- ✅ **Checkbox marcado** → `completed = true` → sai do sistema de notificações
- 🔔 **Notificação automática** → backend verifica `completed = false` e dias_restantes
- 📲 **Web Push** → dispara quando dias <= 3 (urgentíssimo) ou dias <= 7 (urgente)

---

## ✅ Status Implementação Backend

- ✅ Modelo CasePrazo criado
- ✅ Migration 0010_add_caseprazo_model aplicada
- ✅ CasePrazoSerializer with dias_restantes/status_urgencia
- ✅ CasePrazoViewSet com filtros por case_id/movimentacao_id
- ✅ URL `/api/case-prazos/` registrada
- ✅ CaseMovementSerializer com nested prazos[]
- ✅ Testes passando (46 passed)

**Próximo passo:** Implementar UI no frontend (DeadlinesTab com cards hierárquicos)

**Estrutura de dados:**
- Cada **Movimentação** pode gerar um ou mais **Prazos Processuais**
- Cada **Prazo** pode ter múltiplas **Tarefas** vinculadas
- **Tarefas gerais** (não vinculadas a movimentação) ficam na aba "Tarefas" separada

## Layout Proposto (Hierárquico)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  PROCESSO: 0000623-69.2026.8.26.0320                    [🗂 Detalhes]  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📅 PRAZOS PROCESSUAIS                                                  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 📅 18/02/2026  |  🏛️ Foro de Limeira - 2ª Vara Cível          │   │
│  │                                                                │   │
│  │ ─────────────────────────────────────────────────────────────  │   │
│  │                                                                │   │
│  │ ☑  21/02/2026  │  Manifestação  │  ⏰ URGENTE (2 dias)        │   │
│  │    ─────────────────────────────────────────────────────────   │   │
│  │    📝 Descrição: Apresentar defesa ao cumprimento de sentença │   │
│  │                                                                │   │
│  │    📌 Tarefas vinculadas:                                     │   │
│  │       ☐  Anexar documentos comprobatórios                     │   │
│  │       ☑  Analisar cálculos apresentados                       │   │
│  │       ☐  Elaborar impugnação                                  │   │
│  │       + [Nova tarefa]                                          │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 📅 25/01/2026  |  🏛️ Foro de Limeira - 4ª Vara Cível          │   │
│  │                                                                │   │
│  │ ─────────────────────────────────────────────────────────────  │   │
│  │                                                                │   │
│  │ ☐  15/03/2026  │  Recurso  │  ✅ NO PRAZO (41 dias)           │   │
│  │    ─────────────────────────────────────────────────────────   │   │
│  │    📝 Descrição: Recurso de apelação ao TJ                    │   │
│  │                                                                │   │
│  │    📌 Tarefas vinculadas:                                     │   │
│  │       (nenhuma tarefa criada)                                 │   │
│  │       + [Nova tarefa]                                          │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 📅 15/01/2026  |  🏛️ Foro de Americana - 1ª Vara Família      │   │
│  │                                                                │   │
│  │ ─────────────────────────────────────────────────────────────  │   │
│  │                                                                │   │
│  │ ☐  28/03/2026  │  Contrarrazões  │  ✅ NO PRAZO (54 dias)    │   │
│  │    ─────────────────────────────────────────────────────────   │   │
│  │    📝 Descrição: Responder recurso da parte contrária         │   │
│  │                                                                │   │
│  │ ☐  12/04/2026  │  Sustentação oral  │  ✅ NO PRAZO (69 dias) │   │
│  │    ─────────────────────────────────────────────────────────   │   │
│  │    📝 Descrição: Preparar sustentação oral em sessão          │   │
│  │                                                                │   │
│  │    📌 Tarefas vinculadas:                                     │   │
│  │       ☐  Agendar reunião com cliente                          │   │
│  │       ☐  Preparar slides para sustentação                     │   │
│  │       + [Nova tarefa]                                          │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Estrutura de Campos (Por Prazo)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **Checkbox** | Boolean | Marca como concluído → remove de notificações |
| **Data Vencimento** | Date | Calculado (data movimentação + prazo_dias) |
| **Descrição** | String | Motivo/objetivo do prazo (uma linha) |
| **Status Badge** | Calculated | Cor baseada em dias restantes |
| **Tarefas vinculadas** | Array | CaseTasks com FK para esta movimentação |

## Cores/Status (Baseado em Dias Restantes)

```
0-3 dias:   ⏰ URGENTÍSSIMO  (#fecaca / #991b1b)
4-7 dias:   🔴 URGENTE       (#fed7aa / #92400e)
8-15 dias:  🟡 PRÓXIMO       (#fef3c7 / #78350f)
16+ dias:   ✅ NO PRAZO      (#d1fae5 / #065f46)
Concluído:  ✔️ CONCLUÍDO     (#e0e7ff / #3730a3)
Vencido:    ❌ VENCIDO       (#f3f4f6 / #6b7280, strikethrough)
```

## Componentes React Necessários

```
DeadlinesTab (principal)
├─ Header (número processo)
└─ MovementDeadlineGroup[] (para cada movimentação com prazo)
    ├─ MovementHeader (data + órgão)
    ├─ DeadlineRow[] (prazos desta movimentação)
    │   ├─ Checkbox (completed)
    │   ├─ Data vencimento
    │   ├─ Descrição
    │   └─ StatusBadge
    └─ TasksList (tarefas com mov.id FK)
        ├─ TaskRow[]
        └─ AddTaskButton
```

## Fluxo de Dados

```
Backend:
- CaseMovement (id, data, orgao, prazo, data_limite_prazo, completed, descricao)
- CaseTask (id, case_id, movimentacao_id, titulo, completed)
   ↓
Frontend:
- deadlines = movements.filter(prazo !== null)
- groupedByMovement = groupBy(deadlines, 'id')
- tasks = tasksService.getTasksByCase(case_id)
  ↓ filter by movimentacao_id
```

## Nova Separação de Abas

| Aba | Conteúdo |
|-----|----------|
| **Prazos** | Movimentações com prazos + tarefas vinculadas a essas movimentações |
| **Tarefas** | Tarefas gerais do processo (movimentacao_id = null) |
| **Movimentações** | Todas as movimentações (com ou sem prazo) |

## Lógica de Notificações

- ✅ **Checkbox marcado** → `completed = true` → sai do sistema de notificações
- 🔔 **Notificação automática** → backend verifica `completed = false` e dias restantes
- 📲 **Web Push** → dispara quando dias <= 3 (urgentíssimo) ou dias <= 7 (urgente)

## Questões Implementação

1. **Backend:** Adicionar campo `descricao` em CaseMovement para armazenar motivo do prazo?
2. **Múltiplos prazos mesma movimentação:** Como distingui-los no banco? (atualmente 1:1)
3. **Ordenação automática:** Por data vencimento (crescente) ou por urgência?

---

**Próximo passo:** Implementar estrutura hierárquica MovementDeadlineGroup com tarefas aninhadas?

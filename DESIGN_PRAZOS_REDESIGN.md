# 📋 REDESIGN - ABA PRAZOS (DEADLINES TAB) - v2

## Conceito: Hierarquia Movimentação → Prazo → Tarefas

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

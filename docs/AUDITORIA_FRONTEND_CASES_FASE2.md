# Auditoria Frontend - Cases System (Fase 2)

**Data (início):** 04/03/2026  
**Data (atualização):** 22/03/2026  
**Etapa:** Fase 2 - Auditoria Frontend (Master Dashboard + Deadlines + CaseDetail + readonly)  
**Status:** ✅ Concluída

---

## Atualização (22/03/2026) — Estado real do código

- O “main” de tarefas agendadas foi extraído para [frontend/src/components/DeadlinesContent.jsx](frontend/src/components/DeadlinesContent.jsx) e a rota [frontend/src/pages/DeadlinesPage.jsx](frontend/src/pages/DeadlinesPage.jsx) virou wrapper fino.
- O card de tarefa foi consolidado em [frontend/src/components/TaskCard.jsx](frontend/src/components/TaskCard.jsx) (reduz duplicação e melhora testabilidade).
- O painel Master passou a renderizar tarefas agendadas inline (sem abrir nova aba), reutilizando `DeadlinesContent` e mantendo filtros.
- Em `readOnly`, as interações que mutam/abrem detalhes (processo/movimentação) ficam desabilitadas.
- Navegação foi padronizada com query params (`readonly=1`, `team_member_id`, `tab=financeiro`) via [frontend/src/utils/publicationNavigation.js](frontend/src/utils/publicationNavigation.js).

## Etapa 2.1: DeadlinesPage.jsx Audit

> ⚠️ Nota (importante): a análise detalhada abaixo foi escrita a partir de uma versão anterior em que o “main” de tarefas ainda vivia em `DeadlinesPage.jsx`.
> Em 22/03/2026, o “main” foi extraído para `DeadlinesContent.jsx` e `DeadlinesPage.jsx` virou um wrapper fino; mantenho o texto abaixo apenas como histórico/racional de refactor.

### Análise Geral

**Arquivo (histórico):** [frontend/src/pages/DeadlinesPage.jsx](frontend/src/pages/DeadlinesPage.jsx)  
**Tamanho (histórico):** 471 linhas  
**Padrão:** React functional component com hooks (useState, useMemo, useCallback)

### Estrutura do Componente

```
DeadlinesPage (471 linhas) — histórico
├── State Management (4 states)
│   ├── tasks - array de tarefas
│   ├── loading - boolean
│   ├── error - string error
│   ├── selectedUrgency - filtro de urgência
│   └── selectedTaskId - tarefa selecionada
│
├── Helper Functions (6 functions)
│   ├── parseLocalDate() - parse de datas
│   ├── calculateUrgency() - calcula urgência
│   ├── formatDaysRemaining() - formata dias
│   ├── isOverdue() - verifica atraso
│   ├── isToday() - verifica se é hoje
│   ├── getMovementLinkUrl() - gera URL
│   ├── handleMovementLinkClick() - handler
│   ├── handleOpenCase() - abre case em nova aba
│   ├── handleOpenMovement() - abre movement em nova aba
│   ├── handleToggleTaskStatus() - atualiza status
│   └── formatDate() - formata data
│
├── Computed Values (useMemo - 8 memos)
│   ├── grouped - agrupa tarefas por urgência
│   ├── totalTasks - total de tarefas
│   ├── completedTasks - tarefas concluídas
│   ├── showUrgentissimo - flag para mostrar seção
│   ├── showUrgente - flag para mostrar seção
│   ├── showNormal - flag para mostrar seção
│   └── showUrgencyContainerBorder - flag para border
│
├── Effects (2)
│   ├── useEffect[fetchAllTasks] - carrega tarefas
│   └── useEffect[subscribeToTaskUpdates] - sincroniza atualizações
│
└── Render (3 urgency sections)
    ├── URGENTISSIMO section (~45 linhas)
    ├── URGENTE section (~45 linhas)
    └── NORMAL section (~45 linhas)
```

---

## 🔴 Duplicação Identificada

### Seções de Urgência (URGENTISSIMO, URGENTE, NORMAL)

**Padrão Repetido 3 vezes (linhas ~340-420):**

```jsx
{
  showUrgency && grouped.URGENCY.length > 0 && (
    <div
      className={`urgency-section ${showUrgencyContainerBorder ? "urgency-section" : ""}`}
    >
      <div className="tasks-list">
        {grouped.URGENCY.map((task) => (
          <div
            key={task.id}
            className={`task-item urgency ${task.status === "CONCLUIDA" ? "completed" : ""} ${selectedTaskId === task.id ? "selected" : ""}`}
          >
            <div className="task-checkbox">
              <input
                type="checkbox"
                checked={task.status === "CONCLUIDA"}
                onChange={() => handleToggleTaskStatus(task)}
                className="checkbox-input"
              />
            </div>

            <div
              className="task-main"
              onClick={() =>
                setSelectedTaskId(selectedTaskId === task.id ? null : task.id)
              }
            >
              <div className="task-title">{task.titulo}</div>
              {task.descricao && (
                <div className="task-description">{task.descricao}</div>
              )}
              <div className="task-process-meta">
                <a
                  className="task-process-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCase(task.case);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {task.case_numero}
                </a>
                {task.movimentacao && (
                  <>
                    <span className="task-meta-dot">•</span>
                    <a
                      className="task-movement-link-anchor"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMovement(
                          task.case,
                          task.movimentacao,
                          task.id,
                        );
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      📋 {task.movimentacao_titulo}
                    </a>
                  </>
                )}
              </div>
              <div className="task-meta">
                <span
                  className={`task-date ${isOverdue(task.data_vencimento) ? "overdue-date" : ""} ${isToday(task.data_vencimento) ? "today-date" : ""}`}
                >
                  {formatDate(task.data_vencimento)}
                </span>
                <span className="task-meta-dot">•</span>
                <span
                  className={`task-remaining ${isOverdue(task.data_vencimento) ? "overdue-remaining" : ""} ${isToday(task.data_vencimento) ? "today-remaining" : ""}`}
                >
                  {formatDaysRemaining(task.data_vencimento)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Diferenças entre repetições:**

- Linha 1: `showUrgentissimo` vs `showUrgente` vs `showNormal`
- Linha 2: `grouped.URGENTISSIMO` vs `grouped.URGENTE` vs `grouped.NORMAL`
- Linha 2: classe `urgentissimo-section` vs `urgente-section` vs `normal-section`
- Linha 6: className `.urgentissimo`, `.urgente`, `.normal`

### Métricas de Duplicação

| Item                | Contagem | Linhas Totais | Duplicação         |
| ------------------- | -------- | ------------- | ------------------ |
| Seção URGENTISSIMO  | 1        | ~45           | Base               |
| Seção URGENTE       | 1        | ~45           | 100% do padrão     |
| Seção NORMAL        | 1        | ~45           | 100% do padrão     |
| **Total duplicado** | 2        | ~90           | **38% do arquivo** |

### Handlers Duplicados

**Padrão 1: onClick handlers (repetido 2x por urgência)**

```jsx
onClick={(e) => { e.stopPropagation(); handleOpenCase(task.case); }}
onClick={(e) => { e.stopPropagation(); handleOpenMovement(task.case, task.movimentacao, task.id); }}
```

- Aparece 3x (um por urgência) = **6 handlers iguais**

**Padrão 2: className condicional (repetido 3x por urgência)**

```jsx
className={`task-date ${isOverdue(task.data_vencimento) ? 'overdue-date' : ''} ${isToday(task.data_vencimento) ? 'today-date' : ''}`}
className={`task-remaining ${isOverdue(task.data_vencimento) ? 'overdue-remaining' : ''} ${isToday(task.data_vencimento) ? 'today-remaining' : ''}`}
```

- Aparece 3x = **6 classNames idênticas**

---

## 🎯 Oportunidades de Refatoração

### 1. Extrair TaskCard Component (Etapa 3.1)

**Impacto:** ⭐⭐⭐⭐⭐ (CRÍTICO)  
**Esforço:** ~1 hora

**Antes:**

```jsx
// DeadlinesPage.jsx - 471 linhas (histórico)
// 3 seções idênticas rendering task.map()
<div className={`task-item urgentissimo ...`}>
  {/* 25 linhas repetidas 3x */}
</div>
```

**Depois:**

```jsx
// TaskCard.jsx - novo componente (30 linhas)
export function TaskCard({
  task,
  urgency,
  selectedTaskId,
  onSelectTask,
  onOpenCase,
  onOpenMovement,
  onToggleStatus,
}) {
  return <div className={`task-item ${urgency} ...`}>{/* JSX limpo */}</div>;
}

// DeadlinesPage.jsx - 200 linhas (reduz 57%)
{
  grouped[urgency].map((task) => (
    <TaskCard
      key={task.id}
      task={task}
      urgency={urgency}
      selectedTaskId={selectedTaskId}
      onSelectTask={setSelectedTaskId}
      onOpenCase={handleOpenCase}
      onOpenMovement={handleOpenMovement}
      onToggleStatus={handleToggleTaskStatus}
    />
  ));
}
```

**Benefícios:**

- ✅ Reduz 241 linhas (~51%)
- ✅ DRY principle - single source of truth
- ✅ Reutilizável em TasksTab (Etapa 3.5)
- ✅ Facilita testes unitários

---

### 2. Consolidar Loop das 3 Urgências (Etapa 3.2)

**Impacto:** ⭐⭐⭐⭐ (ALTO)  
**Esforço:** ~30 minutos

**Antes:**

```jsx
const URGENCIES = ["URGENTISSIMO", "URGENTE", "NORMAL"];

const urgencyConfig = {
  URGENTISSIMO: { show: showUrgentissimo, className: "urgentissimo-section" },
  URGENTE: { show: showUrgente, className: "urgente-section" },
  NORMAL: { show: showNormal, className: "normal-section" },
};

{
  Object.entries(urgencyConfig).map(
    ([urgency, config]) =>
      config.show &&
      grouped[urgency].length > 0 && (
        <UrgencySection
          key={urgency}
          urgency={urgency}
          tasks={grouped[urgency]}
          className={config.className}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onOpenCase={handleOpenCase}
          onOpenMovement={handleOpenMovement}
          onToggleStatus={handleToggleTaskStatus}
          isOverdue={isOverdue}
          isToday={isToday}
          formatDate={formatDate}
          formatDaysRemaining={formatDaysRemaining}
        />
      ),
  );
}
```

**Benefícios:**

- ✅ Single responsibility - UrgencySection component
- ✅ Configuração centralizada (fácil adicionar/remover urgências)
- ✅ Reduz JSX nesting

---

### 3. Encapsular Lógica de Urgência (Etapa 3.3)

**Impacto:** ⭐⭐⭐ (MÉDIO)  
**Esforço:** ~20 minutos

**Antes:**

```jsx
const showUrgentissimo = useMemo(
  () => selectedUrgency === null || selectedUrgency === "URGENTISSIMO",
  [selectedUrgency],
);
const showUrgente = useMemo(
  () => selectedUrgency === null || selectedUrgency === "URGENTE",
  [selectedUrgency],
);
const showNormal = useMemo(
  () => selectedUrgency === null || selectedUrgency === "NORMAL",
  [selectedUrgency],
);
```

**Depois:**

```jsx
const useUrgencyVisibility = (selectedUrgency) => {
  return useMemo(
    () => ({
      URGENTISSIMO:
        selectedUrgency === null || selectedUrgency === "URGENTISSIMO",
      URGENTE: selectedUrgency === null || selectedUrgency === "URGENTE",
      NORMAL: selectedUrgency === null || selectedUrgency === "NORMAL",
    }),
    [selectedUrgency],
  );
};

const visibility = useUrgencyVisibility(selectedUrgency);
```

**Benefícios:**

- ✅ Reusable hook
- ✅ Consolidado em um único objeto
- ✅ Facilita testes

---

## 📊 Análise de Qualidade

| Métrica               | Valor | Status                              |
| --------------------- | ----- | ----------------------------------- |
| **Linhas**            | 471   | ⚠️ Alto                             |
| **Duplicação**        | ~38%  | 🔴 Crítica                          |
| **Functions**         | 11    | ✅ Bom                              |
| **useMemo calls**     | 8     | ✅ Otimização                       |
| **useCallback calls** | 1     | ✅ Apropriado                       |
| **Props drilling**    | Médio | ⚠️ Será resolvido em refactor       |
| **Testabilidade**     | Baixa | 🔴 Difícil testar handlers isolados |
| **Reusabilidade**     | Baixa | 🔴 TaskCard não extraído            |

---

## Próximas Etapas (Fase 2)

- ⏳ **Etapa 2.2:** Auditar CaseDetailPage.jsx
- ⏳ **Etapa 2.3:** Auditar CSS duplicação
- ⏳ **Documentar:** Achados completos Fase 2

---

## Etapa 2.2: CaseDetailPage.jsx Audit (Preview)

### Análise Preliminar

**Arquivo:** [frontend/src/pages/CaseDetailPage.jsx](frontend/src/pages/CaseDetailPage.jsx)  
**Tamanho:** 1936 linhas ⚠️ **CRÍTICO**  
**Hooks:** 70 (useState + useCallback + useEffect) 🔴 **EXTREMAMENTE ALTO**

### 🔴 Problemas Críticos Identificados

#### 1. **God Component Anti-pattern**

- 1936 linhas em um único arquivo
- 70 hooks (média React profissional: 3-5 por componente)
- Responsabilidades múltiplas:
  - Edição de case data
  - Gerenciamento de parties (contatos)
  - Gerenciamento de movimentações
  - Gerenciamento de tasks
  - Gerenciamento de publicações
  - Gerenciamento de financeiro
  - Modais e confirmação
  - URL params parsing
  - Tab navigation

#### 2. **Props Drilling Excessivo**

- MovimentacoesTab recebe ~15 props
- Dificulta manutenção e testes
- Cada novo prop exige atualização em cadeia

#### 3. **State Explosion**

```
Contagem de states (pelo menos 30+):
- caseData, formData
- movimentacoes, documentos, publicacoes
- contacts, parties, selectedContact
- isEditing, loading, saving, loading*
- activeSection, highighted*
- showContactModal, showSelectContactModal
- showDeleteConfirmModal
- editingParty, editingMovimentacaoId
- + form states para parties e movimentações
```

### ✅ O que funciona bem

- ✅ Tab navigation com query params (?tab=movements&focusMovement=X)
- ✅ Modal management para adicionar parties/movimentações
- ✅ Real-time sync com BroadcastChannel
- ✅ Soft delete com confirmação

### 📅 Plano de Refatoração (Phase 3)

**Não será feito neste ciclo** (complexidade muito alta) - Adiado para análise posterior

---

## Etapa 2.3: CSS Audit (Quick Review)

**Arquivos auditados:**

- DeadlinesPage.css (737 linhas)
- CaseDetailPage.css (1600+ linhas)
- MovimentacoesTab CSS

### 🔴 Duplicação em CSS Finder

**Pattern 1: Base classes repetidas (3x)**

```css
.stat-card.stat-urgentissimo .stat-number {
  color: #dc2626;
}
.stat-card.stat-urgente .stat-number {
  color: #f97316;
}
.stat-card.stat-normal .stat-number {
  color: #22c55e;
}

.stat-card.stat-urgentissimo .stat-label {
  color: #dc2626;
}
.stat-card.stat-urgente .stat-label {
  color: #f97316;
}
.stat-card.stat-normal .stat-label {
  color: #22c55e;
}
```

**Pattern 2: Hover states (3x)**

```css
.stat-card.stat-urgentissimo.stat-clickable:hover { ... }
.stat-card.stat-urgente.stat-clickable:hover      { ... }
.stat-card.stat-normal.stat-clickable:hover       { ... }
```

**Pattern 3: Selected states (3x)**

```css
.stat-card.stat-urgentissimo.stat-selected { ... }
.stat-card.stat-urgente.stat-selected      { ... }
.stat-card.stat-normal.stat-selected       { ... }
```

**Pattern 4: Task item classes (3x)**

```css
.task-item.urgentissimo.selected { ... }
.task-item.urgente.selected      { ... }
.task-item.normal.selected       { ... }
```

### 🎯 Oportunidade: CSS Variable Consolidation (Etapa 3.4)

**Antes:**

```css
/* 40+ lines per urgency level */
.stat-card.stat-urgentissimo .stat-number {
  color: #dc2626;
}
.stat-card.stat-urgentissimo .stat-label {
  color: #dc2626;
}
.stat-card.stat-urgentissimo.stat-clickable:hover {
  border-color: #dc2626;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}
```

**Depois:**

```css
:root {
  --urgency-urgentissimo-color: #dc2626;
  --urgency-urgentissimo-shadow: rgba(220, 38, 38, 0.15);
  --urgency-urgente-color: #f97316;
  --urgency-normal-color: #22c55e;
}

.stat-card.stat-urgency-number { color: var(--urgency-color); }
.stat-card.stat-selected {
  box-shadow: 0 4px 12px var(--urgency-shadow);
}

/* HTML data attributes for dynamic styling */
<div class="stat-card" data-urgency="urgentissimo">
```

**Benefícios:**

- ✅ Reduz CSS repetição em 40-50%
- ✅ Facilita manutenção (cores centralizadas)
- ✅ Suporta tema escuro (dark mode) futuro

---

## 📊 Resumo da Auditoria Fase 2

### Duplicação Encontrada

| Componente               | Linhas | Duplicação     | Impacto    |
| ------------------------ | ------ | -------------- | ---------- |
| DeadlinesPage 3 sections | 471    | **38%**        | 🔴 Crítico |
| DeadlinesPage CSS        | 737    | **25%**        | 🟡 Médio   |
| CaseDetailPage           | 1936   | Props drilling | 🔴 Crítico |
| CSS Variables            | global | **40%+**       | 🟡 Médio   |

### Oportunidades de Refatoração (Fase 3)

#### 🔴 Crítico (Impacto Alto)

1. **Etapa 3.1:** Extrair `TaskCard` component (DeadlinesPage)
   - Reduz: 241 linhas (~51%)
   - Reutiliza em: MovimentacoesTab, TasksTab
   - Esforço: ~1 hora

2. **Etapa 3.2:** Consolidar 3 urgency sections
   - Reduz: 90 linhas (~19%)
   - Loop configurável
   - Esforço: ~30 minutos

#### 🟡 Médio (Impacto Médio)

3. **Etapa 3.3:** Encapsular `useUrgencyVisibility` hook
   - Extrai: 3 useMemo calls
   - Reutiliza em: DeadlinesPage, TasksTab
   - Esforço: ~20 minutos

4. **Etapa 3.4:** CSS Variable consolidation
   - Reduz: 150+ linhas de CSS
   - Centraliza: Cores, sombras, transições
   - Esforço: ~1 hora

#### 🔵 Informação (CaseDetailPage)

5. **Investigação:** CaseDetailPage refactor
   - Arquivo: 1936 linhas, 70 hooks
   - Problema: God component
   - Status: Adiado para análise posterior
   - Requer: Quebra em sub-componentes (large refactor)

---

## 🔗 Referências para Fase 3

**Componentes a Extrair:**

- `TaskCard` - Usado em 3 locais (DeadlinesPage, MovimentacoesTab, future TasksTab)
- `UrgencySection` - Wrapper para agrupa seções por urgência
- `useUrgencyVisibility` - Custom hook para lógica de filtro

**Componentes Existentes para Reutilização:**

- `DeadlinesPage` - (será refatorado)
- `MovimentacoesTab` - (consumidor de TaskCard)
- `TasksTab` - (será reconstruído em Etapa 3.5 com TaskCard)

**Padrões a Seguir:**

- Props: Preferir `urgency` prop a classes CSS dinâmicas
- Handlers: Passar callbacks em vez de lógica inline
- Memoization: Manter useMemo para heavy computations (grouped, visibility)
- Styling: Data attributes para urgência ao invés de class combinations

---

## ✅ Fase 2 Concluída

**Etapas:**

- ✅ Etapa 2.1: DeadlinesPage audit (38% duplicação)
- ✅ Etapa 2.2: CaseDetailPage preview (1936 linhas, 70 hooks - God component)
- ✅ Etapa 2.3: CSS audit (25-40% duplicação)

**Próximo:** Fase 3 (Refactor Execution)

---

## Referências para Etapa 3

**Etapa 3.1 - TaskCard Component:**

- Será usado em: DeadlinesPage, MovimentacoesTab, TasksTab (Etapa 3.5)
- Props esperadas: task, urgency, selectedTaskId, handlers
- CSS será consolidado em próxima etapa

**Etapa 3.5 - TasksTab Rebuild:**

- Reutilizará TaskCard component
- Implementará Tipo 2 de tarefas (vinculada ao processo)
- Mesmo padrão de seleção e handlers

# 🔍 AUDITORIA: TasksTab vs Padrão DeadlinesPage/MovimentacoesTab

## 📊 COMPARAÇÃO

### TasksTab Atual (CaseDetailPage)
```jsx
// ❌ INCONSISTÊNCIAS ENCONTRADAS

1. SEM PADRÃO DE SELEÇÃO
   - Não tem: useState selectedTaskId
   - Não tem: onClick={() => setSelectedTaskId(...)}
   - Não há visual feedback de clique (bordas, cores)

2. DESIGN DIVERGENTE
   - Usa: `.publicacao-card` (CSS de publicações, não tarefas)
   - Usa: `borderLeft` verde/laranja/vermelho para urgência
   - Falta: 3px solid border + box-shadow ao clicar
   - Falta: Borda espessa ao selecionado

3. SEM INTERATIVIDADE
   - Apenas toggle checkbox (concluída/pendente)
   - Apenas delete
   - Falta: Seleção clicável
   - Falta: Feedback visual de seleção

4. NOMENCLATURA MISTA
   - Campo: `urgencia` (OK)
   - Valores: NORMAL, URGENTE, URGENTISSIMO (OK, mas diferente de frontend)
   - Display: `urgencia_display` (redundante?)

5. MOVIMENTAÇÃO VINCULADA
   - Tem link para movimentação (botão clicável)
   - Abre em mesma aba (inconsistente com padrão window.open)
   - Falta: Estilo de link de "referência" (tipo em DeadlinesPage)
```

### Padrão DeadlinesPage ✅
```jsx
// CONSISTÊNCIAS A MANTER

1. PADRÃO DE SELEÇÃO
   ✅ const [selectedTaskId, setSelectedTaskId] = useState(null)
   ✅ onClick={() => setSelectedTaskId(...)}
   ✅ Borda 3px sólida + box-shadow ao selecionado

2. DESIGN CONSISTENTE
   ✅ Cores de urgência (verde/laranja/vermelho)
   ✅ Background claro ao selecionado
   ✅ Transição 0.3s
   ✅ Classe `.selected` com borda

3. INTERATIVIDADE FLUIDA
   ✅ Clique seleciona/deseleciona (toggle)
   ✅ Feedback visual imediato
   ✅ Links em nova janela (window.open)

4. NOMENCLATURA PADRÃO
   ✅ urgencia = NORMAL | URGENTE | URGENTISSIMO
   ✅ Classes CSS com mesmo padrão
```

### Padrão MovimentacoesTab ✅
```jsx
// SELEÇÃO ANINHADA (PAI + FILHO)

1. SELEÇÃO DE MOVIMENTAÇÃO
   ✅ selectedMovimentacaoId com highlight azul
   ✅ 3s tempo limit
   ✅ Borda 3px + shadow

2. SELEÇÃO DE TASK DENTRO DE MOV
   ✅ selectedTaskId (separado)
   ✅ Limpa ao mudar de movimento
   ✅ Mesmo padrão visual (3px + shadow)

3. INTERATIVIDADE
   ✅ Clique em task seleciona
   ✅ Clique em outra mov limpa task anterior
   ✅ Links em nova janela
```

---

## 🎯 O QUE PRECISA MUDAR EM TasksTab

### Etapa 1: Adicionar Seleção
```jsx
// ADICIONAR:
const [selectedTaskId, setSelectedTaskId] = useState(null);

// MODIFICAR onClick:
onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
```

### Etapa 2: Ajustar Estilos
```jsx
// TRAZER PADRÃO:
const isSelected = selectedTaskId === task.id;

taskCardStyle = {
  borderLeft: '3px solid #3b82f6', // ← quando selecionado
  background: '#eff6ff',
  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
  transition: 'all 0.3s ease',
}
```

### Etapa 3: Ajustar Links
```jsx
// ANTES:
onClick={() => onOpenLinkedMovimentacao(task.movimentacao)}

// DEPOIS:
onClick={(e) => {
  e.stopPropagation();
  handleOpenMovementLink(task.case, task.movimentacao, task.id);
}}
// E usar: window.open(url, '_blank', 'width=1400...')
```

### Etapa 4: Remover Redundâncias
```jsx
// INVESTIGAR:
- Por que `publicacao-card` em vez de `task-card`?
- Por que `publicacao-meta-group` em vez de `task-meta-group`?
- Consolidar CSS: usar mesmas classes de DeadlinesPage
```

---

## 📋 PLANO DE REFACTOR TasksTab

### FASE 3.6: Refatorar TasksTab (Nova Etapa)

**Etapa 3.6.1: Adicionar seleção**
- [ ] Adicionar `selectedTaskId` state
- [ ] Adicionar onClick handler com toggle
- [ ] Testar: console deve ter selectedTaskId

**Etapa 3.6.2: Ajustar estilos visuais**
- [ ] Trazer padrão de cores de DeadlinesPage
- [ ] Aplicar borda 3px quando selecionado
- [ ] Transição 0.3s
- [ ] Screenshot antes/depois

**Etapa 3.6.3: Chamar handleOpenMovement**
- [ ] Trazer handleOpenMovement de DeadlinesPage
- [ ] Usar window.open com specs de janela
- [ ] Testar: deve abrir em nova janela

**Etapa 3.6.4: Consolidar CSS**
- [ ] Remover `.publicacao-card` aqui
- [ ] Usar `.task-item` (como em DeadlinesPage)
- [ ] Consolidar em TasksTab.css ou integrar em main

**Etapa 3.6.5: Testar fluxo completo**
- [ ] Criar tarefa em TasksTab
- [ ] Clicar (deve selecionar)
- [ ] Clicar em movimentação vinculada (deve abrir janela)
- [ ] Real-time sync entre janelas

---

## ⚠️ IMPACTO

| O Quê | Impacto | Esforço |
|-------|---------|---------|
| Adicionar seleção | BAIXO | 15 min |
| Ajustar estilos | MÉDIO | 20 min |
| Refatorar links | MÉDIO | 15 min |
| CSS consolidado | MÉDIO | 30 min |
| Testar fluxo | ALTO | 30 min |
| **TOTAL** | | **~110 min** |

---

## 🚀 PRÓXIMO PASSO

Incorporar **Etapa 3.6** no plano principal (AUDITORIA_CASES_PLAN.md):
- Renomear com ordem correta
- Adicionar subtasks
- Estimar commits

Quer começar a refatoração de TasksTab agora?

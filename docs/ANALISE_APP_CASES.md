# 📋 Análise Completa do App Cases (Processos Judiciais)

**Data**: 25/02/2026  
**Status**: Pronto para refatoração e modularização  
**Responsável**: Equipe de Desenvolvimento

---

## 📑 Sumário

1. [Visão Geral](#visão-geral)
2. [Estrutura Backend](#estrutura-backend)
3. [Estrutura Frontend](#estrutura-frontend)
4. [Fluxos de Dados](#fluxos-de-dados)
5. [Duplicações Identificadas](#duplicações-identificadas)
6. [Pontos Críticos](#pontos-críticos)
7. [Proposta de Modularização](#proposta-de-modularização)

---

## 🎯 Visão Geral

### Objetivo do App

O app `cases` é o **núcleo central do sistema jurídico**. Gerencia:

- **Processos judiciais** (número CNJ, tribunal, partes, movimentações)
- **Relacionamentos** entre processos e contatos (partes do processo)
- **Financeiro** (valor da causa, honorários, custos, participação)
- **Movimentações** (despachos, decisões, audiências, publicações)

### Arquitetura Atual

```
Backend (Django REST)
├── Models (5)
│   ├── Case (núcleo)
│   ├── CaseParty (ManyToMany com Contact)
│   ├── CaseMovement (movimentações)
│   ├── Payment (recebimentos)
│   └── Expense (despesas)
├── Serializers (6)
├── ViewSets (5)
└── URLs (routers)

Frontend (React + Vite)
├── Pages
│   ├── CaseListPage.jsx (NÃO ENCONTRADA - ⚠️)
│   └── CaseDetailPage.jsx (2388 linhas - GIGANTE)
├── Components
│   └── CaseCard.jsx (207 linhas - vai aqui)
├── Services (7 arquivos)
│   ├── casesService.js
│   ├── caseMovementsService.js
│   ├── casePartiesService.js
│   ├── financialService.js
│   └── deadlinesService.js
└── Styles
    └── CaseDetailPage.css (2863 linhas)
```

**Tamanho do Código**:

- `CaseDetailPage.jsx`: **2.388 linhas** (arquivo gigante!!!)
- `CaseDetailPage.css`: **2.863 linhas** (arquivo gigante!!!)
- Total Backend: ~1.150 linhas
- Total Frontend Pages/Components: ~2.600 linhas

⚠️ **PROBLEMA CRÍTICO**: `CaseDetailPage.jsx` é monolítica demais. Mistura:

- Lógica de 4 abas diferentes
- Formatadores, validadores, handlers
- JSX de múltiplas funcionalidades

---

## 🔧 Estrutura Backend

### Models (`backend/apps/cases/models.py`)

#### 1. **Case** (Principal)

**Responsabilidade**: Núcleo de dados do processo

| Campo                         | Tipo               | Propósito                                      |
| ----------------------------- | ------------------ | ---------------------------------------------- |
| `numero_processo`             | CharField(25)      | Identificação CNJ única                        |
| `numero_processo_unformatted` | CharField(20)      | Busca (apenas dígitos)                         |
| `titulo`                      | CharField(200)     | Descrição resumida                             |
| `tribunal`                    | CharField(10)      | TJSP, STF, TRF, TST                            |
| `comarca`                     | CharField(100)     | Localização                                    |
| `vara`                        | CharField(200)     | Vara/Turma/Câmara                              |
| `tipo_acao`                   | CharField(100)     | Área jurídica (choices)                        |
| `status`                      | CharField(20)      | ATIVO, INATIVO, SUSPENSO, ARQUIVADO, ENCERRADO |
| `auto_status`                 | Boolean            | Auto-atualizar status                          |
| `data_distribuicao`           | DateField          | Protocolo                                      |
| `data_ultima_movimentacao`    | DateField          | Auto-atualizado                                |
| `data_encerramento`           | DateField          | Fim do processo                                |
| `valor_causa`                 | DecimalField(15,2) | Valor do processo                              |
| `observacoes`                 | TextField          | Notas internas                                 |
| `tags`                        | JSONField(list)    | Categorização                                  |
| `deleted`                     | Boolean            | Soft delete                                    |

**Financeiro** (Bloco novamente adicionado):

- `participation_type` (percentage/fixed)
- `participation_percentage` (Decimal 5,2)
- `participation_fixed_value` (Decimal 15,2)
- `payment_conditional` (Boolean)
- `observations_financial_block_a` (TextField)
- `observations_financial_block_b` (TextField)

**Cliente Principal** (Atalho):

- `cliente_principal` (FK → Contact)
- `cliente_posicao` (AUTOR/REU)

**Timestamps**:

- `created_at`, `updated_at` (auto)
- `deleted_at`, `deleted_reason` (soft delete)

**Properties**:

- `numero_processo_formatted`: Formata CNJ (backend)
- `dias_sem_movimentacao`: Calcula inatividade
- `esta_ativo`: Bool baseado em dias
- `total_publicacoes`: 0 (não implementado)
- `publicacoes_recentes`: 0 (não implementado)
- `nivel_urgencia`: 'NORMAL' (TODO)

**Methods**:

- `atualizar_data_ultima_movimentacao()`: Recalcula de movimentações
- `atualizar_status_automatico()`: ATIVO/INATIVO/ARQUIVADO
- `save()`: Auto-preenche `numero_processo_unformatted`, sincroniza `cliente_principal` com `CaseParty`

#### 2. **CaseParty** (Relacionamento ManyToMany)

**Responsabilidade**: Partes do processo (advogado, cliente, testemunha, perito)

| Campo         | Tipo                                                              |
| ------------- | ----------------------------------------------------------------- |
| `case`        | FK → Case                                                         |
| `contact`     | FK → Contact                                                      |
| `role`        | CharField(20) - CLIENTE, AUTOR, REU, TESTEMUNHA, PERITO, TERCEIRO |
| `is_client`   | Boolean                                                           |
| `observacoes` | TextField                                                         |
| `created_at`  | DateTime                                                          |

**Constraints**: `unique_together` = (case, contact)

#### 3. **CaseMovement** (Movimentações Processuais)

**Responsabilidade**: Despachos, decisões, audiências, publicações

| Campo                      | Tipo                                                          |
| -------------------------- | ------------------------------------------------------------- |
| `case`                     | FK → Case                                                     |
| `data`                     | DateField                                                     |
| `tipo`                     | CharField(30) - 12 choices (DESPACHO, DECISAO, SENTENCA, etc) |
| `titulo`                   | CharField(200)                                                |
| `descricao`                | TextField                                                     |
| `prazo`                    | IntegerField (dias)                                           |
| `data_limite_prazo`        | DateField (auto-calculada)                                    |
| `origem`                   | CharField(20) - MANUAL, DJE, ESAJ, PJE                        |
| `publicacao_id`            | IntegerField (foreign reference)                              |
| `created_at`, `updated_at` | DateTime                                                      |

**Auto-cálculos**:

- `save()`: Calcula `data_limite_prazo = data + prazo`
- `save()`: Atualiza `Case.data_ultima_movimentacao`
- `delete()`: Recalcula `Case.data_ultima_movimentacao`

#### 4. **Payment** (Recebimentos)

**Responsabilidade**: Honorários recebidos

| Campo                      | Tipo               |
| -------------------------- | ------------------ |
| `case`                     | FK → Case          |
| `date`                     | DateField          |
| `description`              | CharField(255)     |
| `value`                    | DecimalField(15,2) |
| `created_at`, `updated_at` | DateTime           |

#### 5. **Expense** (Despesas)

**Responsabilidade**: Custas, perícias, etc.

| Campo                      | Tipo               |
| -------------------------- | ------------------ |
| `case`                     | FK → Case          |
| `date`                     | DateField          |
| `description`              | CharField(255)     |
| `value`                    | DecimalField(15,2) |
| `created_at`, `updated_at` | DateTime           |

---

### Serializers (`backend/apps/cases/serializers.py`)

#### 6 Serializers:

| Serializer               | Usada em               | Campos                       |
| ------------------------ | ---------------------- | ---------------------------- |
| `CaseMovementSerializer` | Detail, Relacionamento | 11 campos + 2 display        |
| `CasePartySerializer`    | Detail, Relacionamento | 11 campos + 4 contact nested |
| `PaymentSerializer`      | Detail, Relacionamento | 7 campos                     |
| `ExpenseSerializer`      | Detail, Relacionamento | 7 campos                     |
| `CaseListSerializer`     | List view              | ~30 campos (leve)            |
| `CaseDetailSerializer`   | Detail view            | ~40 campos (pesada)          |

**Funcionalidades Serializadores**:

- ✅ Validação de formato CNJ
- ✅ Validação de datas (encerramento > distribuição)
- ✅ Read-only fields bem contemplados
- ✅ Nested serializers (parties, movements)
- ✅ Display fields com `get_*_display()`

---

### ViewSets (`backend/apps/cases/views.py`)

#### 5 ViewSets:

| ViewSet               | Modelo       | Ações                                      |
| --------------------- | ------------ | ------------------------------------------ |
| `CaseViewSet`         | Case         | CRUD + `restore`, `update_status`, `stats` |
| `CasePartyViewSet`    | CaseParty    | CRUD básico                                |
| `CaseMovementViewSet` | CaseMovement | CRUD + filter by case_id                   |
| `PaymentViewSet`      | Payment      | CRUD + filter by case_id                   |
| `ExpenseViewSet`      | Expense      | CRUD + filter by case_id                   |

**Features**:

- ✅ Filtros por tribunal, status, datas
- ✅ Busca em múltiplos campos
- ✅ Ordenação flexível
- ✅ Serializers diferentes para list/detail
- ✅ Soft delete (CaseViewSet)
- ✅ Stats endpoint

---

## 💻 Estrutura Frontend

### Páginas

#### CaseDetailPage.jsx (2.388 linhas!!!)

**Conteúdo por linha**:

- Linhas 1-100: Imports, configuração
- Linhas 101-160: useEffect (título, dados iniciais)
- Linhas 161-560: Estados (67 useState! ⚠️)
- Linhas 561-700: Funções helpers (formatDate, formatCurrency, parseCurrencyValue, etc)
- Linhas 701-850: Handlers (todos com 50-100 linhas cada)
- Linhas 851-2388: JSX (4 abas gigantes)

**Estados** (67 total!!!):

```javascript
// Tab Management
activeSection, isSaving

// Form Data
formData, setCaseData

// Informações Tab
editingProcessNumber, editingField, fieldValues

// Partes Tab
novas_partes[], partes[], selectedParteContact, showLinkContactModal

// Movimentações Tab
novas_movimentacoes[], showMovementForm, movementForm

// Financeiro Tab
recebimentos[], despesas[], participacaoTipo, participacaoPercentual, etc
valorCausaInput, recebimentoForm, despesaForm

// UI
showToast, toastMessage, toastType
loadingMovements, loadingParties, etc
```

**Abas**:

1. ✅ **Informações** (titulo, tribunal, comarca, vara, datas, valor)
2. ✅ **Partes** (cliente principal, partes do processo)
3. ✅ **Movimentações** (despachos, decisões, audiências)
4. ✅ **Financeiro** (valor causa, participação, recebimentos, despesas, observações)

**Problemas Identificados**:

- ⚠️ 67 states - dificil manutenção
- ⚠️ ~20 useEffects - lógica espalhada
- ⚠️ ~15 handlers inline - cada aba poderia ter suas funções
- ⚠️ JSX aninhado profundamente (3-5 níveis)
- ⚠️ Lógica financeira misturada com UI
- ⚠️ Duplicação: formatDate, formatCurrency definidos aqui (também em CaseCard, outros)

---

### Componentes

#### CaseCard.jsx (207 linhas)

- Exibe resumo do caso (card)
- Cores dinâmicas por tribunal/status
- Urgência (dias sem movimento)
- Copiar número processo

**Duplicação**: `formatDate()` definida aqui E em CaseDetailPage

---

### Serviços (`frontend/src/services/`)

#### 7 Arquivos de Serviço:

1. **casesService.js** (223 linhas)
   - `getAll(filters)` - Lista com filtros
   - `getById(id)` - Detalhe
   - `create(data)` - Novo processo
   - `update(id, data)` - Editar
   - `delete(id, reason)` - Soft delete
   - `restore(id)` - Restaurar
   - `updateStatus(id)` - Auto-atualizar status

2. **caseMovementsService.js**
   - `getMovementsByCase(id)`
   - CRUD: create, update, patch, delete

3. **casePartiesService.js**
   - `getPartiesByCase(id)`
   - CRUD: create, update, delete
   - `linkContactToCase(caseId, contactId, role)`

4. **financialService.js** (119 linhas)
   - `getPaymentsByCase(id)`
   - CRUD: createPayment, updatePayment, deletePayment
   - `getExpensesByCase(id)`
   - CRUD: createExpense, updateExpense, deleteExpense

5. **deadlinesService.js**
   - `getPendingDeadlines()`
   - `getDeadlinesByCase(id)`

6. **api.js** - Base de configuração (importado em um serviço antigo)

7. **publicationsService.js**
   - Não vinculado diretamente ao cases

**Duplicação Crítica**: `apiFetch()` **redefinida em cada arquivo** ❌

---

### Estilos

#### CaseDetailPage.css (2.863 linhas)

**Classes por aba**:

- `.financeiro-*` (80+ classes)
- `.partes-*` (50+ classes)
- `.movimentacoes-*` (40+ classes)
- `.informacoes-*` (30+ classes)
- Shared: `.tab-content`, `.section-header`, `.detail-value`, etc.

**Problemas**:

- Muito grande num arquivo único
- Estilos de aba poderiam ser modularizados
- Potencial duplicação de reset/base styles

---

## 📡 Fluxos de Dados

### 1. Listar Casos

```
CaseListPage → casesService.getAll(filters)
    ↓
Backend: GET /api/cases/?tribunal=TJSP&status=ATIVO
    ↓
CaseViewSet.list() → CaseListSerializer (30 campos)
    ↓
Response com array de casos
    ↓
Renderiza array em CaseCard[]
```

### 2. Detalhe de Caso

```
CaseDetailPage → casesService.getById(id)
    ↓
Backend: GET /api/cases/{id}/
    ↓
CaseViewSet.retrieve() → CaseDetailSerializer (40 campos)
    ↓
setFormData(response)
    ↓
Renderiza 4 abas com dados
```

### 3. Financeiro

```
CaseDetailPage (activeSection === 'financeiro')
    ↓
useEffect[activeSection] → loadPayments() + loadExpenses()
    ↓
financialService.getPaymentsByCase(id)
financialService.getExpensesByCase(id)
    ↓
Backend: GET /api/payments/?case_id={id}
         GET /api/expenses/?case_id={id}
    ↓
setRecebimentos(payments)
setDespesas(expenses)
    ↓
Renderiza tabelas com dados
    ↓
handleAdicionarRecebimento() → financialService.createPayment()
handleRemoverRecebimento() → financialService.deletePayment()
```

### 4. Movimentações

```
CaseDetailPage (activeSection === 'movimentacoes')
    ↓
useEffect[activeSection] → loadMovements()
    ↓
caseMovementsService.getMovementsByCase(id)
    ↓
Backend: GET /api/case-movements/?case_id={id}
    ↓
setMovimentacoes(response)
    ↓
handleAdicionarMovimentacao() → caseMovementsService.createMovement()
```

### 5. Partes do Processo

```
CaseDetailPage (activeSection === 'partes')
    ↓
useEffect[activeSection] → loadParties()
    ↓
casePartiesService.getPartiesByCase(id)
    ↓
Backend: GET /api/case-parties/?case_id={id}
    ↓
setPartes(response)
    ↓
handleAdicionarParte() → casePartiesService.create()
```

---

## 🔍 Duplicações Identificadas

### 1. **apiFetch() - CRÍTICO**

**Problema**: Redefinida em múltiplos serviços

**Arquivos**:

- `casesService.js` (linhas 10-40)
- `caseMovementsService.js` (linhas 5-30)
- `casePartiesService.js` (idem)
- `financialService.js` (idem)

**Solução**: Extrair em `src/utils/api.js` ou `src/lib/fetch.js`

```javascript
// Proposta:
// src/utils/apiFetch.js
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  // ... implementação
};

// Depois usar em todos:
import { apiFetch } from "@/utils/apiFetch";
```

---

### 2. **formatDate() - MODERADO**

**Problema**: Definida em:

- `CaseDetailPage.jsx` (linha 581)
- `CaseCard.jsx` (linha 54)

**Linha de Código**:

```javascript
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("pt-BR");
};
```

**Solução**: `src/utils/formatters.js`

---

### 3. **formatCurrency() + Helpers - MODERADO**

**Problema**: Definida em:

- `CaseDetailPage.jsx` (linhas 590-615)
- Potencialmente duplicada em `financialService.js` ou handlers

**Funções**:

- `formatCurrency(value)` - Formata com "R$"
- `formatCurrencyInput(value)` - Para input pt-BR
- `parseCurrencyValue(value)` - Parseia pt-BR ou en-US

**Solução**: `src/utils/currency.js`

---

### 4. **Validações - MODERADO**

**Problema**: Validações espalhadas:

- Serializers Django (5+ validadores)
- CaseDetailPage (handlers com if/else)
- Serviços (nas funções async)

**Exemplos**:

```javascript
// Em CaseDetailPage
if (!recebimentoForm.data || !recebimentoForm.descricao || !recebimentoForm.valor) {
  showToast('Preencha todos os campos do recebimento', 'error');
  return;
}

// Deveria estar em:
// src/utils/validators.js
export const validatePaymentForm = (form) => { ... };
```

---

### 5. **Toast/Notificações - LEVE**

**Problema**: Sistema de toast implementado:

- Estado `toastMessage`, `toastType` em CaseDetailPage
- Função `showToast(msg, type)` repetida
- Toast render duplicado

**Melhor**: Context ou hook customizado `useToast`

---

### 6. **Cálculos Financeiros - MODERADO**

**Problema**: Lógica financeira em CaseDetailPage:

- `calcularParticipacao()`
- `calcularTotalRecebimentos()`
- `calcularTotalDespesas()`
- `calcularLucroBruto()`
- `calcularLucroLiquido()`

**Solução**: `src/utils/financialCalculations.js` ou hook `useFinancialCalculations()`

---

### 7. **Styles - PESADO**

**Problema**: `CaseDetailPage.css` (2.863 linhas)

**Distribuição**:

- `.financeiro-*` → `CaseDetailPage-financeiro.css`
- `.partes-*` → `CaseDetailPage-partes.css`
- `.movimentacoes-*` → `CaseDetailPage-movimentacoes.css`
- `.informacoes-*` → `CaseDetailPage-informacoes.css`
- Shared → `CaseDetailPage-shared.css`

---

### 8. **Constantes/Enums - LEVE**

**Problema**: Valores hardcoded:

- Choices de `tipo_acao` (CIVEL, CRIMINAL, TRABALHISTA, etc)
- Choices de `status` (ATIVO, INATIVO, SUSPENSO, etc)
- Choices de `role` (CLIENTE, AUTOR, REU, etc)
- Choices de `tipo` movimentação

**Solução**: `src/constants/caseConstants.js`

```javascript
export const CASE_STATUS = {
  ATIVO: "ATIVO",
  INATIVO: "INATIVO",
  SUSPENSO: "SUSPENSO",
  ARQUIVADO: "ARQUIVADO",
  ENCERRADO: "ENCERRADO",
};

// Uso:
<select value={status}>
  {Object.entries(CASE_STATUS).map(([key, value]) => (
    <option key={key} value={value}>
      {STATUS_DISPLAY[value]}
    </option>
  ))}
</select>;
```

---

## ⚠️ Pontos Críticos

### 1. **CaseDetailPage.jsx é Monolítica (2.388 linhas)**

- Mistura 4 abas completamente diferentes
- 67 estados - impossível rastrear
- ~20 useEffects - efeitos colaterais não claros
- Lógica de formatação, validação, handlers tudo junto

**Impacto**: Dificuldade manutenção, risco de bugs, refatoração perigosa

---

### 2. **Falta de CaseListPage.jsx**

- ⚠️ Arquivo não encontrado no workspace!
- Provavelmente em construção ou com nome diferente
- Precisa ser localizado/criado

---

### 3. **apiFetch Duplicada em 4+ Arquivos**

- Mudanças precisam ser replicadas
- Inconsistência de error handling
- Difícil adicionar autenticação ou interceptors

---

### 4. **Estados Financeiros Desincronizados**

- Eram locais em estado separado
- Recentemente sincronizados com formData via useEffect
- Complexidade ainda alta

---

### 5. **Falta de Testes**

- Serviços sem testes unitários
- Componentes gigantes difíceis de testar
- Lógica financeira complexa sem cobertura

---

### 6. **Sem Tratamento de Erros Robusto**

- Try/catch básico
- Sem retry lógic
- Sem validação profunda

---

## 🎨 Proposta de Modularização

### Estratégia: Dividir por Aba + Componentes Reutilizáveis

```
frontend/src/
├── pages/
│   ├── CaseDetailPage.jsx (NOVO - apenas orchestração)
│   ├── CaseListPage.jsx (LOCALIZAR/CRIAR)
│   └── caseDetail/
│       ├── CaseDetailPage.jsx ← rename de atual
│       ├── index.jsx (wrapper)
│       └── ...
│
├── components/
│   ├── CaseCard/
│   │   ├── CaseCard.jsx
│   │   └── CaseCard.css
│   │
│   ├── cases/
│   │   ├── Informacoes/
│   │   │   ├── InformacoesTab.jsx
│   │   │   ├── InformacoesForm.jsx
│   │   │   └── InformacoesTab.css
│   │   │
│   │   ├── Partes/
│   │   │   ├── PartesTab.jsx
│   │   │   ├── PartesList.jsx
│   │   │   ├── PartesForm.jsx
│   │   │   └── PartesTab.css
│   │   │
│   │   ├── Movimentacoes/
│   │   │   ├── MovimentacoesTab.jsx
│   │   │   ├── MovimentacoesList.jsx
│   │   │   ├── MovimentacoesForm.jsx
│   │   │   ├── MovimentacoesTimeline.jsx
│   │   │   └── MovimentacoesTab.css
│   │   │
│   │   └── Financeiro/
│   │       ├── FinanceiroTab.jsx
│   │       ├── ValorCausaSection.jsx
│   │       ├── ParticipacaoSection.jsx
│   │       ├── RecebimentosSection.jsx
│   │       ├── DespesasSection.jsx
│   │       ├── ResumoFinanceiroSection.jsx
│   │       ├── RecebimentosList.jsx
│   │       ├── DespesasList.jsx
│   │       └── FinanceiroTab.css
│   │
│   └── shared/
│       ├── TabNavigation.jsx
│       ├── FormSection.jsx
│       ├── ListSection.jsx
│       └── shared.css
│
├── hooks/
│   ├── useCase.js (orchestração de busca/save)
│   ├── useFinancial.js (recebimentos/despesas)
│   ├── useMovements.js (movimentações)
│   ├── useParties.js (partes)
│   ├── useToast.js (notificações)
│   └── useCaseTabs.js (gerenciamento de abas)
│
├── services/
│   ├── apiFetch.js (CENTRALIZADO)
│   ├── casesService.js (atualizado)
│   ├── caseMovementsService.js (usa apiFetch)
│   ├── casePartiesService.js (usa apiFetch)
│   └── financialService.js (usa apiFetch)
│
├── utils/
│   ├── formatters.js (formatDate, formatCurrency)
│   ├── currency.js (parseCurrencyValue, formatCurrencyInput)
│   ├── validators.js (validatePaymentForm, etc)
│   ├── financialCalculations.js (calcular participação, lucro, etc)
│   └── constants.js (enums e choices)
│
└── context/
    ├── ToastContext.js
    └── CaseContext.js (optional)
```

---

### Fase 1: Extrair Utilidades (Baixo Risco)

1. **src/utils/apiFetch.js** - Centralizar fetch wrapper
2. **src/utils/formatters.js** - formatDate
3. **src/utils/currency.js** - Currency functions
4. **src/utils/validators.js** - Validações comuns
5. **src/utils/constants.js** - Enums e choices
6. **src/hooks/useToast.js** - Toast context hook

**Tempo Estimado**: 4-6 horas

---

### Fase 2: Dividir CaseDetailPage em Abas (Médio Risco)

1. **InformacoesTab.jsx** - Aba Informações
2. **PartesTab.jsx** - Aba Partes
3. **MovimentacoesTab.jsx** - Aba Movimentações
4. **FinanceiroTab.jsx** - Aba Financeiro

Cada aba:

- Arquivo principal (lógica da aba)
- 2-3 sub-componentes (form, list, details)
- CSS próprio

**Tempo Estimado**: 12-16 horas

---

### Fase 3: Extrair Hooks Customizados (Médio Risco)

1. **useCase** - Orquestração (getById, update)
2. **useFinancial** - Recebimentos/despesas
3. **useMovements** - Movimentações
4. **useParties** - Partes
5. **useCaseTabs** - Estado de abas

**Tempo Estimado**: 6-8 horas

---

### Fase 4: Melhorias Backend (Baixo Risco)

1. Extrair `apiFetch` em utils Django (se usar)
2. Criar serializers específicos por aba
3. Adicionar endpoints agregados (summarized data)

**Tempo Estimado**: 4-6 horas

---

### Fase 5: Testes e Validação (Alto Tempo)

1. Testes unitários para:
   - Utils (formatters, currency, validators)
   - Hooks (useCase, useFinancial)
   - Serviços
2. Testes de integração para abas
3. Testes E2E para fluxos completos

**Tempo Estimado**: 16-20 horas

---

## 📊 Resumo de Benefícios

| Aspecto                    | Antes                  | Depois                    |
| -------------------------- | ---------------------- | ------------------------- |
| **Linhas por arquivo**     | 2.388 (CaseDetailPage) | ~300-400 por aba          |
| **Estados por arquivo**    | 67                     | 5-10 (bem focado)         |
| **Reusabilidade**          | Baixa                  | Alta (hooks, componentes) |
| **Duplicação**             | apiFetch em 4 arquivos | Centralizada              |
| **Manutenibilidade**       | Difícil                | Fácil                     |
| **Testabilidade**          | Muito difícil          | Fácil                     |
| **Tempo onboard novo dev** | 3-4 dias               | 1 dia                     |

---

## ✅ Próximos Passos

1. **Validar proposta com você** (discussão)
2. **Começar Fase 1** (utils) - baixo risco, alto impacto
3. **Depois Fase 2** (dividir abas) - médio risco, alto valor
4. **Iterativo**: Validar cada fase antes da próxima

---

**Documento preparado para refatoração estruturada e segura do app cases.**  
**Filosofia**: Pequenos passos, commits frequentes, testes em cada fase.

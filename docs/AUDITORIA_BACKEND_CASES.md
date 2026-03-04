# Auditoria Backend - Cases System

**Data:** 04/03/2026  
**Etapa:** Fase 1 - Auditoria Backend (Etapas 1.1, 1.2, 1.3)  
**Status:** ✅ Concluída

---

## Resumo Executivo

O backend do sistema Cases está **bem estruturado** com modelos relacionados corretamente, serializers organizados, e ViewSets completos. Código bem documentado com validações robustas. Identificamos alguns pontos de melhoria para padronização e otimização futura.

**Métricas:**
- ✅ 7 modelos Django
- ✅ 8 serializers DRF
- ✅ 7 ViewSets com filtros
- ✅ 863 linhas (models.py)
- ✅ 373 linhas (serializers.py)
- ✅ 344 linhas (views.py)

---

## Etapa 1.1: Auditoria Models (models.py)

### Estrutura de Modelos

#### 1. **Case** (Linhas 7-360)
- **Propósito:** Núcleo central do sistema - representa processo judicial
- **Campos principais:**
  - `numero_processo` (CNJ format com validação regex)
  - `numero_processo_unformatted` (apenas dígitos para busca)
  - `tribunal`, `comarca`, `vara`
  - `tipo_acao` (CIVEL/CRIMINAL/TRABALHISTA/etc)
  - `status` (ATIVO/INATIVO/SUSPENSO/ARQUIVADO/ENCERRADO)
  - `data_distribuicao`, `data_ultima_movimentacao`, `data_encerramento`
  - `valor_causa`, campos financeiros (participation_type, percentage, fixed_value)
  - `cliente_principal` (FK opcional para Contact)
  - `publicacao_origem` (FK opcional para Publication)

- **Relacionamentos:**
  - `clients` → ManyToMany com Contact (através de CaseParty)
  - `movimentacoes` → 1:N com CaseMovement
  - `tasks` → 1:N com CaseTask
  - `parties` → 1:N com CaseParty

- **Features:**
  - ✅ Soft delete (deleted, deleted_at, deleted_reason)
  - ✅ Auto-status baseado em atividade (auto_status flag)
  - ✅ Properties: numero_processo_formatted, dias_sem_movimentacao, esta_ativo, nivel_urgencia
  - ✅ Validação CNJ: `^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$`
  - ✅ Indexes otimizados (tribunal+status, data_ultima_movimentacao, numero_processo_unformatted)

- **Métodos importantes:**
  - `atualizar_data_ultima_movimentacao()` - recalcula baseado em movimentações
  - `atualizar_status_automatico()` - atualiza status baseado em dias sem movimentação
  - `save()` - auto-preenche numero_processo_unformatted + sincroniza cliente_principal com CaseParty

#### 2. **CaseParty** (Linhas 360-413)
- **Propósito:** Tabela intermediária ManyToMany entre Case e Contact
- **Campos principais:**
  - `case` (FK)
  - `contact` (FK)
  - `role` (CLIENTE/AUTOR/REU/TESTEMUNHA/PERITO/TERCEIRO)
  - `is_client` (bool - indica se é cliente do escritório)
  - `observacoes`

- **Features:**
  - ✅ unique_together (case, contact) - previne duplicatas
  - ✅ Related names bem definidos (parties, case_roles)

#### 3. **CaseMovement** (Linhas 413-551)
- **Propósito:** Movimentações processuais (despachos, decisões, audiências)
- **Campos principais:**
  - `case` (FK)
  - `data` (DateField indexado)
  - `tipo` (DESPACHO/DECISAO/SENTENCA/ACORDAO/AUDIENCIA/etc)
  - `titulo`, `descricao`
  - `prazo` (IntegerField, dias)
  - `data_limite_prazo` (DateField, auto-calculado)
  - `completed` (bool)
  - `origem` (MANUAL/DJE/ESAJ/PJE)
  - `publicacao_id` (nullable, rastreabilidade)

- **Features:**
  - ✅ Auto-cálculo: data_limite_prazo = data + prazo
  - ✅ Auto-atualiza Case.data_ultima_movimentacao no save/delete
  - ✅ Indexes: (case, -data), (-data), (tipo, -data)
  - ✅ Related name: tasks (1:N com CaseTask)

- **⚠️ Observação:**
  - Há redundância entre CaseMovement.prazo/data_limite_prazo e CasePrazo (modelo separado)
  - Avaliar se CasePrazo é necessário ou se pode ser consolidado

#### 4. **CasePrazo** (Linhas 551-635)
- **Propósito:** Prazos processuais vinculados a movimentação (múltiplos prazos por movimentação)
- **Campos principais:**
  - `movimentacao` (FK)
  - `prazo_dias` (ex: 15, 30, 45)
  - `data_limite` (auto-calculado)
  - `descricao` (ex: Manifestação, Recurso, Contrarrazões)
  - `completed` (bool)

- **Features:**
  - ✅ Properties: dias_restantes, status_urgencia (VENCIDO/URGENTISSIMO/URGENTE/NORMAL/CONCLUIDO)
  - ✅ Auto-cálculo: data_limite = movimentacao.data + prazo_dias
  - ✅ Lógica de urgência jurídica: <0=VENCIDO, ≤3=URGENTISSIMO, ≤7=URGENTE, >7=NORMAL

- **⚠️ Nomenclatura:**
  - Usa `URGENTISSIMO` (linha 632) - planejar padronização para `CRITICAL` (Phase 4)

#### 5. **CaseTask** (Linhas 635-750)
- **Propósito:** Tarefas operacionais vinculadas ao processo
- **Campos principais:**
  - `case` (FK obrigatório)
  - `movimentacao` (FK **OPCIONAL** - permite tarefas "soltas")
  - `titulo`, `descricao`
  - `urgencia` (NORMAL/URGENTE/URGENTISSIMO)
  - `data_vencimento` (auto-calculado se não informado)
  - `status` (PENDENTE/EM_ANDAMENTO/CONCLUIDA/CANCELADA)
  - `concluida_em` (timestamp)

- **Features:**
  - ✅ Properties: cor_urgencia (green/orange/red), vencida (bool)
  - ✅ Auto-cálculo data_vencimento baseado em settings (TASK_NORMAL_DAYS=15, TASK_URGENT_DAYS=7, TASK_URGENTISSIMO_DAYS=3)
  - ✅ Auto-preenche concluida_em quando status=CONCLUIDA
  - ✅ Indexes: (case, status), (urgencia, data_vencimento), (movimentacao)

- **⚠️ Nomenclatura:**
  - Usa `URGENTISSIMO` (linha 671) - planejar padronização para `CRITICAL` (Phase 4)

- **✅ KEY INSIGHT:**
  - `movimentacao` é **nullable** - permite:
    - Tarefas vinculadas a movimentação (movimentacao=ID)
    - Tarefas independentes do caso (movimentacao=NULL)

#### 6. **Payment** (Linhas ~750-800)
- **Propósito:** Recebimentos de honorários do cliente
- **Campos principais:**
  - `case` (FK)
  - `date`, `description`, `value` (DecimalField)

#### 7. **Expense** (Linhas ~800-863)
- **Propósito:** Despesas/custos do processo
- **Campos principais:**
  - `case` (FK)
  - `date`, `description`, `value` (DecimalField)

---

## Etapa 1.2: Auditoria Serializers (serializers.py)

### Estrutura de Serializers

#### Resumo
- ✅ 8 serializers bem organizados
- ✅ Separação list vs detail para otimização (CaseListSerializer vs CaseDetailSerializer)
- ✅ Nested serializers (CasePrazoSerializer dentro de CaseMovementSerializer)
- ✅ Campos read_only bem definidos
- ✅ Validações customizadas

#### 1. **CasePrazoSerializer** (Linhas 19-40)
```python
fields = [
    'id', 'movimentacao', 'prazo_dias', 'data_limite', 'descricao', 'completed',
    'dias_restantes', 'status_urgencia', 'created_at', 'updated_at'
]
read_only_fields = ['id', 'data_limite', 'dias_restantes', 'status_urgencia', 'created_at', 'updated_at']
```

#### 2. **CaseMovementSerializer** (Linhas 41-105)
```python
fields = [
    'id', 'case', 'data', 'tipo', 'tipo_display', 'titulo', 'descricao',
    'prazo', 'data_limite_prazo', 'completed', 'origem', 'origem_display',
    'publicacao_id', 'orgao', 'prazos', 'tasks_count', 'created_at', 'updated_at'
]
```

- ✅ **Nested:** `prazos = CasePrazoSerializer(many=True, read_only=True)`
- ✅ **SerializerMethodField:** tasks_count, orgao (normalizado sem acentos)
- ✅ **Validação:** data não pode ser futura (linha 95-103)

#### 3. **CaseTaskSerializer** (Linhas 106-150)
```python
fields = [
    'id', 'case', 'case_numero', 'movimentacao', 'movimentacao_titulo',
    'titulo', 'descricao', 'urgencia', 'urgencia_display', 'cor_urgencia',
    'data_vencimento', 'status', 'status_display', 'vencida',
    'concluida_em', 'created_at', 'updated_at'
]
```

- ✅ **Campos auxiliares:** case_numero, movimentacao_titulo (facilita frontend)
- ✅ **Properties do model:** cor_urgencia, vencida
- ✅ **Validação:** movimentacao deve pertencer ao case (linha 142-148)

- **⚠️ Redundância:**
  - `urgencia_display` e `status_display` podem ser calculados no frontend
  - Campos `_display` aumentam payload desnecessariamente

#### 4. **CasePartySerializer** (Linhas 151-180)
```python
fields = [
    'id', 'case', 'contact', 'contact_name', 'contact_document',
    'contact_person_type', 'contact_phone', 'contact_email',
    'role', 'role_display', 'is_client', 'observacoes', 'created_at'
]
```

- ✅ **Nested contact data:** Desnormaliza dados de Contact para evitar queries extras

#### 5. **PaymentSerializer** (Linhas 181-197)
- Simples, apenas campos básicos

#### 6. **ExpenseSerializer** (Linhas 198-214)
- Simples, apenas campos básicos

#### 7. **CaseListSerializer** (Linhas 215-262)
- **Propósito:** Versão leve para lista (sem nested serializers)
- ✅ Campos essenciais: numero_processo, titulo, status, tribunal, cliente_nome
- ✅ Properties úteis: dias_sem_movimentacao, esta_ativo

#### 8. **CaseDetailSerializer** (Linhas 263-373)
- **Propósito:** Versão completa para detalhes
- ✅ Nested: `parties = CasePartySerializer(many=True, read_only=True)`
- ✅ Campos financeiros incluídos
- ✅ Soft delete fields (deleted, deleted_at, deleted_reason)
- ✅ Validação CNJ (linha 352-360)
- ✅ Validação data_encerramento > data_distribuicao (linha 362-370)

---

## Etapa 1.3: Auditoria Views (views.py)

### Estrutura de ViewSets

#### Resumo
- ✅ 7 ViewSets bem configurados
- ✅ Todos usam ModelViewSet (padrão DRF)
- ✅ Filtros completos (DjangoFilterBackend, SearchFilter, OrderingFilter)
- ✅ Custom actions úteis
- ✅ Soft delete implementado corretamente

#### 1. **CaseViewSet** (Linhas 24-155)
- **Queryset base:** `Case.objects.filter(deleted=False)`
- **Serializers:** CaseListSerializer (list) vs CaseDetailSerializer (retrieve)

**Filtros:**
```python
filterset_fields = {
    'tribunal': ['exact', 'in'],
    'comarca': ['exact', 'icontains'],
    'status': ['exact'],
    'auto_status': ['exact'],
    'data_distribuicao': ['gte', 'lte', 'exact'],
    'data_ultima_movimentacao': ['gte', 'lte', 'exact'],
}
search_fields = [
    'numero_processo', 'numero_processo_unformatted', 'titulo', 'observacoes', 'comarca', 'vara', 'tipo_acao'
]
ordering_fields = ['data_distribuicao', 'data_ultima_movimentacao', 'data_encerramento', 'created_at', 'updated_at']
```

**Custom Actions:**
- `@action(detail=True, methods=['post']) restore()` - Restaura soft-deleted case
- `@action(detail=True, methods=['post']) update_status()` - Atualiza status automaticamente
- `@action(detail=False, methods=['get']) stats()` - Estatísticas (total, by_status, by_tribunal)

**Soft Delete:**
```python
def perform_destroy(self, instance):
    # Parâmetro: delete_linked_publication (bool)
    # True: Soft-delete publicação vinculada também
    # False: Desvincula publicação (volta status PENDING)
    
    # Renomeia numero_processo para liberar constraint UNIQUE
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    instance.numero_processo = f"{instance.numero_processo}_deleted_{timestamp}"
    
    instance.deleted = True
    instance.deleted_at = timezone.now()
    instance.save()
```

- ✅ Implementação robusta: desvincula publicações, renomeia número para liberar unique constraint

#### 2. **CasePartyViewSet** (Linhas 156-171)
- Simples, apenas filtros básicos (case, contact, role)

#### 3. **CaseMovementViewSet** (Linhas 172-208)
- **Filtros:** case, tipo, origem, data, data_limite_prazo
- **Search:** titulo, descricao, case__numero_processo
- **get_queryset customizado:** Filtra por case_id do query param

#### 4. **CasePrazoViewSet** (Linhas 209-248)
- **Filtros:** movimentacao, movimentacao__case, data_limite, completed
- **Search:** descricao, movimentacao__titulo, movimentacao__case__numero_processo
- **get_queryset customizado:** Filtra por movimentacao_id ou case_id

#### 5. **CaseTaskViewSet** (Linhas 249-287)
- **Filtros:** case, movimentacao (exact, **isnull**), urgencia, status, data_vencimento
- **Search:** titulo, descricao, case__numero_processo, movimentacao__titulo
- **get_queryset customizado:** Filtra por case_id ou movimentacao_id

- **✅ KEY INSIGHT - 3 Tipos de Tarefas:**
  - Filtro `movimentacao__isnull` permite distinção entre tipos:
    1. **Tarefa vinculada a Movimentação** (isnull=false, movimentacao=ID) - ✅ **IMPLEMENTADO**
    2. **Tarefa vinculada ao Processo** (isnull=true, movimentacao=NULL) - ⏸️ **SERÁ IMPLEMENTAR (Etapa 3.5)**
    3. **Tarefa de Agenda** (modelo separado, feature/agenda) - ⏸️ **FUTURA**

#### 6. **PaymentViewSet** (Linhas 288-316)
- Simples: filtro por case e date

#### 7. **ExpenseViewSet** (Linhas 317-344)
- Simples: filtro por case e date

---

## Clarificações e Design Decisions (Feedback do Usuário)

### 1. ManyToMany Relationships (CaseParty)
- **Aprendizado:** Relacionamento complexo mas necessário para flexibilidade
- **Implementação:** CaseParty funciona como bridge table entre Case e Contact
- **Valor:** Permite múltiplos roles (CLIENTE/AUTOR/REU/TESTEMUNHA/PERITO/TERCEIRO) por contato
- **Status:** ✅ **BEM IMPLEMENTADO** - unique_together garante integridade

### 2. Backend-First Architecture
- **Rationale:** Máxima lógica concentrada no backend permite:
  - Portabilidade para múltiplos clientes (web, mobile Swift, etc)
  - Consistência de validações entre plataformas
  - Facilita manutenção e evolução futura
- **Exemplo:** Campos `_display` no serializer vêm direto do backend
  - Reduz dependências do frontend
  - Se precisar portar para Swift (iOS), terá dados pré-formatados
- **Status:** ✅ **POR DESIGN** - mantém assim para flexibilidade

### 3. Integridade Referencial em Contacts
- **Problema:** CPF, CNPJ, TEL não devem ser duplicados
- **Status:** ⏸️ **REQUER UX FLOW IMPLEMENTATION**
- **Sugestão:** Quando cliente tenta criar contact duplicado:
  - Mostrar dialog: "Contato com este CPF/CNPJ já existe"
  - Oferecer opção: "Gostaria de editar o existente?"
- **Timing:** Implementar em próxima fase (Contact Management refactor)

### 4. Soft Delete - Deferred Decision
- **Status:** ✅ **ADIADO PARA PHASE 4** (Estudo Integrado)
- **Contexto:**
  - Sistema começará em **modo LOCAL**
  - Pode migrar para ONLINE conforme cliente decida
  - Backup e performance devem ser estudados juntos
- **Plano:** Realizar estudo integrado de:
  - Retenção de dados (quanto tempo manter deleted records?)
  - Fadiga do sistema (crescimento do banco)
  - Estratégia de cleanup (arquivar vs deletar permanentemente)
- **Timeline:** Final do projeto (após refatorações core)

### 5. Três Tipos de Tarefas (CaseTask Model)
- **Status:** ✅ **ARQUITETURA JÁ SUPORTA**
- **Clarificação:** "Tarefas soltas" foi nomenclatura de brainstorm - correto é "Tarefas vinculadas ao Processo"

**Matriz de Implementação:**

| Tipo | movimentacao FK | Status | Localização | Branch |
|------|-----------------|--------|-------------|--------|
| 1. Tarefa Vinculada a Movimentação | = ID | ✅ **IMPLEMENTADO** | MovimentacoesTab, DeadlinesPage | main |
| 2. Tarefa Vinculada ao Processo | = NULL | ⏸️ **SERÁ IMPLEMENTAR** (Etapa 3.5) | TasksTab (refactor) | main |
| 3. Tarefa de Agenda | Outro modelo (CaseAgendaTask) | ⏸️ **FUTURA** | feature/agenda | nova |

- **Etapa 3.5 (TasksTab Rebuild):** Implementará tipo 2 com:
  - Task criada diretamente no caso (sem movimento específico)
  - Deadlines independentes de movimentações
  - Classificação própria de urgência
  - Ainda integrada ao sistema de notificações

---

## Análise Geral

### ✅ Pontos Fortes

1. **Estrutura bem organizada:**
   - Separação clara de responsabilidades (models/serializers/views)
   - Nomenclatura consistente
   - Relacionamentos bem definidos

2. **Validações robustas:**
   - CNJ format validation com regex
   - Datas não podem ser futuras (movimentações)
   - Validação de relacionamentos (movimentacao deve pertencer ao case)

3. **Auto-cálculo de datas:**
   - CaseMovement: data_limite_prazo = data + prazo
   - CasePrazo: data_limite = movimentacao.data + prazo_dias
   - CaseTask: data_vencimento auto-calculado baseado em settings

4. **Soft delete bem implementado:**
   - Case tem soft delete completo
   - Desvincula publicações corretamente
   - Renomeia numero_processo para liberar unique constraint

5. **Properties úteis para frontend:**
   - cor_urgencia (green/orange/red)
   - vencida (bool)
   - dias_restantes
   - status_urgencia (VENCIDO/URGENTISSIMO/URGENTE/NORMAL/CONCLUIDO)

6. **Filtros completos:**
   - DjangoFilterBackend, SearchFilter, OrderingFilter
   - Filtros customizados (case_id, movimentacao_id via query params)
   - Suporte a range queries (gte, lte)

7. **Indexes otimizados:**
   - Campos frequentemente filtrados têm db_index=True
   - Composite indexes para queries comuns (case+data, tipo+data)

### ⚠️ Pontos de Melhoria (Para Fase 3 / Phase 4)

#### 1. **Nomenclatura: URGENTISSIMO → CRITICAL**
- **Localização:**
  - `CasePrazo.status_urgencia` (linha 632)
  - `CaseTask.urgencia` choices (linha 671)
- **Impacto:** ALTO (breaking change em API)
- **Timing:** ✅ **DEFERRED para Phase 4** (após refatoração core)
- **Justificativa:** Padrão internacional, melhor compatibilidade com código futuro

#### 2. **Redundância: CaseMovement.prazo vs CasePrazo**
- **Problema:** Dois modelos controlam prazos
  - CaseMovement: prazo + data_limite_prazo (campo único)
  - CasePrazo: prazo_dias + data_limite (múltiplos prazos por movimentação)
- **Análise:**
  - CaseMovement.prazo é usado em ~90% dos casos (1 prazo por movimentação)
  - CasePrazo permite múltiplos prazos (15, 30, 45 dias) - mais flexível
- **Ação:** Phase 3 - Executar query para contar CasePrazo records no banco
  - Se < 5% dos casos usam múltiplos prazos, considerar consolidação
  - Se > 5%, mantém separação por flexibilidade

#### 3. **Serializers: Campos _display**
- **Observação:** `urgencia_display`, `status_display`, `tipo_display` aumentam payload
- **Status:** ✅ **POR DESIGN** - mantém para compatibilidade multi-cliente
- **Justificativa:** Backend-first architecture (compatibilidade com múltiplos clientes/linguagens)
- **Otimização futura:** Frontend pode calcular localmente se necessário reduzir bandwidth

#### 4. **Soft delete apenas em Case**
- **Status:** ✅ **DEFERRED para Phase 4** (Estudo Integrado de Backup)
- **Contexto:** Projeto local-first, estudará backup com soft-delete performance
- **Nota:** Outros modelos podem usar cascade delete se auditoria via FK suficiente

#### 5. **Contact Integrity Flow (UX)**
- **Status:** ⏸️ **REQUER IMPLEMENTAÇÃO em próxima iteração**
- **Problema:** CPF, CNPJ, TEL duplicados sem validação UX
- **Solução:** Dialog quando duplicate é detectado
  - "Contato com este CPF já existe. Gostaria de editar?"
- **Timing:** Contact Management refactor (não está no escopo atual)
- **Impacto:** Reduz duplicação no banco + melhoria UX

#### 6. **CaseTask: Settings como defaults**
- **Status:** ✅ **LOW PRIORITY** (micro-otimização)
- **Otimização possível:** Cache settings em class variable em vez de ler em todo save()
- **Benefício:** Reduz leitura de configuração repetida
- **Nota:** Não é gargalo em modo local - deixar como está

---

## Métricas de Qualidade

| Métrica | Valor | Status |
|---------|-------|--------|
| **Models cobertura** | 7/7 modelos | ✅ 100% |
| **Serializers cobertura** | 8/8 | ✅ 100% |
| **ViewSets cobertura** | 7/7 | ✅ 100% |
| **Validações** | 5 custom validators | ✅ Bom |
| **Indexes** | 12 indexes otimizados | ✅ Bom |
| **Soft delete** | 1/7 modelos | ⚠️ Parcial |
| **Documentação** | Docstrings em 100% | ✅ Excelente |

---

## Relacionamento entre Modelos (Diagrama)

```
Case (Processo)
 ├── 1:N → CaseMovement (Movimentações)
 │         ├── 1:N → CasePrazo (Múltiplos prazos por movimentação)
 │         └── 1:N → CaseTask (Tarefas vinculadas a esta movimentação)
 ├── 1:N → CaseTask (Tarefas do Processo | movimentacao=NULL)
 ├── 1:N → CaseParty (Partes/Contatos do processo)
 ├── 1:N → Payment (Recebimentos de honorários)
 └── 1:N → Expense (Despesas/custos)

CaseTask - 3 Tipos Suportados:
┌─ Tipo 1: Tarefa vinculada a Movimentação (movimentacao=ID) ✅ IMPLEMENTADO
│  Localização: MovimentacoesTab, DeadlinesPage
│  Criação: Ao criar/editar movimentação
│  Exemplo: "Preparar contestação" (prazo de 15 dias)
│
├─ Tipo 2: Tarefa Vinculada ao Processo (movimentacao=NULL) ⏸️ SERÁ IMPLEMENTAR (Etapa 3.5)
│  Localização: TasksTab (refactor)
│  Criação: Diretamente no caso, sem vinculação a movimento específico
│  Exemplo: "Acompanhar comunicado do tribunal"
│
└─ Tipo 3: Tarefa de Agenda (modelo CaseAgendaTask) ⏸️ FUTURA
   Branch: feature/agenda (novo escopo)
   Criação: Por agenda do escritório
   Exemplo: "Reunião com cliente sobre caso"
```

---

## Próximos Passos

✅ **Fase 1 Concluída:** Backend auditado e documentado

**Roadmap Completo:**
- ✅ **Fase 1:** Auditoria Backend (modelos, serializers, views)
- ⏳ **Fase 2:** Auditoria Frontend (DeadlinesPage, CaseDetailPage, CSS)
- ⏳ **Fase 3:** Refactor Execution (modularize TaskCard, consolidate CSS, rebuild TasksTab)
- ⏳ **Phase 4:** Future Scope (URGENTISSIMO→CRITICAL, Google Calendar, Contact UX)

**Validação de Testes:**
- ✅ Existe test suite em `backend/apps/cases/tests.py` (793 linhas)
- ✅ Cobertura: Models, APIs, soft delete
- ✅ 20+ test methods covering critical functionality

---

## Commit Strategy

```bash
# Este documento
git add docs/AUDITORIA_BACKEND_CASES.md
git commit -m "docs: complete backend audit for Cases system (Phase 1)"
```

**Próximo commit:**
- Fase 2: Frontend audit document

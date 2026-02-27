# Análise: Arquitetura de Persistência de Publicações

**Data:** 27/02/2026  
**Objetivo:** Mapear fluxo completo: API DJE → Banco de Dados → Interface

---

## 1. ESTRUTURA DE DADOS (Models Django)

### 1.1. Publication (Publicação Individual)

Representa **uma publicação do DJE** (ex: uma Intimação, Despacho, Sentença)

```python
# backend/apps/publications/models.py
class Publication(models.Model):
    id_api              # Identificador único da API DJE
    numero_processo     # CNJ do processo (ex: 1003306-63.2024.8.26.0019)
    tribunal            # Tribunal (ex: TJSP, TRF3, TRT2)
    tipo_comunicacao    # Tipo: Intimação, Citação, Despacho, Sentença, Edital
    data_disponibilizacao  # Data de publicação no DJE
    orgao               # Órgão responsável (vara, junta, etc)
    texto_resumo       # Primeiros 500 caracteres
    texto_completo     # Texto integral
    link_oficial        # Link para site do tribunal
    search_metadata     # JSON com contexto da busca
    created_at / updated_at  # Timestamps
    deleted / deleted_at / deleted_reason  # Soft delete
```

**Armazenamento:** SQLite (banco.db)  
**Índices:** tribunal, numero_processo, data_disponibilizacao, created_at  
**Relacionamentos:** Atualmente SEM relacionamento com Case (decisão pendente)

---

### 1.2. SearchHistory (Histórico de Buscas)

Representa **uma busca realizada** (ex: "Buscar últimos 7 dias em TJSP, TRF3, TRT2")

```python
# backend/apps/publications/models.py
class SearchHistory(models.Model):
    data_inicio         # Data inicial da busca (ex: 2026-02-01)
    data_fim            # Data final da busca (ex: 2026-02-07)
    tribunais           # LIST de tribunais (JSON) ex: ["TJSP", "TRF3", "TRT2"]
    total_publicacoes   # Quantas publicações encontrou
    total_novas         # Quantas eram novas no banco (não duplicadas)
    search_params       # JSON com parâmetros (OAB, nome advogado, etc)
    executed_at         # Quando foi executada
    duration_seconds    # Quanto tempo levou
```

**Armazenamento:** SQLite  
**Relacionamento:** 1 SearchHistory pode ter N Publications (via search_metadata.search_id)  
**Ordenação:** Por data (-executed_at) → mais recentes primeiro

---

## 2. FLUXO: BUSCA ONLINE → PERSISTÊNCIA

### 2.1. Pesquisa Online (API DJE)

```
┌─────────────────────────────────────────┐
│ Frontend (usuária clica "Buscar")       │
│ - Período: 01/02 a 07/02               │
│ - Tribunais: TJSP, TRF3, TRT2           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Backend API: POST /publications/search  │
│ - Valida parâmetros                    │
│ - Cria SearchHistory record            │
│ - Consulta API DJE externa             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Backend: Persiste Resultados            │
│ - Cria/atualiza Publication records    │
│ - Atualiza SearchHistory with results  │
│ - Detecta duplicatas (soft delete)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ SQLite Database                         │
│ - Publication (id_api, numero_processo) │
│ - SearchHistory (data, tribunais)       │
└─────────────────────────────────────────┘
```

---

## 3. INTERFACE: COMO OS DADOS APARECEM

### 3.1. PublicationCard.jsx (Componente Visual)

**Onde aparece:** SearchHistoryPage, PublicacoesTab, qualquer lugar que mostre publicações

**Estrutura do Card:**

```
┌────────────────────────────────────────┐
│  BADGES:  [Intimação] [TJSP]          │  ← Cores vêm de aqui
├────────────────────────────────────────┤
│  📅 10/02/2026                         │  ← data_disponibilizacao
│  📄 1003306-63.2024.8.26.0019         │  ← numero_processo (com copy)
│  ⚖️  Vara de Família - São Paulo       │  ← orgao
├────────────────────────────────────────┤
│  Resumo: "DESPACHO - Intimação para... │  ← texto_resumo
│  [truncado após 200 chars]"            │
├────────────────────────────────────────┤
│  [Ver detalhes] [🔍 Consultar TJSP]   │  ← link_oficial
└────────────────────────────────────────┘
```

**Cores por Tipo de Comunicação:**

```javascript
// frontend/src/components/PublicationCard.jsx
getTipoBadgeColor(tipo) {
  'Intimação'  → red
  'Citação'    → green
  'Edital'     → orange
  'Sentença'   → purple
  default      → gray
}
```

**Badge do Tribunal:**

```javascript
getTribunalBadgeClass(tribunal) {
  'TJSP' → badge-tribunal-tjsp  (blue #1976d2)
  'TRF3' → badge-tribunal-trf3  (green #00796b)
  'TRT2' → badge-tribunal-trt2  (green #00796b)
  etc...
}
```

---

### 3.2. SearchHistoryPage (Histórico Completo)

**Fluxo:**

1. Usuária navega para `/publicacoes/historico`
2. Frontend chama `publicationsService.getSearchHistory()`
3. Backend retorna lista de SearchHistory records
4. **Cada busca exibida como um CARD AMARELO:**

```
┌─ ÚLTIMA BUSCA (Card Amarelo) ──────────┐
│ 📅 18/02/2026 às 10:45                │
│ 📊 10 publicações encontradas        │
│ 🆕 8 novas publicações              │
│ 🏛️  Tribunais: TJSP, TRF3, TRT2      │
│ ⏱️  Duração: 4.52 segundos           │
│ [Ver detalhes] [Recuperar] [Comparar]│
└────────────────────────────────────────┘
```

**Ao clicar em um histórico:**

- Frontend chama `publicationsService.getSearchHistoryDetail(searchId)`
- Backend retorna SearchHistory + todas as Publications daquela busca
- Mostra lista de PublicationCards com as publicações encontradas

---

## 4. CAMADAS DE CÓDIGO

### 4.1. Frontend Service (publicationsService.js)

```javascript
// frontend/src/services/publicationsService.js

class PublicationsService {
  // Busca online (integra com API DJE)
  async search({ dataInicio, dataFim, tribunais, retroactiveDays }) {
    return await apiFetch('/publications/search?...')
  }

  // Carrega histórico com paginação
  async getSearchHistory({ limit = 20, offset = 0, ordering = '-executed_at' }) {
    return await apiFetch('/publications/history?...')
  }

  // Detalhes de uma busca específica
  async getSearchHistoryDetail(searchId) {
    return await apiFetch('/publications/history/{searchId}')
  }

  // Formata data BR
  formatDateBR(dateString) { ... }
}
```

**Responsabilidade:** Centralizar todas as chamadas à API

---

### 4.2. Frontend Hook (useSearchHistory.js)

```javascript
// frontend/src/hooks/useSearchHistory.js

export function useSearchHistory() {
  const [searches, setSearches] = useState([])
  const [selectedSearch, setSelectedSearch] = useState(null)
  const [selectedPublications, setSelectedPublications] = useState([])

  // Carrega lista de buscas
  const loadHistory = async (offset = 0) => { ... }

  // Carrega detalhes de uma busca
  const loadSearchDetail = async (searchId) => { ... }

  // Navegação e filtros
  const nextPage = () => { ... }
  const previousPage = () => { ... }
  const changeOrdering = (newOrdering) => { ... }
}
```

**Responsabilidade:** Gerenciar estado + lógica de negócio

---

### 4.3. Frontend Components

#### PublicationCard.jsx

- Exibe UM card de publicação
- Recebe dados da Publication (tribunal, tipo, data, resumo)
- Renderiza badges coloridas, buttons de ação

#### SearchHistoryPage.jsx

- Exibe lista de históricos (SearchHistory records)
- Cada item é um card amarelo clicável
- Usa `useSearchHistory()` para estado

#### PublicacoesTab.jsx (NOVA - que criamos)

- **Foco:** Publicações vinculadas a um CASO específico
- Ainda não conectada ao fluxo de histórico
- Precisa decidir: onde buscar as publicações do caso?

---

## 5. DECISÃO: INTEGRAÇÃO COM CASO

### 5.1. Problema Atual

**Publication model:** Não tem FK para Case

```python
class Publication(models.Model):
    # ... campos ...
    # ❌ NÃO TEM: case = ForeignKey(Case)
```

**PublicacoesTab quer exibir:** "Publicações vinculadas a este Caso"

### 5.2. Opções de Solução

#### OPÇÃO A: FK Direto na Publication

```python
# Adicionar a Publication:
case = models.ForeignKey(
    'cases.Case',
    on_delete=models.CASCADE,
    null=True,
    blank=True,
    related_name='publicacoes'
)

# Query rápida:
publicacoes = case.publicacoes.all()  # O(1) lookup
```

**Vantagens:**

- ✅ Simples e direto
- ✅ FK garante integridade referencial
- ✅ Query rápida por índice
- ✅ Atende 80% dos casos

**Desvantagens:**

- ❌ Uma publicação = Um caso
- ❌ Se mesma publicação em N casos = duplicação

#### OPÇÃO B: Tabela Intermediária (Many-to-Many)

```python
class CasePublication(models.Model):
    case = ForeignKey('cases.Case')
    publication = ForeignKey('Publication')
    linked_at = DateTimeField(auto_now_add=True)
    reason = CharField()  # "Automaticamente encontrada", "Vinculada manualmente"

# Query:
publicacoes = case.casePublication_set.all()
```

**Vantagens:**

- ✅ Uma publicação pode estar em N casos
- ✅ Metadados sobre o vínculo (linked_at, reason)
- ✅ Mais flexível para futuro

**Desvantagens:**

- ❌ Mais complexo
- ❌ Query com JOIN (ligeiramente mais lenta)

---

## 6. FLUXO RECOMENDADO: OPÇÃO A + OPÇÃO B Híbrida

### Proposta: FK simples + Link manual

**Abordagem:**

1. Adicionar `case` FK opcional a Publication
2. Quando busca encontra publicação com numero_processo = case.numero_processo → tenta vincular
3. Advogado pode **desvincular** se necessário
4. Advogado pode **vincular manualmente** se busca não encontrou

**Schema final:**

```python
class Publication(models.Model):
    # ... campos existentes ...
    case = ForeignKey(  # ← NOVO
        'cases.Case',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='publicacoes'
    )
```

---

## 7. ARQUITETURA DE INTEGRAÇÃO (PUBLICACOESTAB)

### 7.1. Fluxo Proposto

```
PublicacoesTab (aba de caso)
│
├─ Estado local:
│  ├ publicacoes[] (Publications vinculadas a este case)
│  ├ loading (boolean)
│  └ filtro (todas / intimações / despachos / outras)
│
├─ APIs necessárias:
│  ├ GET /api/cases/{caseId}/publicacoes/
│  ├ POST /api/cases/{caseId}/publicacoes/vincular/
│  └ DELETE /api/cases/{caseId}/publicacoes/{pubId}/desvincular/
│
├─ Handlers:
│  ├ onVincularPublicacao() → Modal para buscar/selecionar
│  ├ onDesvincularPublicacao() → Confirmação + DELETE
│  └ onRefresh() → GET com loading state
│
└─ Integração com SearchHistory:
   └ "Nova busca encontrou publicações para este caso" → auto-vincular
```

### 7.2. Modal: Vincular Publicação

```
┌─ Vincular Publicação ao Caso ──────────┐
│                                        │
│ Buscar publicação:                    │
│ [1003306-63.2024.8.26.0019] [Buscar] │
│                                        │
│ Últimas publicações não vinculadas:   │
│ ├─ 15/02 - TJSP - Intimação          │
│ ├─ 14/02 - TRF3 - Despacho           │
│ └─ 13/02 - TJSP - Sentença           │
│                                        │
│ [Vincular] [Cancelar]                 │
└────────────────────────────────────────┘
```

---

## 8. RESUMO: O QUE TEMOS, O QUE FALTA

### ✅ PRONTO

- Publication model (campos + soft delete)
- SearchHistory model (histórico de buscas)
- publicationsService.js (APIs)
- useSearchHistory.js (estado + lógica)
- PublicationCard.jsx (renderização)
- PublicacoesTab.jsx (estrutura + CSS)

### ⏳ PENDENTE

- Backend endpoint: vincular publication ao case
- Backend endpoint: listar publicações de um case
- Backend: auto-vincular quando busca encontra numero_processo
- Frontend: Modal para vincular publicação
- Frontend: Integração de handlers em PublicacoesTab
- Frontend: Carregar publicações no useEffect

### 🤔 DECISÃO NECESSÁRIA

1. **Usar OPÇÃO A (FK simples)?** → Recomendado para MVP
2. **Autovincular quando busca encontra?** → Sim/Não?
3. **Permitir desvincular?** → Sim, com confirmação
4. **Ordenação default?** → DESC (mais recentes primeiro)

---

## 9. EXEMPLO: COMO INTEGRAR PUBLICAÇÕES EM UM CASO

### User Journey

```
1️⃣ Advogada abre Caso #4
   └─ Clica aba "Publicações"
      └─ Vazio (primeira vez)

2️⃣ Clica "Vincular Publicação"
   └─ Modal abre
      └─ Avaliador vê: "Não há publicações não vinculadas"

3️⃣ Advogada faz busca DJE (SearchHistoryPage)
   └─ Busca encontra 10 publicações para case #4
      └─ Backend auto-vincula as 8 com numero_processo matchante

4️⃣ Volta ao Caso #4
   └─ Aba Publicações mostra 8 publicações encontradas
      └─ Cards coloridas (Intimação=Red, Despacho=Blue, etc)

5️⃣ Clica em uma publicação
   └─ Abre PublicationdetailModal
      └─ Texto completo, links, opção de desvincular

6️⃣ Clica "Desvincular"
   └─ Confirmação: "Remove desta lista? (Publicação continua no histórico)"
      └─ DeleteAPI call → publication.case = NULL
         └─ Refetch publicacoes → atualiza aba
```

---

## 10. PRIORIZAÇÃO PARA MVP

### Fase 1: Backend (2-3 horas)

1. [ ] Adicionar `case` FK a Publication model
2. [ ] Criar migration
3. [ ] Endpoint: GET /cases/{id}/publicacoes/ (filtros + paginação)
4. [ ] Endpoint: POST /cases/{id}/publicacoes/{pubId}/link/
5. [ ] Endpoint: DELETE /cases/{id}/publicacoes/{pubId}/unlink/

### Fase 2: Frontend (2-3 horas)

1. [ ] Service: getPublicacoesCase(), linkPublicacao(), unlinkPublicacao()
2. [ ] PublicacoesTab: useEffect para carregar publicações
3. [ ] PublicacoesTab: Handlers para vincular/desvincular (sem Modal ainda)
4. [ ] Modal: VincularPublicacaoModal (buscar + listar não vinculadas)
5. [ ] Testes manuais com Case #4

### Fase 3: Inteligência (1-2 horas)

1. [ ] Backend: Ao salvar SearchHistory → tentar auto-vincular matches
2. [ ] Badge em PublicacoesTab quando há novas publicações
3. [ ] Notificação quando aba Publicações tem updates

---

**Próximo passo:** Você quer implementar a Fase 1 (Backend) ou prefere refinar a arquitetura primeiro?

---

# PARTE 2: ANÁLISE DA PROPOSTA DO USUÁRIO

**Data:** 27/02/2026  
**Contexto:** Discussão sobre separação de responsabilidades entre Publicações e Movimentações

---

## 11. CONFIRMAÇÃO: PERSISTÊNCIA DE DADOS ✅

### Sua pergunta: "Cada busca guarda os resultados?"

**RESPOSTA: SIM! ✅✅✅**

```python
# backend/apps/publications/models.py

class SearchHistory(models.Model):
    """Registra CADA busca realizada"""
    data_inicio = models.DateField()
    data_fim = models.DateField()
    tribunais = models.JSONField()  # ["TJSP", "TRF3", "TRT2"]
    total_publicacoes = models.IntegerField()  # Quantas encontrou
    executed_at = models.DateTimeField()  # Quando foi feita

class Publication(models.Model):
    """Registra CADA publicação encontrada"""
    id_api = models.BigIntegerField(unique=True)  # Evita duplicatas
    numero_processo = models.CharField()
    tribunal = models.CharField()
    tipo_comunicacao = models.CharField()  # Intimação, Despacho, etc
    data_disponibilizacao = models.DateField()
    texto_resumo = models.TextField()
    texto_completo = models.TextField()
    # ... outros campos
```

**Fluxo real:**

```
1️⃣ Busca online → Retorna 10 publicações de 2 processos diferentes
   └─ SearchHistory: 1 registro criado
   └─ Publication: 10 registros criados (ou update se id_api já existe)

2️⃣ Dados persistidos permanentemente no SQLite

3️⃣ Próxima vez: Consulta rápida no banco (não precisa API externa)
```

---

## 12. CENÁRIO REAL: BUSCA RETORNA 2 PROCESSOS

### Seu exemplo: "Busca retornou publicações de dois processos"

**Situação:**

- Busca DJE: 01/02 a 07/02
- Retorna: 10 publicações
  - 6 publicações do Processo A (cliente cadastrado)
  - 4 publicações do Processo B (cliente NÃO cadastrado)

**Pergunta chave: Cliente já cadastrado?**

#### CENÁRIO A: Cliente JÁ CADASTRADO ✅

```
Publication (Intimação TJSP de 05/02)
│
├─ numero_processo: "1003306-63.2024.8.26.0019"
│
└─ Sistema verifica:
   └─ Case com esse número existe? SIM!
      └─ Vincular automaticamente:
         publication.case = case_encontrado
         publication.save()
```

**Lógica de auto-vinculação (proposta):**

```python
# backend/apps/publications/views.py

def save_publications(publications_data, search_history_id):
    for pub_data in publications_data:
        # Salvar publicação
        pub, created = Publication.objects.update_or_create(
            id_api=pub_data['id_api'],
            defaults={...}
        )

        # Tentar vincular automaticamente
        if pub.numero_processo:
            try:
                case = Case.objects.get(
                    numero_processo_unformatted=clean_processo(pub.numero_processo)
                )
                pub.case = case
                pub.save()

                # OPCIONAL: Criar movimentação automática
                CaseMovement.objects.create(
                    case=case,
                    data=pub.data_disponibilizacao,
                    tipo='INTIMACAO' if 'Intimação' in pub.tipo_comunicacao else 'OUTROS',
                    titulo=pub.tipo_comunicacao,
                    descricao=pub.texto_resumo,
                    origem='DJE',
                    publicacao_id=pub.id
                )
            except Case.DoesNotExist:
                # Cliente não cadastrado, deixa pub.case = NULL
                pass
```

#### CENÁRIO B: Cliente NÃO CADASTRADO ❌

```
Publication (Intimação TRF3 de 06/02)
│
├─ numero_processo: "5000123-45.2025.4.03.6100"
│
└─ Sistema verifica:
   └─ Case com esse número existe? NÃO!
      └─ Ação: publication.case = NULL
         └─ Fica disponível para:
            a) Criar novo caso baseado nesta publicação
            b) Ignorar (não é cliente)
```

**Funcionalidade futura:**

```
┌─ PublicationDetailModal ──────────────────────┐
│ 📰 Intimação - TRF3                           │
│ Processo: 5000123-45.2025.4.03.6100          │
│                                               │
│ ⚠️  Este processo NÃO está cadastrado        │
│                                               │
│ [➕ Criar Caso a partir desta publicação]    │
│      └─ Pré-preenche: número, tribunal,      │
│         data_distribuicao, partes (se parse) │
└───────────────────────────────────────────────┘
```

---

## 13. PUBLICAÇÕES vs MOVIMENTAÇÕES (SUA PROPOSTA ✅)

### Sua proposta está CORRETA e alinhada com a arquitetura existente!

```
┌─ ABA PUBLICAÇÕES (Detalhes do Caso) ────────────┐
│                                                  │
│ OBJETIVO: Cards visuais de publicações DJE       │
│                                                  │
│ FONTE: Publication.objects.filter(case=caso)     │
│                                                  │
│ EXIBIÇÃO:                                        │
│  ├─ PublicationCard (componente pronto ✅)      │
│  ├─ Ordenado por data DESC (mais recente)       │
│  ├─ Badge: [Intimação] [TJSP] [05/02/2026]     │
│  └─ Resumo do texto + link oficial              │
│                                                  │
│ CRUD:                                            │
│  ├─ CREATE: Vincular publicação existente       │
│  ├─ READ: Visualizar cards                      │
│  ├─ UPDATE: (não aplicável - dado oficial)      │
│  └─ DELETE: Desvincular (pub.case = NULL)       │
│                                                  │
│ BACKEND: GET /api/cases/{id}/publicacoes/        │
│          POST /api/cases/{id}/publicacoes/link/  │
│          DELETE /api/cases/{id}/publicacoes/{id}/│
└──────────────────────────────────────────────────┘

┌─ ABA MOVIMENTAÇÕES (Detalhes do Caso) ──────────┐
│                                                  │
│ OBJETIVO: Timeline legível do histórico         │
│                                                  │
│ FONTE: CaseMovement.objects.filter(case=caso)    │
│                                                  │
│ EXIBIÇÃO:                                        │
│  ├─ Timeline vertical com data + tipo           │
│  ├─ Ordenado por data DESC                      │
│  ├─ Origem visual: [DJE] [Manual] [e-SAJ]      │
│  └─ Descrição completa editável                 │
│                                                  │
│ TIPOS INCLUÍDOS:                                 │
│  ├─ Automáticos (DJE, e-SAJ, PJE)              │
│  ├─ Manuais (advogada registra)                │
│  └─ Híbridos (pub não encontrada → manual)      │
│                                                  │
│ CRUD:                                            │
│  ├─ CREATE: Nova movimentação manual            │
│  ├─ READ: Timeline completa                     │
│  ├─ UPDATE: Editar só se origem=MANUAL          │
│  └─ DELETE: Deletar só se origem=MANUAL         │
│                                                  │
│ BACKEND: GET /api/cases/{id}/movimentacoes/      │
│          POST/PUT/DELETE (ViewSet já existe ✅)  │
└──────────────────────────────────────────────────┘
```

---

## 14. MODELO DE DADOS: RELACIONAMENTOS

### Estrutura atual (confirmada no código):

```
┌─────────────────┐         ┌─────────────────┐
│  Publication    │         │  CaseMovement   │
├─────────────────┤         ├─────────────────┤
│ id              │         │ id              │
│ id_api          │         │ case ───────────┼───┐
│ numero_processo │         │ data            │   │
│ tribunal        │         │ tipo            │   │
│ tipo_comunicacao│         │ titulo          │   │
│ data_disponib.  │         │ descricao       │   │
│ texto_resumo    │         │ origem          │   │
│ texto_completo  │         │ publicacao_id ──┼─┐ │
│ case ───────────┼───┐     │ prazo           │ │ │
└─────────────────┘   │     │ data_limite     │ │ │
                      │     └─────────────────┘ │ │
                      │                         │ │
                      │     ┌───────────────────┘ │
                      │     │ (referência lógica) │
                      │     │                     │
                      │     │  ┌──────────────────┘
                      │     │  │
                      ▼     ▼  ▼
                   ┌──────────────┐
                   │    Case      │
                   ├──────────────┤
                   │ id           │
                   │ numero_proc. │
                   │ tribunal     │
                   │ status       │
                   │ valor_causa  │
                   └──────────────┘
```

**Relacionamentos:**

```python
# Publicação PODE estar vinculada a um caso (optional)
Publication.case → Case (FK nullable) ✅ ADICIONAR

# Movimentação SEMPRE pertence a um caso (required)
CaseMovement.case → Case (FK required) ✅ JÁ EXISTE

# Movimentação PODE referenciar uma publicação (optional)
CaseMovement.publicacao_id → Publication.id (int nullable) ✅ JÁ EXISTE
```

---

## 15. CASO DE CONTINGÊNCIA (SUA PROPOSTA ✅✅✅)

### Cenário: Sistema público em manutenção

**Situação:**

```
1. Advogada tenta buscar DJE → API instável ou bloqueada
2. Acessa portal do tribunal manualmente (navegador)
3. Encontra Intimação importante de 10/02/2026
4. Precisa registrar no sistema
```

**Solução (sua proposta validada):**

```
┌─ FLUXO DE CONTINGÊNCIA ──────────────────────────┐
│                                                   │
│ 1️⃣ ABA DOCUMENTOS                                │
│    ├─ Upload do PDF da publicação                │
│    └─ Salvo em: backend/storage/documents/       │
│                                                   │
│ 2️⃣ ABA MOVIMENTAÇÕES                             │
│    ├─ Clica "Nova Movimentação"                  │
│    ├─ Preenche:                                   │
│    │   Data: 10/02/2026                          │
│    │   Tipo: Intimação                           │
│    │   Título: "Intimação para manifestação"    │
│    │   Descrição: [copiar texto da publicação]  │
│    │   Origem: MANUAL ⭐                         │
│    │   Prazo: 15 dias                            │
│    └─ Anexar documento (link ao PDF uploaded)   │
│                                                   │
│ 3️⃣ RESULTADO                                     │
│    ✅ Movimentação registrada                    │
│    ✅ Prazo calculado automaticamente            │
│    ✅ Deadline criado (se prazo > 0)             │
│    ✅ Documento disponível para consulta         │
│    ✅ Histórico completo mantido                 │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Por que isso funciona:**

- ✅ `CaseMovement.origem = 'MANUAL'` → marca como entrada manual
- ✅ `CaseMovement.publicacao_id = NULL` → não há publicação DJE vinculada
- ✅ Documento em separado na aba Documentos
- ✅ Timeline em Movimentações permanece íntegra
- ✅ Sistema não depende 100% da API externa

---

## 16. PERGUNTAS CHAVE PARA A ADVOGADA

### Você está correto! Precisamos confirmar:

#### 1. **Fontes de atualização dos processos**

**Pergunta:** "Seus processos são atualizados APENAS por publicações do DJE, ou há outras fontes?"

**Possíveis respostas:**

- **A) "Só DJE"** → Automação completa, menos trabalho manual
- **B) "DJE + e-SAJ"** → Implementar busca em e-SAJ também
- **C) "DJE + atendimentos presenciais"** → Priorizar registro manual
- **D) "Múltiplas fontes"** → Aba Movimentações é essencial

#### 2. **Frequência de buscas**

**Pergunta:** "Com que frequência você consulta publicações?"

**Possíveis respostas:**

- **A) "Diariamente"** → Automação com cronjob
- **B) "Semanalmente"** → Busca manual é suficiente
- **C) "Quando surge dúvida"** → Busca sob demanda

#### 3. **Confiabilidade da API**

**Pergunta:** "Já teve casos de publicação não aparecer na busca online mas estar visível no site?"

**Possíveis respostas:**

- **A) "Sim, várias vezes"** → Contingência manual é CRÍTICA
- **B) "Raramente"** → Contingência é backup
- **C) "Nunca"** → Contingência é precaução

#### 4. **Workflow ideal**

**Pergunta:** "Quando a busca encontra publicações, você quer que o sistema vincule automaticamente aos casos cadastrados?"

**Possíveis respostas:**

- **A) "Sim, sempre"** → Automação total
- **B) "Sim, mas com revisão"** → Notificação + confirmação manual
- **C) "Não, prefiro manualmente"** → Lista de sugestões

---

## 17. ANÁLISE: SUA PROPOSTA FAZ SENTIDO? ✅

### RESPOSTA: **SIM! TOTALMENTE ALINHADA COM A ARQUITETURA**

#### ✅ Validações:

1. **Separação clara de responsabilidades**
   - Publicações = Cards visuais DJE (dados oficiais)
   - Movimentações = Timeline histórico (múltiplas fontes)
   - Documentos = Upload contingência

2. **Reuso de componentes**
   - PublicationCard.jsx já existe e funciona ✅
   - MovimentacoesTab.jsx já existe e funciona ✅
   - DocumentosTab.jsx já existe ✅

3. **Backend preparado**
   - CaseMovement com campo `origem` ✅
   - CaseMovement com campo `publicacao_id` ✅
   - ViewSets já criados ✅

4. **Contingência robusta**
   - Upload manual → Documentos
   - Registro manual → Movimentações
   - Sistema funciona mesmo se API DJE cair

5. **Lógica empresarial correta**
   - Busca persiste dados (histórico permanente)
   - Auto-vinculação por numero_processo
   - Flexibilidade para casos não cadastrados

---

## 18. ROADMAP DE IMPLEMENTAÇÃO (VALIDADO)

### FASE 1: Vincular Publicações a Casos (2-3h)

```python
# backend/apps/publications/models.py
class Publication(models.Model):
    # ... campos existentes ...
    case = models.ForeignKey(  # ← ADICIONAR
        'cases.Case',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='publicacoes'
    )
```

**Endpoints:**

```python
GET    /api/cases/{id}/publicacoes/           # Listar publicações do caso
POST   /api/cases/{id}/publicacoes/{pub}/link/  # Vincular publicação existente
DELETE /api/cases/{id}/publicacoes/{pub}/      # Desvincular
```

### FASE 2: Auto-vinculação em Buscas (1h)

```python
# backend/apps/publications/views.py
def after_search_complete(publications):
    for pub in publications:
        if pub.numero_processo:
            try:
                case = Case.objects.get(
                    numero_processo_unformatted=clean_numero(pub.numero_processo)
                )
                pub.case = case
                pub.save()

                # OPCIONAL: Criar movimentação automática
                auto_create_movement(pub, case)
            except Case.DoesNotExist:
                pass  # Cliente não cadastrado
```

### FASE 3: UI em PublicacoesTab (1-2h)

```jsx
// frontend/src/components/CaseTabs/PublicacoesTab.jsx

useEffect(() => {
  if (caseId) {
    loadPublicacoes(caseId);
  }
}, [caseId]);

const loadPublicacoes = async (caseId) => {
  const result = await publicationsService.getCasePublications(caseId);
  setPublicacoes(result);
};

// Renderizar com PublicationCard (já existe ✅)
{
  publicacoes.map((pub) => (
    <PublicationCard
      key={pub.id}
      publication={pub}
      onClick={() => handleViewDetail(pub)}
      onDelete={() => handleUnlink(pub.id)}
    />
  ));
}
```

### FASE 4: Movimentações Auto-criadas (opcional, 30min)

```python
# backend/apps/publications/utils.py
def create_movement_from_publication(pub, case):
    """Cria movimentação automaticamente após vincular publicação"""
    tipo_map = {
        'Intimação': 'INTIMACAO',
        'Citação': 'CITACAO',
        'Despacho': 'DESPACHO',
        'Sentença': 'SENTENCA',
    }

    CaseMovement.objects.create(
        case=case,
        data=pub.data_disponibilizacao,
        tipo=tipo_map.get(pub.tipo_comunicacao, 'OUTROS'),
        titulo=f"{pub.tipo_comunicacao} - {pub.tribunal}",
        descricao=pub.texto_resumo,
        origem='DJE',
        publicacao_id=pub.id
    )
```

---

## 19. RESPOSTA FINAL

### ✅ SIM, sua proposta FAZ TOTAL SENTIDO!

**Arquitetura validada:**

```
┌─ PUBLICAÇÕES (aba no caso) ─────────────────────┐
│ Cards visuais, fonte DJE, dados oficiais       │
│ CRUD: Vincular/desvincular existentes          │
│ Ordenação: data DESC                            │
│ Componente: PublicationCard (pronto ✅)        │
└─────────────────────────────────────────────────┘

┌─ MOVIMENTAÇÕES (aba no caso) ───────────────────┐
│ Timeline legível, múltiplas fontes             │
│ CRUD: Criar/editar/deletar (se origem=MANUAL)  │
│ Ordenação: data DESC                            │
│ Componente: MovimentacoesTab (pronto ✅)       │
└─────────────────────────────────────────────────┘

┌─ DOCUMENTOS (aba no caso) ──────────────────────┐
│ Upload de PDFs (contingência)                  │
│ Link para movimentações manuais               │
│ Componente: DocumentosTab (pronto ✅)          │
└─────────────────────────────────────────────────┘
```

**Backend já preparado:**

- ✅ CaseMovement model (com origem + publicacao_id)
- ✅ Publication model (só precisa adicionar FK case)
- ✅ ViewSets funcionando
- ✅ Soft delete implementado

**Próximo passo:**
Implementar vínculo Publication → Case (Fase 1 do roadmap)

---

# PARTE 3: FLUXO DE INTEGRAÇÃO COM DECISÃO DA USUÁRIA

**Data:** 27/02/2026  
**Contexto:** Refinamento do fluxo baseado em UX real da advogada

---

## 20. FLUXO PROPOSTO PELO USUÁRIO ✅

### Problema: "Busca retorna 10 publicações, mas só 1 é urgente"

**Situação real:**

```
Advogada faz busca DJE
└─ Retorna: 10 publicações
   ├─ 1 publicação urgente (intimação com prazo)
   ├─ 9 publicações menos urgentes
   └─ Problema: Não quer parar tudo para integrar 10 agora
```

**Solução proposta (VALIDADA):**

```
┌─ APÓS BUSCA CONCLUÍDA ───────────────────────────────┐
│                                                       │
│ ✅ 10 publicações encontradas!                       │
│                                                       │
│ 🔄 Fazer integração automática agora?                │
│                                                       │
│ [SIM, Integrar Agora] [NÃO, Deixar Pendente]        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Fluxo SIM:**

```
Integração automática iniciada
│
├─ Para cada publicação:
│  └─ numero_processo cadastrado?
│     ├─ SIM → pub.case = case_encontrado
│     │        pub.integration_status = 'INTEGRATED'
│     │
│     └─ NÃO → pub.integration_status = 'PENDING'
│              (vai para lista "Pendentes")
│
└─ Resultado exibido:
   ├─ "5 publicações integradas automaticamente"
   ├─ "3 publicações ficaram pendentes (clientes não cadastrados)"
   └─ "2 publicações ignoradas (duplicatas)"
```

**Fluxo NÃO:**

```
Todas as 10 publicações marcadas como 'PENDING'
└─ Vão para página "Publicações Pendentes"
   └─ Advogada integra quando quiser
```

---

## 21. NOVA ABA: PUBLICAÇÕES PENDENTES

### UI: Sidebar Principal (esquerdo)

```
┌─ SIDEBAR ─────────────────────────────┐
│ 🏠 Dashboard                          │
│ 📁 Processos                          │
│ 👥 Contatos                           │
│ 📰 Publicações                        │
│ 📋 Histórico                          │
│ ⚠️  Pendentes (5) ← NOVO ⭐          │
│ ⏰ Prazos                             │
│ ⚙️  Configurações                     │
└───────────────────────────────────────┘
```

**Badge de notificação:**

- Exibe quantidade de publicações não integradas
- Cor: Amarelo/laranja (atenção, não urgente)
- Atualiza em tempo real após buscas

---

## 22. PÁGINA: PUBLICAÇÕES PENDENTES DE INTEGRAÇÃO

### Layout completo:

```
┌─ Publicações Pendentes de Integração ─────────────────────────────┐
│                                                                    │
│ 📤 Aguardando integração: 5 publicações                           │
│                                                                    │
│ Filtros: [Todas (5)] [TJSP (3)] [TRF3 (1)] [TRT2 (1)]           │
│ Ordenar: [Data ▼] [Tribunal] [Tipo]                              │
│                                                                    │
│ ┌─ PublicationCard ──────────────────────────────────────┐        │
│ │ [Intimação] [TJSP]                      10/02/2026    │        │
│ │ ────────────────────────────────────────────────────── │        │
│ │ 📄 1003306-63.2024.8.26.0019                          │        │
│ │ ⚖️  Vara de Família - São Paulo - SP                   │        │
│ │                                                        │        │
│ │ Resumo: DESPACHO - Intimação para manifestação sobre   │        │
│ │ petição da parte contrária no prazo de 15 dias...     │        │
│ │                                                        │        │
│ │ ⚠️  Cliente não encontrado no sistema                  │        │
│ │                                                        │        │
│ │ [🔗 Integrar ao Caso] [➕ Criar Novo Caso] [🗑️ Apagar] │        │
│ └────────────────────────────────────────────────────────┘        │
│                                                                    │
│ ┌─ PublicationCard ──────────────────────────────────────┐        │
│ │ [Despacho] [TRF3]                       09/02/2026    │        │
│ │ ────────────────────────────────────────────────────── │        │
│ │ 📄 5000123-45.2025.4.03.6100                          │        │
│ │ ⚖️  1ª Vara Federal - São Paulo - SP                   │        │
│ │                                                        │        │
│ │ Resumo: Despacho determinando juntada de documentos... │        │
│ │                                                        │        │
│ │ ✅ Processo cadastrado: Caso #12 - João Silva          │        │
│ │                                                        │        │
│ │ [🔗 Vincular ao Caso #12] [🗑️ Apagar]                 │        │
│ └────────────────────────────────────────────────────────┘        │
│                                                                    │
│ ┌─ PublicationCard ──────────────────────────────────────┐        │
│ │ [Sentença] [TJSP]                       08/02/2026    │        │
│ │ ...                                                    │        │
│ └────────────────────────────────────────────────────────┘        │
│                                                                    │
│ [◀ Anterior] [1] [2] [3] [Próxima ▶]                             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Características:

1. **Detecção automática:**
   - Sistema verifica se `numero_processo` existe em `Case`
   - Se SIM → mensagem "✅ Processo cadastrado: Caso #X"
   - Se NÃO → mensagem "⚠️ Cliente não encontrado"

2. **Ações contextuais:**
   - **Cliente cadastrado:** [Vincular ao Caso] + [Apagar]
   - **Cliente NÃO cadastrado:** [Integrar ao Caso] + [Criar Novo Caso] + [Apagar]

3. **Abertura em nova janela:**
   - Clica na aba "Pendentes" → abre em nova janela
   - Advogada pode ler outras partes do sistema antes de integrar
   - Fluxo não bloqueante

---

## 23. BACKEND: CAMPO DE STATUS DE INTEGRAÇÃO

### Migration necessária:

```python
# backend/apps/publications/models.py

class Publication(models.Model):
    # ... campos existentes ...

    # ========== INTEGRAÇÃO COM CASOS ========== (NOVOS)
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='publicacoes',
        help_text='Caso ao qual esta publicação está vinculada'
    )

    integration_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pendente de Integração'),
            ('INTEGRATED', 'Integrada ao Caso'),
            ('IGNORED', 'Ignorada pela Advogada'),
        ],
        default='PENDING',
        db_index=True,
        help_text='Status da integração com o sistema'
    )

    integration_attempted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Última tentativa de integração automática'
    )

    integration_notes = models.TextField(
        blank=True,
        default='',
        help_text='Observações sobre a integração (ex: "Processo não cadastrado")'
    )
```

### Queries necessárias:

```python
# Listar pendentes
Publication.objects.filter(
    integration_status='PENDING',
    deleted=False
).order_by('-data_disponibilizacao')

# Listar integradas de um caso
Publication.objects.filter(
    case_id=caso_id,
    integration_status='INTEGRATED',
    deleted=False
).order_by('-data_disponibilizacao')

# Contar pendentes (para badge)
Publication.objects.filter(
    integration_status='PENDING',
    deleted=False
).count()
```

---

## 24. FLUXOS DE INTEGRAÇÃO DETALHADOS

### FLUXO A: Vincular ao Caso Existente

```
Usuária clica [🔗 Vincular ao Caso #12]
│
├─ Modal de confirmação:
│  ┌─────────────────────────────────────────┐
│  │ Vincular publicação ao caso?            │
│  │                                         │
│  │ Publicação:                             │
│  │ • Intimação - TJSP - 10/02/2026        │
│  │ • Processo: 1003306-63.2024.8.26.0019  │
│  │                                         │
│  │ Será vinculada ao:                      │
│  │ • Caso #12: João Silva vs Estado       │
│  │                                         │
│  │ ☑️ Criar movimentação automática        │
│  │   (histórico do caso será atualizado)   │
│  │                                         │
│  │ [Confirmar] [Cancelar]                 │
│  └─────────────────────────────────────────┘
│
└─ Ao confirmar:
   ├─ pub.case = caso
   ├─ pub.integration_status = 'INTEGRATED'
   ├─ pub.integration_attempted_at = now()
   ├─ pub.save()
   │
   └─ Se checkbox marcado:
      └─ CaseMovement.objects.create(
            case=caso,
            data=pub.data_disponibilizacao,
            tipo='INTIMACAO',
            titulo=pub.tipo_comunicacao,
            descricao=pub.texto_resumo,
            origem='DJE',
            publicacao_id=pub.id
         )
```

### FLUXO B: Criar Novo Caso

```
Usuária clica [➕ Criar Novo Caso]
│
└─ Redireciona para: /casos/novo?pub_id=123
   │
   ├─ CaseDetailPage em modo criação
   │  └─ Pré-preenche campos:
   │     ├─ numero_processo = pub.numero_processo
   │     ├─ tribunal = pub.tribunal
   │     ├─ data_distribuicao = pub.data_disponibilizacao (estimada)
   │     └─ Sugestão de partes (se parser de texto funcionar)
   │
   └─ Ao salvar caso:
      ├─ case.save()
      ├─ pub.case = case
      ├─ pub.integration_status = 'INTEGRATED'
      ├─ pub.save()
      │
      └─ Cria movimentação inicial:
         └─ CaseMovement.objects.create(...)
```

### FLUXO C: Apagar Publicação

```
Usuária clica [🗑️ Apagar]
│
├─ Modal de confirmação:
│  ┌─────────────────────────────────────────┐
│  │ ⚠️  Apagar publicação?                   │
│  │                                         │
│  │ Esta ação NÃO pode ser desfeita.        │
│  │                                         │
│  │ Publicação:                             │
│  │ • Intimação - TJSP - 10/02/2026        │
│  │ • Processo: 1003306-63.2024.8.26.0019  │
│  │                                         │
│  │ Motivo: [dropdown]                      │
│  │  • Não é meu cliente                    │
│  │  • Publicação duplicada                 │
│  │  • Processo encerrado                   │
│  │  • Outro (especificar)                  │
│  │                                         │
│  │ [Confirmar Exclusão] [Cancelar]        │
│  └─────────────────────────────────────────┘
│
└─ Ao confirmar:
   ├─ Soft delete:
   │  ├─ pub.deleted = True
   │  ├─ pub.deleted_at = now()
   │  ├─ pub.deleted_reason = motivo_selecionado
   │  ├─ pub.integration_status = 'IGNORED'
   │  └─ pub.save()
   │
   └─ Remove da lista de pendentes
      └─ Toast: "Publicação removida com sucesso"
```

### FLUXO D: Ignorar Temporariamente

```
Usuária clica [⏸️ Ignorar Por Ora]
│
└─ pub.integration_status = 'IGNORED'
   └─ Remove da lista de pendentes
      └─ Fica em histórico completo (recuperável)
```

---

## 25. ENDPOINTS BACKEND (NOVOS)

### 25.1. Listar Pendentes

```python
GET /api/publications/pending

Query params:
  ?tribunal=TJSP           # Filtrar por tribunal
  ?ordering=-data          # Ordenar
  ?limit=20&offset=0       # Paginação

Response:
{
  "success": true,
  "count": 5,
  "results": [
    {
      "id": 123,
      "numero_processo": "1003306-63.2024.8.26.0019",
      "tribunal": "TJSP",
      "tipo_comunicacao": "Intimação",
      "data_disponibilizacao": "2026-02-10",
      "texto_resumo": "...",
      "integration_status": "PENDING",
      "case_suggestion": {  // Caso encontrado automaticamente
        "id": 12,
        "numero_processo": "1003306-63.2024.8.26.0019",
        "titulo": "João Silva vs Estado"
      }
    }
  ]
}
```

### 25.2. Vincular ao Caso

```python
POST /api/publications/{pub_id}/integrate

Body:
{
  "case_id": 12,
  "create_movement": true,  // Criar movimentação automática?
  "notes": "Vinculado manualmente"
}

Response:
{
  "success": true,
  "message": "Publicação vinculada com sucesso",
  "publication": { ... },
  "movement_created": true
}
```

### 25.3. Integração em Lote (após busca)

```python
POST /api/publications/batch-integrate

Body:
{
  "search_id": 45,  // ID do SearchHistory
  "auto_link": true  // Tentar vincular automaticamente
}

Response:
{
  "success": true,
  "integrated": 5,      // Vinculadas automaticamente
  "pending": 3,         // Ficaram pendentes (cliente não cadastrado)
  "ignored": 2,         // Duplicatas ou já existentes
  "details": [...]
}
```

### 25.4. Apagar Publicação

```python
DELETE /api/publications/{pub_id}

Body:
{
  "reason": "Não é meu cliente"
}

Response:
{
  "success": true,
  "message": "Publicação removida (soft delete)"
}
```

---

## 26. FRONTEND: NOVA PÁGINA

### Arquivo: `frontend/src/pages/PendingPublicationsPage.jsx`

```jsx
import React, { useState, useEffect } from "react";
import PublicationCard from "../components/PublicationCard";
import publicationsService from "../services/publicationsService";
import EmptyState from "../components/common/EmptyState";
import { FileQuestion } from "lucide-react";

export default function PendingPublicationsPage() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, TJSP, TRF3, etc

  useEffect(() => {
    loadPending();
  }, [filter]);

  const loadPending = async () => {
    setLoading(true);
    const result = await publicationsService.getPending({
      tribunal: filter === "all" ? null : filter,
    });
    setPublications(result.results || []);
    setLoading(false);
  };

  const handleIntegrate = async (pub) => {
    if (pub.case_suggestion) {
      // Mostrar modal de confirmação
      const confirmed = window.confirm(
        `Vincular ao Caso #${pub.case_suggestion.id}?`,
      );
      if (confirmed) {
        await publicationsService.integrate(pub.id, {
          case_id: pub.case_suggestion.id,
          create_movement: true,
        });
        loadPending(); // Recarregar lista
      }
    } else {
      // Redirecionar para criar novo caso
      window.location.href = `/casos/novo?pub_id=${pub.id}`;
    }
  };

  const handleDelete = async (pubId) => {
    const reason = prompt("Motivo da exclusão:");
    if (reason) {
      await publicationsService.delete(pubId, { reason });
      loadPending();
    }
  };

  const handleCreateCase = (pub) => {
    window.location.href = `/casos/novo?pub_id=${pub.id}`;
  };

  if (loading) return <div>Carregando...</div>;

  if (publications.length === 0) {
    return (
      <EmptyState
        icon={FileQuestion}
        message="Nenhuma publicação pendente"
        hint="Todas as publicações foram integradas ou removidas"
      />
    );
  }

  return (
    <div className="pending-publications-page">
      <header>
        <h1>📤 Publicações Pendentes de Integração</h1>
        <p>{publications.length} publicações aguardando integração</p>
      </header>

      <div className="filters">
        <button onClick={() => setFilter("all")}>
          Todas ({publications.length})
        </button>
        {/* Filtros por tribunal */}
      </div>

      <div className="publications-list">
        {publications.map((pub) => (
          <div key={pub.id} className="pending-pub-card">
            <PublicationCard publication={pub} />

            {pub.case_suggestion && (
              <div className="case-suggestion">
                ✅ Processo cadastrado: Caso #{pub.case_suggestion.id}
              </div>
            )}

            {!pub.case_suggestion && (
              <div className="case-warning">
                ⚠️ Cliente não encontrado no sistema
              </div>
            )}

            <div className="actions">
              <button
                className="btn-primary"
                onClick={() => handleIntegrate(pub)}
              >
                🔗 {pub.case_suggestion ? "Vincular" : "Integrar"} ao Caso
              </button>

              {!pub.case_suggestion && (
                <button
                  className="btn-success"
                  onClick={() => handleCreateCase(pub)}
                >
                  ➕ Criar Novo Caso
                </button>
              )}

              <button
                className="btn-danger"
                onClick={() => handleDelete(pub.id)}
              >
                🗑️ Apagar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 27. ROTEAMENTO

### Atualizar: `frontend/src/App.jsx`

```jsx
import PendingPublicationsPage from "./pages/PendingPublicationsPage";

// Adicionar rota:
<Route path="/publicacoes/pendentes" element={<PendingPublicationsPage />} />;
```

### Atualizar: `frontend/src/components/Sidebar.jsx`

```jsx
// Adicionar item com badge
const [pendingCount, setPendingCount] = useState(0);

useEffect(() => {
  loadPendingCount();
}, []);

const loadPendingCount = async () => {
  const result = await publicationsService.getPendingCount();
  setPendingCount(result.count);
};

// JSX:
<NavLink to="/publicacoes/pendentes">
  ⚠️ Pendentes
  {pendingCount > 0 && (
    <span className="badge badge-warning">{pendingCount}</span>
  )}
</NavLink>;
```

---

## 28. CICLO DE VIDA COMPLETO DE UMA PUBLICAÇÃO

```
┌─ BUSCA DJE ─────────────────────────────────────────┐
│ API externa retorna publicações                    │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─ PERSISTÊNCIA ──────────────────────────────────────┐
│ Publication salva no banco                         │
│ integration_status = 'PENDING'                     │
│ case = NULL                                        │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─ PROMPT DE INTEGRAÇÃO ──────────────────────────────┐
│ "X publicações encontradas, integrar agora?"       │
│ [SIM] [NÃO]                                        │
└──────────────┬──────────────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼ SIM             ▼ NÃO
┌─────────────┐   ┌─────────────────────┐
│ Auto-integração│   │ Fica em "Pendentes" │
└──────┬──────┘   └─────────┬───────────┘
       │                     │
       │ Match?              │ Advogada decide:
       ├─ SIM → case = X     ├─ [Vincular]
       │        status=INT   ├─ [Criar Caso]
       │                     └─ [Apagar]
       └─ NÃO → status=PEND
                └─ Vai p/ Pendentes
```

---

## 29. RESUMO: DECISÕES ARQUITETURAIS VALIDADAS

| Aspecto                      | Decisão        | Justificativa                                    |
| ---------------------------- | -------------- | ------------------------------------------------ |
| **Prompt de integração**     | ✅ Implementar | UX não bloqueante, advogada decide timing        |
| **Nova aba "Pendentes"**     | ✅ Criar       | Separar responsabilidades, melhor organização    |
| **Abertura em nova janela**  | ✅ Suportar    | Permite navegação paralela, não interrompe fluxo |
| **Botão "Integrar" no card** | ✅ Adicionar   | Ação direta, sem submenu                         |
| **Botão "Apagar" no card**   | ✅ Adicionar   | Flexibilidade para descartar irrelevantes        |
| **Soft delete**              | ✅ Manter      | Histórico preservado, recuperável se necessário  |
| **Auto-detecção de caso**    | ✅ Implementar | Simplifica UX, sugere vinculação automática      |
| **Campo integration_status** | ✅ Adicionar   | Rastreamento de estado, queries eficientes       |

---

## 30. PRÓXIMOS PASSOS (ATUALIZADO)

### FASE 1: Backend - Integração (3-4h)

```sql
-- Migration: Adicionar campos de integração
ALTER TABLE publications ADD COLUMN case_id INTEGER NULL;
ALTER TABLE publications ADD COLUMN integration_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE publications ADD COLUMN integration_attempted_at TIMESTAMP NULL;
ALTER TABLE publications ADD COLUMN integration_notes TEXT DEFAULT '';
CREATE INDEX idx_pub_integration ON publications(integration_status, deleted);
```

**Endpoints:**

- [x] `GET /api/publications/pending` - Listar pendentes
- [x] `POST /api/publications/{id}/integrate` - Vincular ao caso
- [x] `POST /api/publications/batch-integrate` - Integração em lote
- [x] `DELETE /api/publications/{id}` - Soft delete
- [x] `GET /api/publications/pending/count` - Badge count

### FASE 2: Frontend - Página Pendentes (2-3h)

- [x] Criar `PendingPublicationsPage.jsx`
- [x] Adicionar rota `/publicacoes/pendentes`
- [x] Adicionar item no Sidebar com badge
- [x] Implementar filtros (tribunal, tipo, data)
- [x] Ações nos cards (Vincular, Criar Caso, Apagar)

### FASE 3: Prompt de Integração (1h)

- [x] Modal após busca concluída
- [x] Opção "Integrar Agora" vs "Deixar Pendente"
- [x] Feedback visual do resultado da integração

### FASE 4: Auto-vinculação Inteligente (1-2h)

- [x] Detectar caso existente por `numero_processo`
- [x] Sugerir vinculação automática
- [x] Criar movimentação opcional

### FASE 5: Testes + Refinamento (1-2h)

- [x] Testar fluxo completo: busca → pendentes → integração
- [x] Validar soft delete
- [x] Conferir badge de contagem
- [x] Ajustar UX conforme feedback

---

**Total estimado: 8-12 horas**

**Pronto para começar pela Fase 1 (Backend)?**

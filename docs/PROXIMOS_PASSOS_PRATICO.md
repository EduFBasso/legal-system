# 🎯 PRÓXIMOS PASSOS - DESENVOLVIMENTO

**Para você:** Roteiro prático das próximas implementações

---

## 📊 ONDE VOCÊ ESTÁ AGORA

```
✅ Fase 1: Contatos          [████████████████] 100%
✅ Fase 3: Publicações        [████████████████] 100%
⏳ Fase 2: Refatoração        [████████░░░░░░░░] 60%
⏳ Fase 4: Cases              [████░░░░░░░░░░░░] 30%
🔜 Fase 5: Notificações       [░░░░░░░░░░░░░░░░] 0%
🔜 Fase 6: Relatórios         [░░░░░░░░░░░░░░░░] 0%
```

---

## 🎯 RECOMENDAÇÃO: PRÓXIMA PRIORIDADE

### Opção A: **FINALIZAR FASE 4 (CASES)** ⭐ RECOMENDADO

**Por quê?**

- Backend já 80% pronto (models existem)
- Feature principal do sistema jurídico
- Advogada vai usar muito (processos são core)
- Depois disso, sistema fica completo no básico

**Timeline:** 3-4 semanas

**O que falta:**

1. Backend: ViewSets + URLs (1 semana)
2. Frontend: CasesPage + CaseDetailModal (2 semanas)
3. Testes + Validação (1 semana)

---

### Opção B: **FINALIZAR FASE 2 (REFATORAÇÃO)**

**Por quê?**

- Componentes comuns reutilizáveis
- Facilita desenvolvimento futuro
- Código mais limpo

**Timeline:** 1-2 semanas

**O que criar:**

- Button component (padronizado)
- Badge component (status)
- SearchBox reutilizável
- FormField melhorado

---

## 📋 ROTEIRO DETALHADO - FASE 4 (CASES)

### Semana 1: Backend (ViewSets + API)

#### Dia 1-2: ViewSets

```python
# backend/apps/cases/views.py
from rest_framework import viewsets
from .models import Case, CaseParty, CaseMovement
from .serializers import CaseSerializer, CaseDetailSerializer

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['numero_processo', 'titulo', 'clients__name']
    filterset_fields = ['status', 'tribunal', 'tipo_acao']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CaseDetailSerializer
        return CaseSerializer
```

#### Dia 3-4: Serializers

```python
# backend/apps/cases/serializers.py
class CaseListSerializer(serializers.ModelSerializer):
    """Para lista/cards (dados resumidos)"""
    class Meta:
        model = Case
        fields = ['id', 'numero_processo', 'titulo', 'tribunal',
                  'status', 'created_at']

class CaseDetailSerializer(serializers.ModelSerializer):
    """Para modal (todos os dados + relationships)"""
    parties = CasePartySerializer(many=True, read_only=True)
    movements = CaseMovementSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = '__all__'
```

#### Dia 5: URLs + Testes

```python
# backend/apps/cases/urls.py
router = DefaultRouter()
router.register('cases', CaseViewSet)

# Testar
pytest apps/cases/ -v
```

---

### Semana 2-3: Frontend

#### Componentes a Criar

```
frontend/src/pages/
└── CasesPage.jsx                 # Lista + sidebar

frontend/src/components/cases/
├── CaseCard.jsx                  # Mini-card
├── CaseDetailModal.jsx           # Modal VIEW/EDIT/CREATE
├── CasePartyManager.jsx          # Gerenciar partes
└── CaseMovementTimeline.jsx      # Timeline de movimentos
```

#### Fluxo de Desenvolvimento

**Passo 1: Service Layer (1 dia)**

```javascript
// frontend/src/services/casesService.js
export const casesService = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/cases/`);
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/cases/${id}/`);
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/api/cases/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // ... update, delete
};
```

**Passo 2: Context (1 dia)**

```javascript
// frontend/src/contexts/CasesContext.jsx
export const CasesProvider = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    const data = await casesService.getAll();
    setCases(data);
    setLoading(false);
  };

  // ... CRUD methods

  return (
    <CasesContext.Provider value={{ cases, loading, loadCases }}>
      {children}
    </CasesContext.Provider>
  );
};
```

**Passo 3: CasesPage (2 dias)**

```javascript
// frontend/src/pages/CasesPage.jsx
export const CasesPage = () => {
  const { cases, loadCases } = useContext(CasesContext);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  const filteredCases = cases.filter(
    (c) =>
      c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numero_processo.includes(searchTerm),
  );

  return (
    <div className="cases-page">
      <Sidebar>
        <SearchBox value={searchTerm} onChange={setSearchTerm} />
        <button onClick={() => setSelectedCase("new")}>+ Novo Caso</button>

        {filteredCases.map((caso) => (
          <CaseCard
            key={caso.id}
            case={caso}
            onClick={() => setSelectedCase(caso.id)}
          />
        ))}
      </Sidebar>

      <MainContent>
        {selectedCase && (
          <CaseDetailModal
            caseId={selectedCase}
            onClose={() => setSelectedCase(null)}
          />
        )}
      </MainContent>
    </div>
  );
};
```

**Passo 4: CaseCard (1 dia)**

```javascript
// frontend/src/components/cases/CaseCard.jsx
export const CaseCard = ({ case: caso, onClick }) => {
  return (
    <div className="case-card" onClick={onClick}>
      <div className="case-header">
        <span className="case-numero">{caso.numero_processo}</span>
        <Badge status={caso.status} />
      </div>
      <h3 className="case-titulo">{caso.titulo}</h3>
      <div className="case-details">
        <span>{caso.tribunal}</span>
        <span>{caso.tipo_acao}</span>
      </div>
    </div>
  );
};
```

**Passo 5: CaseDetailModal (3-4 dias)** ← Mais complexo

```javascript
// frontend/src/components/cases/CaseDetailModal.jsx
export const CaseDetailModal = ({ caseId, onClose }) => {
  const [mode, setMode] = useState("view"); // view, edit, create
  const [caseData, setCaseData] = useState(null);

  // Carregar dados
  useEffect(() => {
    if (caseId !== "new") {
      casesService.getById(caseId).then(setCaseData);
    }
  }, [caseId]);

  // VIEW mode
  if (mode === "view") {
    return (
      <Modal size="large">
        <h2>{caseData.titulo}</h2>
        <Section title="Dados Básicos">
          <Field label="Número CNJ">{caseData.numero_processo}</Field>
          <Field label="Tribunal">{caseData.tribunal}</Field>
          {/* ... */}
        </Section>

        <Section title="Partes">
          <CasePartyManager caseId={caseId} />
        </Section>

        <Section title="Movimentações">
          <CaseMovementTimeline caseId={caseId} />
        </Section>

        <button onClick={() => setMode("edit")}>✏️ Editar</button>
      </Modal>
    );
  }

  // EDIT/CREATE mode
  return <CaseForm caseData={caseData} onSave={handleSave} />;
};
```

**Passo 6: Máscara CNJ (1 dia)**

```javascript
// frontend/src/utils/masks.js
export const maskCNJ = (value) => {
  // 1234567-89.2021.8.26.0100
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 7) {
    return numbers;
  } else if (numbers.length <= 9) {
    return numbers.replace(/(\d{7})(\d+)/, "$1-$2");
  } else if (numbers.length <= 13) {
    return numbers.replace(/(\d{7})(\d{2})(\d+)/, "$1-$2.$3");
  } else if (numbers.length <= 14) {
    return numbers.replace(/(\d{7})(\d{2})(\d{4})(\d+)/, "$1-$2.$3.$4");
  } else if (numbers.length <= 16) {
    return numbers.replace(
      /(\d{7})(\d{2})(\d{4})(\d{1})(\d+)/,
      "$1-$2.$3.$4.$5",
    );
  } else {
    return numbers.replace(
      /(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d+)/,
      "$1-$2.$3.$4.$5.$6",
    );
  }
};
```

---

### Semana 4: Testes + Ajustes

#### Backend Tests

```python
# backend/apps/cases/tests/test_viewsets.py
def test_create_case(api_client):
    data = {
        'numero_processo': '1234567-89.2021.8.26.0100',
        'titulo': 'Ação de Cobrança',
        'tribunal': 'TJSP',
        'status': 'ATIVO',
        # ...
    }
    response = api_client.post('/api/cases/', data)
    assert response.status_code == 201
    assert Case.objects.count() == 1
```

#### Frontend Tests

```javascript
// frontend/src/components/cases/CaseCard.test.jsx
test("renders case card", () => {
  const caso = {
    id: 1,
    numero_processo: "1234567-89.2021.8.26.0100",
    titulo: "Ação de Cobrança",
    status: "ATIVO",
  };

  render(<CaseCard case={caso} />);

  expect(screen.getByText("1234567-89.2021.8.26.0100")).toBeInTheDocument();
  expect(screen.getByText("Ação de Cobrança")).toBeInTheDocument();
});
```

#### Validação Manual

```
1. Criar novo caso
2. Editar caso existente
3. Adicionar partes (vincular contatos)
4. Adicionar movimentações
5. Filtrar por tribunal, status
6. Buscar por número/título
7. Deletar caso (com confirmação)
```

---

## 🎓 APRENDIZADOS APLICADOS (Do clinic-system)

### O que você já sabe (aplicar aqui):

✅ **Context API para state global**

```javascript
// Igual você fez no clinic
<CasesProvider>
  <CasesPage />
</CasesProvider>
```

✅ **Service layer separado**

```javascript
// Padrão que funcionou bem
casesService.getAll();
casesService.create(data);
```

✅ **Modal híbrido VIEW/EDIT**

```javascript
// Igual ContactDetailModal
const [mode, setMode] = useState("view");
```

✅ **Máscaras de input**

```javascript
// Como maskCPF, maskCNPJ
maskCNJ("12345678920218260100");
// → 1234567-89.2021.8.26.0100
```

---

## 💡 DICAS PRÁTICAS

### 1. Comece pelo Backend

```bash
# Teste API primeiro, sem frontend
python manage.py shell
>>> from apps.cases.models import Case
>>> caso = Case.objects.create(...)
>>> caso.numero_processo
```

### 2. Use Postman/Insomnia

```
GET  http://localhost:8000/api/cases/
POST http://localhost:8000/api/cases/
```

### 3. Frontend "pega" no Backend pronto

```javascript
// Se API responde JSON correto, frontend é só consumir
const cases = await casesService.getAll();
console.log(cases); // [{id:1, titulo: '...'}]
```

### 4. Commits frequentes

```bash
git commit -m "feat(cases): adiciona CaseViewSet"
git commit -m "feat(cases): cria CasesPage com lista"
git commit -m "feat(cases): adiciona CaseDetailModal"
```

---

## 🎯 APÓS FASE 4 (CASES)

### Sistema estará **90% funcional**:

- ✅ Contatos (clientes, advogados)
- ✅ Publicações (intimações)
- ✅ Casos (processos judiciais)

### O que falta (opcional):

- Notificações (alertas de prazos)
- Relatórios (estatísticas)
- Multi-user (se migrar para cloud)

---

## 📅 CRONOGRAMA SUGERIDO

```
Fevereiro (agora):
  Semana 1: Backend Cases (ViewSets)
  Semana 2: Frontend Cases (CasesPage)
  Semana 3: Frontend Cases (CaseDetailModal)
  Semana 4: Testes + Validação

Março:
  Semana 1: Fase 5 - Notificações (backend)
  Semana 2: Fase 5 - Notificações (frontend)
  Semana 3: Fase 6 - Relatórios básicos
  Semana 4: Ajustes + Feedback da advogada

Abril:
  System completo + iterações com cliente
```

---

## 🤔 PERGUNTAS PARA A ADVOGADA (Antes de começar Cases)

1. **Como ela cadastra processos hoje?**
   - Manualmente? Importa de algum lugar?
   - Quais campos são essenciais?

2. **Quais informações ela precisa ver no card?**
   - Número + Título?
   - Status + Última movimentação?

3. **Como ela organiza processos?**
   - Por tribunal? Por cliente? Por status?

4. **Precisa de timeline de movimentações?**
   - Data + Tipo + Descrição?

5. **Anexar documentos** (PDF, Word)?
   - Sim/Não? Se sim, adicionar upload

---

## 🚀 COMANDO RÁPIDO PARA COMEÇAR

```bash
# 1. Ative ambiente
& .venv\Scripts\Activate.ps1

# 2. Crie branch
git checkout -b feature/cases-viewsets

# 3. Backend
cd backend
python manage.py shell
>>> from apps.cases.models import Case
>>> Case.objects.all()  # Verificar se models existem

# 4. Frontend
cd ../frontend
npm run dev

# 5. Comece a codar! 🚀
code backend/apps/cases/views.py
```

---

**Próximo passo:** Quer que eu ajude a criar os ViewSets de Cases? Posso gerar o código base! 🎯

---

**Documento criado:** 24/02/2026  
**Foco:** Desenvolvimento prático, sem teoria desnecessária  
**Meta:** Fase 4 completa em 3-4 semanas

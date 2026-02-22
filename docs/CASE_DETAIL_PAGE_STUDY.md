# Estudo: Página Dedicada de Detalhes do Processo

**Data:** 22/02/2026  
**Objetivo:** Transformar modal de detalhes em página completa para melhor organização e aproveitamento de espaço

---

## 1. VISÃO GERAL

### Problema Atual

- **CaseDetailModal** limitado em espaço (modal)
- Muitas abas comprimidas (Info, Partes, Publicações, Prazos)
- Dificulta visualização simultânea de informações relacionadas
- Não aproveita tela completa

### Solução Proposta

- **CaseDetailPage** - página dedicada (`/cases/:id`)
- Layout amplo com header + sidebar ou grid de seções
- Melhor organização visual de informações
- Aproveitamento total da tela

---

## 2. ARQUITETURA DE ROTAS

### Rotas Atuais

```
/cases → Lista de processos (CasesPage)
  └─ Modal com detalhes (CaseDetailModal)
```

### Rotas Propostas

```
/cases        → Lista de processos (CasesPage)
/cases/:id    → Detalhes do processo (CaseDetailPage) ← NOVA
```

### Navegação

- **Lista → Detalhes**: Click no card redireciona para `/cases/:id`
- **Detalhes → Lista**: Botão "Voltar" ou breadcrumb retorna para `/cases`
- **URL compartilhável**: `/cases/3` pode ser copiado e aberto diretamente

---

## 3. ESTRUTURA DA PÁGINA (CaseDetailPage)

### Layout Proposto - Opção A: Sidebar + Content

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ ← Voltar | Processo 0000004-23.2025.8.26.0001          │
│ [Editar] [Deletar] [+ Nova Publicação] [+ Prazo]       │
└─────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────┐
│ SIDEBAR (30%)    │ CONTENT (70%)                        │
│                  │                                      │
│ ┌──────────────┐ │ ┌──────────────────────────────────┐ │
│ │ Informações  │ │ │ [Publicações] [Prazos] [Partes]  │ │
│ │ Básicas      │ │ └──────────────────────────────────┘ │
│ │              │ │                                      │
│ │ Nº: 0000004  │ │ ┌──────────────────────────────────┐ │
│ │ Tribunal:    │ │ │ TAB CONTENT                      │ │
│ │ TJSP         │ │ │                                  │ │
│ │ Status:      │ │ │ [PublicationCard]                │ │
│ │ Ativo        │ │ │ Data: 05/02/2026                 │ │
│ │ Tipo: Cível  │ │ │ Tipo: INTIMAÇÃO                  │ │
│ │              │ │ │ Conteúdo: ...                    │ │
│ └──────────────┘ │ │                                  │ │
│                  │ │ [PublicationCard]                │ │
│ ┌──────────────┐ │ │ Data: 03/02/2026                 │ │
│ │ Localização  │ │ │ ...                              │ │
│ │              │ │ │                                  │ │
│ │ Comarca: SP  │ │ └──────────────────────────────────┘ │
│ │ Vara: 1ª Cív │ │                                      │
│ └──────────────┘ │                                      │
│                  │                                      │
│ ┌──────────────┐ │                                      │
│ │ Datas        │ │                                      │
│ │              │ │                                      │
│ │ Distrib:     │ │                                      │
│ │ 15/01/2025   │ │                                      │
│ │ Última Mov:  │ │                                      │
│ │ 05/02/2026   │ │                                      │
│ │ Sem Mov:     │ │                                      │
│ │ 17 dias      │ │                                      │
│ └──────────────┘ │                                      │
│                  │                                      │
│ ┌──────────────┐ │                                      │
│ │ Partes       │ │                                      │
│ │              │ │                                      │
│ │ Contrária:   │ │                                      │
│ │ João Silva   │ │                                      │
│ │ Valor:       │ │                                      │
│ │ R$ 50.000,00 │ │                                      │
│ └──────────────┘ │                                      │
└──────────────────┴──────────────────────────────────────┘
```

### Layout Proposto - Opção B: Grid de Seções

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ ← Voltar | Processo 0000004-23.2025.8.26.0001          │
│ [Editar] [Deletar] [+ Nova Publicação] [+ Prazo]       │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────┬─────────────────┬─────────────────┐ │
│ │ Info Básicas    │ Localização     │ Datas           │ │
│ │ TJSP | Ativo    │ SP | 1ª Cível   │ Dias sem mov: 17│ │
│ └─────────────────┴─────────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────┐
│ PUBLICAÇÕES (50%)        │ PRAZOS (50%)                 │
│                          │                              │
│ ┌──────────────────────┐ │ ┌──────────────────────────┐ │
│ │ [PublicationCard]    │ │ │ [PrazoCard]              │ │
│ │ 05/02/2026           │ │ │ Prazo: 20/02/2026        │ │
│ │ INTIMAÇÃO - TJSP     │ │ │ Status: PENDENTE         │ │
│ │ Conteúdo...          │ │ │ Tipo: Contestação        │ │
│ └──────────────────────┘ │ └──────────────────────────┘ │
│                          │                              │
│ ┌──────────────────────┐ │ ┌──────────────────────────┐ │
│ │ [PublicationCard]    │ │ │ [PrazoCard]              │ │
│ │ 03/02/2026           │ │ │ Prazo: 15/03/2026        │ │
│ │ DESPACHO - TJSP      │ │ │ Status: FUTURO           │ │
│ └──────────────────────┘ │ └──────────────────────────┘ │
└──────────────────────────┴──────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ PARTES E CONTRAPARTES                                   │
│                                                         │
│ Cliente: [Eduardo Basso] (Autor)                        │
│ Parte Contrária: [João Silva] (Réu)                    │
│ Advogado Contrário: [Maria Santos] (OAB/SP 123456)     │
│                                                         │
│ [+ Adicionar Parte]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 4. COMPONENTES A CRIAR/ADAPTAR

### Novos Componentes

#### `CaseDetailPage.jsx`

- Container principal da página
- Layout com sidebar ou grid
- Navegação entre seções
- Actions (Editar, Deletar, Adicionar)

#### `CaseInfoSidebar.jsx` ou `CaseInfoPanel.jsx`

- Resumo de informações básicas
- Cards compactos de dados
- Status, Tribunal, Datas, etc.

#### `CasePublicationsList.jsx`

- Lista de publicações do processo
- Filtradas por `numero_processo`
- Reutiliza `PublicationCard`
- Ordenadas por data decrescente

#### `CaseDeadlinesList.jsx` (para futuro)

- Lista de prazos do processo
- Cards de prazo com destaque de urgência
- CRUD de prazos

#### `CasePartiesList.jsx` (para futuro)

- Lista de partes do processo
- CRUD de relacionamento Case ↔ Contact
- Papel da parte (Autor, Réu, Advogado, etc.)

### Componentes a Reutilizar

✅ **PublicationCard** - já pronto, estilizado  
✅ **casesService** - API já implementada  
✅ **Toast** - feedback de ações  
✅ **Modal** - para confirmações (deletar)

---

## 5. FLUXO DE DADOS

### Carregamento da Página

```javascript
// CaseDetailPage.jsx
const { id } = useParams(); // pega ID da URL

useEffect(() => {
  loadCaseDetails(id); // carrega dados do processo
  loadPublications(id); // carrega publicações relacionadas
  loadDeadlines(id); // carrega prazos (futuro)
  loadParties(id); // carrega partes (futuro)
}, [id]);
```

### API Endpoints Necessários

| Endpoint                                   | Método | Descrição               | Status              |
| ------------------------------------------ | ------ | ----------------------- | ------------------- |
| `/api/cases/{id}/`                         | GET    | Detalhes do processo    | ✅ Pronto           |
| `/api/cases/{id}/`                         | PATCH  | Atualizar processo      | ✅ Pronto           |
| `/api/cases/{id}/`                         | DELETE | Deletar processo        | ✅ Pronto           |
| `/api/publications/?numero_processo={num}` | GET    | Publicações do processo | ✅ Pronto           |
| `/api/cases/{id}/deadlines/`               | GET    | Prazos do processo      | ❌ Criar            |
| `/api/cases/{id}/parties/`                 | GET    | Partes do processo      | ✅ Pronto (parties) |

---

## 6. FUNCIONALIDADES POR FASE

### Fase 1: Estrutura e Informações Básicas ⭐ PRIORIDADE

- [x] Criar rota `/cases/:id`
- [ ] Criar `CaseDetailPage.jsx` (layout básico)
- [ ] Migrar campos de informação do modal para página
- [ ] Header com ações (Editar, Voltar, Deletar)
- [ ] Sidebar ou painel com resumo de dados
- [ ] Modo visualização + modo edição inline

### Fase 2: Publicações Relacionadas ⭐ ALTA

- [ ] Criar `CasePublicationsList.jsx`
- [ ] Filtrar publicações por `numero_processo`
- [ ] Exibir `PublicationCard` organizados por data
- [ ] Contador de publicações
- [ ] Link para publicação completa

### Fase 3: Prazos (Deadlines)

- [ ] Backend: Model `Deadline` (prazo, tipo, status, processo)
- [ ] Backend: API endpoints de prazos
- [ ] Frontend: `CaseDeadlinesList.jsx`
- [ ] Frontend: CRUD de prazos
- [ ] Indicadores visuais de urgência

### Fase 4: Partes e Contrapartes

- [ ] Utilizar endpoint de parties existente
- [ ] `CasePartiesList.jsx`
- [ ] CRUD de partes (já existe no backend)
- [ ] Exibir papel de cada parte
- [ ] Link para detalhes do contato

### Fase 5: Recursos Avançados

- [ ] Histórico de alterações do processo
- [ ] Timeline de eventos
- [ ] Documentos anexados
- [ ] Anotações privadas
- [ ] Exportação de relatório

---

## 7. BENEFÍCIOS DA ABORDAGEM

### Organização

✅ Espaço amplo para informações complexas  
✅ Seções bem definidas e expandíveis  
✅ Não há limite de altura (scroll vertical)  
✅ Melhor experiência para trabalho focado

### Escalabilidade

✅ Fácil adicionar novas seções (Documentos, Timeline)  
✅ Componentes reutilizáveis e modulares  
✅ URLs compartilháveis (`/cases/3`)  
✅ Integração com outras páginas (navegação fluida)

### Performance

✅ Lazy loading de seções sob demanda  
✅ Carregamento de publicações paginado  
✅ Menor re-renderização (estado isolado por página)

### UX

✅ Navegação intuitiva (voltar/avançar do navegador funciona)  
✅ Breadcrumb claro (Processos > 0000004-23.2025)  
✅ Ações contextuais visíveis (Editar sempre disponível)  
✅ Melhor para múltiplas informações relacionadas

---

## 8. CONSIDERAÇÕES TÉCNICAS

### State Management

```javascript
// CaseDetailPage.jsx
const [caseData, setCaseData] = useState(null);
const [publications, setPublications] = useState([]);
const [deadlines, setDeadlines] = useState([]);
const [parties, setParties] = useState([]);
const [isEditing, setIsEditing] = useState(false);
const [loading, setLoading] = useState(true);
```

### Responsividade

- Desktop (>1024px): Layout com sidebar ou grid 2 colunas
- Tablet (768-1024px): Stack vertical, seções colapsáveis
- Mobile (<768px): Stack vertical completo, navegação por tabs

### Edição

**Opção A:** Modo edição inline (toggle edit mode)

```
[Visualização] → Botão "Editar" → [Campos editáveis] → "Salvar"/"Cancelar"
```

**Opção B:** Edição em modal (mantém modal para editar)

```
[Visualização] → Botão "Editar" → [Modal de edição] → Salvar → Volta para página
```

Recomendo **Opção A** para consistência com a nova abordagem.

---

## 9. MIGRAÇÃO DO MODAL ATUAL

### Conteúdo a Migrar

- ✅ Aba "Info" → Seção principal ou sidebar
- ✅ Aba "Partes" → `CasePartiesList.jsx`
- ✅ Aba "Publicações" → `CasePublicationsList.jsx`
- ✅ Aba "Prazos" → `CaseDeadlinesList.jsx` (novo)
- ✅ Modo edição → Inline edit na página

### Componentes a Deprecar

- `CaseDetailModal.jsx` → pode manter para quick view ou remover totalmente
- `CaseDetailModal.css` → migrar estilos relevantes

---

## 10. CRONOGRAMA SUGERIDO

### Sprint 1: Fundação (2-3 horas)

- Criar rota e estrutura básica de `CaseDetailPage`
- Migrar informações básicas do modal
- Layout responsivo (sidebar ou grid)
- Navegação (voltar, editar)

### Sprint 2: Publicações (1-2 horas)

- Criar `CasePublicationsList`
- Filtrar e exibir publicações do processo
- Reutilizar `PublicationCard`

### Sprint 3: Prazos (3-4 horas)

- Backend: model + serializer + endpoints
- Frontend: CRUD de prazos
- Indicadores visuais

### Sprint 4: Partes (1-2 horas)

- Utilizar endpoints existentes
- UI de gerenciamento de partes

---

## 11. RECOMENDAÇÃO FINAL

**Layout Recomendado:** Opção A (Sidebar + Content)

**Motivo:**

- Sidebar mantém contexto sempre visível (info do processo)
- Content área tem espaço para tabs de Publicações/Prazos/Partes
- Padrão comum em sistemas jurídicos (estilo "detalhe de caso")
- Melhor para múltiplas seções relacionadas

**Ordem de Implementação:**

1. ⭐ Fase 1: Estrutura e informações básicas
2. ⭐ Fase 2: Publicações (aproveita componentes existentes)
3. Fase 3: Prazos (requer backend)
4. Fase 4: Partes (aproveita backend existente)

---

## 12. PRÓXIMOS PASSOS

**Para você avaliar:**

1. Qual layout prefere? (Sidebar ou Grid)
2. Manter modal para quick view ou remover totalmente?
3. Edição inline na página ou manter modal de edição?
4. Implementar Fase 1 agora ou ajustar algo antes?

**Posso começar por:**

- Criar estrutura de `CaseDetailPage.jsx`
- Adicionar rota no `App.jsx`
- Migrar informações básicas do modal
- Estilizar layout escolhido

**Aguardo seu OK para iniciar! 🚀**

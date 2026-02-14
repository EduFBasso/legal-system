# Decisões Arquiteturais Confirmadas

## Legal System - Fase Contatos

**Data:** 14 de fevereiro de 2026  
**Baseado em:** Análise do clinic-system + Feedback da advogada

---

## ✅ Decisões CONFIRMADAS

### 1. Layout Geral

- **Estrutura:** 3 colunas (Menu 200px | Content flex | Sidebar 380px)
- **Inspiração:** clinic-system (padrão comprovado em produção)
- **Responsivo:** Desktop-first (mobile depois)

### 2. Painel de Contatos (Sidebar Direita)

#### Search + Botão Novo

```
┌─────────────────────────────────┐
│ [🔍 Filtrar...] [+ Novo Contato] │  ← Fixos, lado a lado
└─────────────────────────────────┘
```

**Confirmado:**

- ✅ Search e botão na **mesma linha** (otimiza espaço)
- ✅ Container **fixo** no topo (não rola)
- ✅ Input flex-grow, botão 100px fixo
- ✅ Atalho Ctrl+N para novo contato

#### Carregamento de Dados

**Padrão clinic-system:**

- ✅ Carrega **TODOS os contatos** na inicialização da página
- ✅ Filtro via JavaScript em memória (rápido, poucos registros)
- ✅ Ordenação alfabética por `name`

**Justificativa:**

- Modo local: banco pequeno (< 500 contatos esperados)
- Performance excelente sem paginação
- Usuário vê todos os dados instantaneamente
- Não depende de requests adicionais

### 3. Mini-Cards com Foto/Ícone

#### Visual

```
┌──────────────────────────────┐
│ 📷 João Silva      [Cliente]  │
│    CPF: 123.456.789-01       │
│    📱 (11) 99999-9999         │
└──────────────────────────────┘
```

**Confirmado:**

- ✅ **Foto do cliente**: Mini-imagem 40x40px circular (modo local)
- ✅ **Sem foto**: Ícone padrão (👤 PF, 🏢 PJ)
- ✅ **Armazenamento**: `storage/contacts/{id}/photo.jpg`
- ✅ **Upload futuro**: Cropper de imagem, salva local

**Vantagens modo local:**

- Fotos sem custo de hospedagem
- Privacidade total (não sobe internet)
- Rápido (não depende de CDN)

### 4. Acessibilidade (Problema de Visão da Advogada)

**CRÍTICO - Prioridade alta:**

#### Fontes

- ✅ Nome do contato: **16px bold**
- ✅ Dados secundários: **14px regular**
- ✅ Mínimo absoluto: **14px** (nunca menor)
- ✅ Line-height: **1.5** (espaçamento respirável)

#### Contraste

- ✅ **WCAG AAA** em todos os textos
- ✅ Texto principal: contraste 16:1
- ✅ Texto secundário: contraste 8:1
- ✅ Borders visíveis (não só outline)

#### Espaçamento

- ✅ Padding cards: **16px** (generoso)
- ✅ Gap entre cards: **12px**
- ✅ Borders: **2px** normal, **3px** selecionado

#### Feedback Visual

- ✅ Hover com **lift effect** (translateY -2px)
- ✅ Borda grossa quando selecionado (3px)
- ✅ Sombra pronunciada (não sutil demais)

**Fonte escolhida (sugestão):**

```css
font-family:
  "Inter",
  "Segoe UI",
  -apple-system,
  system-ui,
  sans-serif;
```

- Open-source
- Otimizada para legibilidade em telas
- Excelente em tamanhos pequenos/médios

### 5. Sistema de Temas

**Implementar agora:**

- ✅ **Tema claro** (padrão)
- ✅ Variáveis CSS preparadas
- ✅ Cores inspiradas no clinic-system (advogada aprovou)

**Adiar:**

- ❌ Tema escuro (dark mode)
- ❌ Seletor de temas customizados

**Estrutura:**

```css
:root {
  /* tema claro */
}
[data-theme="dark"] {
  /* preparado para futuro */
}
```

### 6. Comportamento de Clique no Card

**Opção escolhida: Abre na área central**

```
1. Usuário clica no card "João Silva"
2. Card fica com borda azul grossa (selected)
3. Área central mostra detalhes completos
4. Sidebar continua visível (pode consultar outros)
5. Scroll automático se card não estiver visível (padrão clinic)
```

**NÃO fazer:**

- ❌ Modal por cima (esconde tudo)
- ❌ Página separada (perde contexto)
- ❌ Drawer lateral (confuso)

### 7. Formulário (Criar/Editar)

**Abrir onde:**

- ✅ Área central (mesmo local da visualização)
- ✅ Botão "Cancelar" volta para visualização
- ✅ Botão "Salvar" → atualiza card + mostra visualização

**Validação:**

- ✅ Em tempo real (onChange)
- ✅ Feedback visual imediato
- ✅ Mensagens de erro **claras e grandes** (acessibilidade)

### 8. Armazenamento de Fotos (Modo Local)

**Estrutura de pastas:**

```
legal-system/
└── storage/
    └── contacts/
        ├── 1/
        │   └── photo.jpg
        ├── 2/
        │   └── photo.jpg
        └── ...
```

**Backend (Django):**

```python
# settings.py
MEDIA_ROOT = BASE_DIR / 'storage'
MEDIA_URL = '/media/'

# models.py (futuro campo)
photo = models.ImageField(upload_to='contacts/%Y/%m/%d/', blank=True, null=True)
```

**Frontend:**

- Exibe: `<img src="/media/contacts/1/photo.jpg" />`
- Upload: `<input type="file" accept="image/*" />`
- Preview antes de salvar
- Redimensiona para 200x200px (economiza espaço)

---

## 🎯 Resumo das Confirmações

| Decisão                  | Escolha                           |
| ------------------------ | --------------------------------- |
| **Search + Botão Novo**  | ✅ Lado a lado, fixos no topo     |
| **Carregamento inicial** | ✅ Todos os contatos de uma vez   |
| **Foto nos cards**       | ✅ Sim, 40x40px circular          |
| **Sem foto**             | ✅ Ícone padrão (👤/🏢)           |
| **Acessibilidade**       | ✅ Fontes grandes, alto contraste |
| **Tema**                 | ✅ Claro (escuro no futuro)       |
| **Click no card**        | ✅ Abre na área central           |
| **Modal**                | ❌ Não usar                       |
| **Armazenamento foto**   | ✅ Local (storage/contacts/)      |
| **Padrão de referência** | ✅ clinic-system                  |

---

## 📋 Próximos Passos Imediatos

### 1. Backend API REST (Prioridade)

- Criar serializers para Contact
- Criar viewsets (list, retrieve, create, update)
- Configurar CORS para localhost
- Endpoint de upload de foto

### 2. Frontend - Estrutura Base

- Criar componentes: Header, Navigation, ContactList
- Implementar SearchBox + Botão Novo
- Criar ContactCard (versão compacta)
- Sistema de temas (variáveis CSS)

### 3. Frontend - Funcionalidades

- Integrar com API
- Filtro em tempo real
- Click no card → visualização
- Formulário criar/editar
- Upload de foto

### 4. Acessibilidade

- Testar com simulador de baixa visão
- Validar contraste (WCAG AAA)
- Testar navegação por teclado
- Feedback da advogada

---

## ✅ Validação Final

**Tudo confirmado e alinhado com:**

1. ✅ Padrão clinic-system (comprovado em produção)
2. ✅ Necessidades da advogada (acessibilidade visual)
3. ✅ Modo local (fotos, sem hospedagem)
4. ✅ Simplicidade (um degrau por vez)

**Pronto para começar implementação!** 🚀

# Layout Specification - Legal System

## Interface do Usuário - Planejamento Visual

**Data:** 14 de fevereiro de 2026  
**Fase:** Contatos (primeiro módulo)  
**Filosofia:** Um degrau por vez, simplicidade, modo local

---

## 1. Estrutura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                 │
│  Logo/Nome        |    Search (opcional)    |   Login/User      │
└─────────────────────────────────────────────────────────────────┘
┌────────────┬────────────────────────────────┬───────────────────┐
│            │                                │                   │
│   MENU     │         MAIN CONTENT           │   MINI-CARDS      │
│   (Nav)    │      (Área de trabalho)        │   (Contatos)      │
│            │                                │   + Search        │
│  Fixa      │        Scroll                  │   Fixa + Scroll   │
│            │                                │                   │
│  200px     │         Flex-grow              │     350-400px     │
│            │                                │                   │
└────────────┴────────────────────────────────┴───────────────────┘
```

---

## 2. Header (Topo Fixo)

### Layout Proposto

```
┌─────────────────────────────────────────────────────────────────┐
│ 📁 Legal-System          🔍 [Search global?]      👤 Olá, Maria │
│                                                    [⚙️] [🔓]     │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes

#### Esquerda: Logo/Nome do Sistema

```tsx
<div className="logo">
  📁 Legal-System
  {/* ou <img src="logo.svg" /> */}
</div>
```

#### Centro: Search Global (OPCIONAL - Avaliar necessidade)

**Opção A:** Search no header (busca global - qualquer módulo)

```tsx
<input
  type="search"
  placeholder="Buscar em todo o sistema..."
  className="global-search"
/>
```

**Opção B:** Search específico no painel de Contatos (RECOMENDADO)

- Deixar header limpo
- Search fica fixo no topo do painel direito (mais contextual)

**Decisão sugerida:** Opção B - Search no painel de contatos

#### Direita: User Info + Login

**Modo Local Simples:**

```tsx
<div className="user-info">
  <span>Olá, Maria Silva</span>
  <button>⚙️</button> {/* Configurações */}
  <button>🔓</button> {/* Sair */}
</div>
```

**Login simples:**

- Tela inicial: Email + Senha
- Salvar sessão em `localStorage`
- Sem recuperação de senha (modo local)
- Timeout de sessão: 8 horas (configurável)

### Dimensões

- Altura: `60px`
- Background: `#ffffff` ou `#f8f9fa` (claro)
- Border-bottom: `1px solid #dee2e6`
- Position: `fixed` (sempre visível ao fazer scroll)

---

## 3. Main Layout - 3 Colunas

### Distribuição de Espaço

| Coluna         | Largura     | Comportamento | Conteúdo                      |
| -------------- | ----------- | ------------- | ----------------------------- |
| **Menu (Nav)** | `200-240px` | Fixa          | Navegação principal           |
| **Content**    | `flex-grow` | Scroll        | Formulários, detalhes, views  |
| **Sidebar**    | `350-400px` | Fixa + Scroll | Mini-cards + Search + Filtros |

### Responsivo (Mobile)

- < 768px: Sidebar se torna drawer (abre por cima)
- < 480px: Menu vira bottom nav ou hamburger

---

## 4. Menu de Navegação (Esquerda)

### Estrutura

```
┌──────────────┐
│  MENU        │
├──────────────┤
│ 📋 Dashboard │  ← Resumo geral
│ 👥 Contatos  │  ← Ativo (destaque visual)
│ ⚖️ Processos  │
│ 📅 Agenda    │
│ 📄 Documentos│
│ 📊 Relatórios│
│              │
│ ─────────    │
│ ⚙️ Config    │
└──────────────┘
```

### Componente MenuItem

```tsx
<nav className="sidebar-nav">
  <MenuItem
    icon="👥"
    label="Contatos"
    active={true}
    onClick={navigate("/contacts")}
  />
  <MenuItem
    icon="⚖️"
    label="Processos"
    disabled={true} // Ainda não implementado
  />
  {/* ... */}
</nav>
```

### Visual States

- **Normal:** Fundo transparente, texto cinza
- **Hover:** Fundo cinza claro (#f1f3f5)
- **Active:** Fundo azul (#e3f2fd), texto azul (#1976d2), borda esquerda 4px
- **Disabled:** Opacidade 50%, cursor not-allowed

### Dimensões

- Largura: `200px` (fixa)
- Padding item: `12px 16px`
- Gap entre itens: `4px`
- Border-radius: `6px`

---

## 5. Painel de Contatos (Direita) - Mini-Cards

### Layout do Painel ✅ CONFIRMADO

```
┌───────────────────────────────────┐
│  🔍 [Filtrar contato...] [+ Novo] │  ← Search + Botão FIXOS (lado a lado)
│  ───────────────────────────────  │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 📷 João Silva      [Cliente] │ │  ← Mini-card 1 (com foto)
│  │ CPF: 123.456.789-01         │ │
│  │ 📱 (11) 99999-9999           │ │
│  └─────────────────────────────┘ │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 🏢 Tech Solutions       [PJ] │ │  ← Mini-card 2 (sem foto = ícone)
│  │ CNPJ: 12.345.678/0001-99    │ │
│  │ 📧 contato@tech.com          │ │
│  └─────────────────────────────┘ │
│                                   │
│    ... scroll (todos carregados) │
│                           │
│  [+ Novo Contato]         │  ← Botão fixo no fim
└───────────────────────────┘
```

### Search Box (Topo Fixo)

```tsx
<div className="contacts-search">
  <input
    type="search"
    placeholder="🔍 Filtrar contato..."
    onChange={handleSearch}
    autoFocus
  />
</div>
```

**Comportamento:**

- Busca em tempo real (debounce 300ms)
- Busca em: `name`, `document_number`, `email`, `phone`, `mobile`
- Case-insensitive
- Remove acentos para comparação
- Scroll automático para primeiro resultado

### Filtros Rápidos (Opcional)

```tsx
<div className="quick-filters">
  <Select
    placeholder="Tipo"
    options={['Todos', 'Cliente', 'Parte Contrária', 'Testemunha']}
  />
  <Select
    placeholder="Estado"
    options={['Todos', 'SP', 'RJ', 'MG', ...]}
  />
</div>
```

**Decisão:** Implementar **apenas se necessário**. Começar só com search.

### Ordenação

- Por padrão: **Alfabética (A-Z)** pelo campo `name`
- Futuramente: Dropdown para mudar ordenação
  - Alfabética A-Z
  - Alfabética Z-A
  - Mais recente
  - Mais antigo

---

## 6. Mini-Card Design ✅ CONFIRMADO

### Variante A: Compacto (Com foto/ícone) - PADRÃO CLINIC-SYSTEM

```
┌─────────────────────────────────────┐
│ 📷 João Silva               [Cliente] │  ← Foto (modo local) + Badge
│    CPF: 123.456.789-01               │  ← Documento formatado
│    📱 (11) 99999-9999                 │  ← Contato principal
└─────────────────────────────────────┘
```

**Foto/Ícone (esquerda superior):**

- Se tiver foto salva localmente: exibe mini-imagem (40x40px, circular)
- Se NÃO tiver foto: exibe ícone padrão por tipo:
  - 👤 Pessoa Física
  - 🏢 Pessoa Jurídica
- Modo local permite salvar fotos em `storage/contacts/{id}/photo.jpg`

**Acessibilidade (problema de visão da advogada):**

- ✅ Fonte nome: **16px bold** (maior que padrão)
- ✅ Fonte dados: **14px regular** (legível)
- ✅ Contraste: AAA (WCAG)
- ✅ Espaçamento: `padding: 16px` (generoso)
- ✅ Line-height: `1.5` (respiração entre linhas)
- ✅ Sem textos < 14px

### Variante B: Detalhado (Para view expandida)

```
┌─────────────────────────────────────┐
│ 👤 João Silva                [Cliente] │
│ CPF: 123.456.789-01                │
├─────────────────────────────────────┤
│ 📧 joao@email.com                   │
│ 📱 (11) 99999-9999                   │
│ 📞 (11) 3456-7890                    │
├─────────────────────────────────────┤
│ 📍 São Paulo/SP                      │
│ Av Paulista, 1578 - Bela Vista      │
├─────────────────────────────────────┤
│ 💼 3 processos ativos               │  ← Futuramente
│                                     │
│ [👁️ Ver Detalhes]  [✏️ Editar]      │
└─────────────────────────────────────┘
```

**Decisão inicial:** Variante A (compacto) para lista. Variante B quando clicar em "Ver".

### Estados Visuais (Inspirado no clinic-system + Acessibilidade)

```css
/* Normal */
background: #ffffff;
border: 2px solid #dee2e6; /* Borda mais grossa = melhor visibilidade */
border-radius: 8px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
transition: all 0.2s ease;

/* Hover */
border-color: #1976d2;
box-shadow: 0 3px 8px rgba(25, 118, 210, 0.2);
cursor: pointer;
transform: translateY(-2px); /* Lift effect */

/* Selected/Active (cliente sendo visualizado) */
background: #e3f2fd;
border: 3px solid #1976d2; /* Borda ainda mais grossa quando selecionado */
box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.15);
```

**Acessibilidade adicional:**

- Border sempre visível (não só outline no focus)
- Contraste de cores testado (WCAG AAA)
- Hover com lift effect (feedback visual claro)
- Selected com borda 3px (muito destacado)

### Badges de Tipo

| Tipo              | Cor      | Ícone |
| ----------------- | -------- | ----- |
| Cliente           | Verde    | 👤    |
| Parte Contrária   | Vermelho | ⚔️    |
| Testemunha        | Amarelo  | 👁️    |
| Advogado Parceiro | Azul     | ⚖️    |
| Outro             | Cinza    | 📋    |

### Dimensões

- Width: `100%` (do container pai)
- Padding: `16px`
- Gap interno: `8px`
- Margin-bottom: `12px` (entre cards)

---

## 7. Área Central (Content) - Detalhes/Formulários

### Estados da Área Central

#### Estado 1: Vazio (Inicial)

```
┌─────────────────────────────────┐
│                                 │
│         📋                      │
│   Selecione um contato          │
│   para ver os detalhes          │
│                                 │
│   ou                            │
│                                 │
│   [+ Criar Novo Contato]        │
│                                 │
└─────────────────────────────────┘
```

#### Estado 2: Visualização de Contato

```
┌─────────────────────────────────┐
│ [← Voltar]         [✏️ Editar]  │
│                                 │
│ 👤 João Silva                   │
│ Cliente • Pessoa Física         │
│                                 │
│ ━━━ Identificação ━━━           │
│ CPF: 123.456.789-01             │
│                                 │
│ ━━━ Contatos ━━━                │
│ 📧 joao@email.com               │
│ 📱 (11) 99999-9999              │
│ 📞 (11) 3456-7890               │
│                                 │
│ ━━━ Endereço ━━━                │
│ 📍 Av Paulista, 1578            │
│    Sala 1201 - Bela Vista       │
│    São Paulo/SP                 │
│    CEP: 01310-100               │
│                                 │
│ ━━━ Observações ━━━             │
│ Cliente desde 2020...           │
│                                 │
│ ━━━ Processos Relacionados ━━━  │
│ [Lista de processos]            │  ← Futuramente
│                                 │
└─────────────────────────────────┘
```

#### Estado 3: Formulário de Criação/Edição

```
┌─────────────────────────────────┐
│ [✕ Cancelar]        [✓ Salvar]  │
│                                 │
│ Novo Contato                    │
│                                 │
│ ━━━ Identificação ━━━           │
│ Tipo: [▼ Cliente]               │
│ Natureza: [▼ Pessoa Física]     │
│ Nome: [________________]        │
│ CPF: [___.___.___-__]           │
│                                 │
│ ━━━ Contatos ━━━                │
│ Email: [________________]       │
│ Celular: (__) _____-____        │
│ Telefone: (__) ____-____        │
│                                 │
│ ━━━ Endereço ━━━                │
│ CEP: _____-___  [Buscar]        │
│ Logradouro: [______________]    │
│ Número: [_____]                 │
│ ...                             │
│                                 │
│ [Cancelar]  [Salvar]            │
└─────────────────────────────────┘
```

---

## 8. Fluxo de Interação

### Cenário 1: Visualizar Contato

```
1. Usuário digita no search "joão"
2. Lista filtra em tempo real
3. Primeiro resultado fica destacado (opcional)
4. Usuário clica no card "João Silva"
5. Card ficava com borda azul (selected)
6. Área central mostra detalhes de João
7. Scroll automático se necessário
```

### Cenário 2: Criar Novo Contato

```
1. Usuário clica "[+ Novo Contato]"
2. Área central mostra formulário vazio
3. Painel direito continua visível (pode consultar outro contato)
4. Usuário preenche formulário
5. Clica "Salvar"
6. Mini-card aparece na lista (animação fade-in)
7. Scroll automático para novo card
8. Card fica selecionado (destacado)
9. Área central mostra detalhes do novo contato
```

### Cenário 3: Editar Contato

```
1. Usuário visualiza contato "João Silva"
2. Clica "Editar"
3. Área central vira formulário (pré-preenchido)
4. Usuário altera campos
5. Clica "Salvar"
6. Mini-card é atualizado (animação pulse)
7. Volta para visualização
8. Scroll para o card atualizado
```

---

## 9. Responsividade

### Desktop (> 1200px)

```
┌────┬────────────┬──────┐
│Menu│  Content   │Cards │
│200 │   flex     │ 380  │
└────┴────────────┴──────┘
```

### Tablet (768px - 1200px)

```
┌────┬────────────┬──────┐
│Menu│  Content   │Cards │
│180 │   flex     │ 320  │
└────┴────────────┴──────┘
```

### Mobile (< 768px)

```
┌──────────────────────┐
│      Content         │
│    (Full width)      │
│                      │
│  Cards = Drawer      │  ← Abre por cima
│  (desliza da direita)│
└──────────────────────┘
┌──────────────────────┐
│  [☰] [🏠] [👥] [⚖️]  │  ← Bottom nav
└──────────────────────┘
```

**Prioridade inicial:** Desktop. Mobile depois da versão web funcional.

---

## 10. Cores e Tema

### Paleta Principal

```css
:root {
  /* Cores primárias */
  --primary: #1976d2; /* Azul principal */
  --primary-light: #e3f2fd; /* Azul claro (backgrounds) */
  --primary-dark: #1565c0; /* Azul escuro (hover) */

  /* Cinzas */
  --gray-50: #f8f9fa;
  --gray-100: #f1f3f5;
  --gray-200: #e9ecef;
  --gray-300: #dee2e6;
  --gray-700: #495057;
  --gray-900: #212529;

  /* Semânticas */
  --success: #28a745; /* Verde - Cliente */
  --danger: #dc3545; /* Vermelho - Parte Contrária */
  --warning: #ffc107; /* Amarelo - Testemunha */
  --info: #17a2b8; /* Azul - Advogado */

  /* Backgrounds */
  --bg-body: #ffffff;
  --bg-gray: #f8f9fa;

  /* Borders */
  --border: #dee2e6;

  /* Sombras */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 2px 6px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

---

## 11. Decisões de Implementação

### Fase 1: MVP (Mínimo Viável)

✅ Implementar AGORA:

- Header básico (logo + user info)
- Menu de navegação (só "Contatos" ativo)
- Painel de contatos com search
- Mini-cards compactos
- Área central: visualização + formulário
- Layout 3 colunas desktop

❌ DEPOIS:

- Search no header (global)
- Filtros avançados
- Responsividade mobile
- Animações complexas
- Temas (dark mode)

### Fase 2: Refinamento

- Scroll automático para card selecionado
- Animações (fade-in, pulse, highlight)
- Validação visual de formulários
- Loading states
- Mensagens toast

### Fase 3: Mobile

- Layout responsivo
- Touch gestures
- Bottom navigation
- Drawer lateral

---

## 12. Tecnologias Frontend (Sugeridas)

### React + TypeScript

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── ContentArea.tsx
│   │   ├── contacts/
│   │   │   ├── ContactCard.tsx
│   │   │   ├── ContactList.tsx
│   │   │   ├── ContactDetail.tsx
│   │   │   └── ContactForm.tsx
│   │   └── common/
│   │       ├── SearchBox.tsx
│   │       ├── Button.tsx
│   │       └── Badge.tsx
│   ├── pages/
│   │   └── ContactsPage.tsx
│   ├── styles/
│   │   ├── variables.css
│   │   ├── layout.css
│   │   └── components/
│   └── utils/
│       ├── formatters.ts
│       └── events.ts
```

### Styling

- **CSS Modules** para componentes específicos
- **Tailwind CSS** para spacing/flex rápido (opcional)
- **Variáveis CSS** para tema consistente

---

## 13. Próximos Passos

### Imediato (agora)

1. ✅ Confirmar layout com você
2. ✅ Ajustar se necessário
3. 🔨 Criar estrutura de pastas frontend
4. 🔨 Implementar Header básico
5. 🔨 Implementar Navigation menu

### Em seguida

6. 🔨 Implementar ContactList + ContactCard
7. 🔨 Implementar SearchBox
8. 🔨 Conectar com API (quando pronta)
9. 🔨 Implementar ContactDetail
10. 🔨 Implementar ContactForm

### Depois

11. Scroll automático
12. Animações
13. Validações
14. Loading states

---

## 14. Perguntas para Definir

### 1. Search Position

**Opção A:** Header (busca global em todo sistema)  
**Opção B:** Painel de contatos (busca apenas em contatos)  
**Sugestão:** Opção B - mais contextual e simples

### 2. Criar Novo Contato

**Opção A:** Botão fixo no topo do painel  
**Opção B:** Botão flutuante (FAB) no canto inferior direito  
**Opção C:** Botão no fim da lista de cards  
**Sugestão:** Opção A + atalho Ctrl+N

### 3. Mobile Priority

**Opção A:** Fazer desktop primeiro, mobile depois  
**Opção B:** Fazer mobile-first desde o início  
**Sugestão:** Opção A - desktop primeiro (modo local)

### 4. Modo Escuro (Dark Mode)

**Opção A:** Implementar desde o início  
**Opção B:** Deixar para versão futura  
**Sugestão:** Opção B - foco na funcionalidade

---

## Resumo Executivo

**Layout escolhido:**

- Header simples: Logo | User
- Search: No painel de contatos (não header)
- 3 colunas: Menu (200px) | Content (flex) | Cards (380px)
- Mini-cards ordenados alfabeticamente
- Área central: Empty state → View → Form

**Próxima ação:** Confirmar layout e começar implementação do frontend! 🚀

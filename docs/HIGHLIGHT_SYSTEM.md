# Sistema de Destaque (Highlight) - Guia de Uso

Sistema unificado para efeitos de brilho pulsante em componentes. Centraliza a lógica de destaque visual com classes CSS reutilizáveis.

## 📦 Arquivos

- **Hook**: `src/hooks/useHighlight.js`
- **CSS Global**: `src/styles/highlight.css`
- **Import no App**: `src/App.jsx`

## 🎯 Classes CSS Disponíveis

### Verde (Padrão/Sucesso)

- `.pulse-active` - Card grande com brilho verde
- `.pulse-active-mini` - Card pequeno (sidebar) com brilho verde
- `.highlight-process-found` - Compatibilidade (histórico)

### Vermelho (Urgente)

- `.pulse-active-urgent` - Brilho vermelho para prioridade alta

### Azul (Informação)

- `.pulse-active-info` - Brilho azul para informações

---

## 📖 Exemplos de Uso

### 1. Uso Básico - Ativar/Desativar Manual

```jsx
import { useHighlight } from "../hooks/useHighlight";

function MyComponent() {
  const highlight = useHighlight();

  return (
    <div className={`card ${highlight.className}`}>
      <button onClick={highlight.activate}>Destacar</button>
      <button onClick={highlight.deactivate}>Remover</button>
    </div>
  );
}
```

### 2. Com Duração Automática (5 segundos)

```jsx
import { useHighlight } from "../hooks/useHighlight";

function MyComponent() {
  const highlight = useHighlight({ duration: 5000 });

  const handleNewItem = () => {
    // Ativa e desativa automaticamente após 5s
    highlight.activate();
  };

  return <div className={`card ${highlight.className}`}>{/* Conteúdo */}</div>;
}
```

### 3. Classe CSS Customizada

```jsx
import { useHighlight } from "../hooks/useHighlight";

function UrgentNotification() {
  const highlight = useHighlight({
    className: "pulse-active-urgent",
    duration: 10000, // 10 segundos
  });

  return (
    <div className={`notification ${highlight.className}`}>
      Notificação urgente!
    </div>
  );
}
```

### 4. Mini-Cards (Sidebar)

```jsx
import { useHighlight } from "../hooks/useHighlight";

function SidebarCard({ notification }) {
  const highlight = useHighlight({
    className: "pulse-active-mini",
    initialState: !notification.read, // Já começa destacado se não lido
  });

  const handleClick = () => {
    markAsRead(notification.id);
    highlight.deactivate(); // Remove destaque ao clicar
  };

  return (
    <div className={`mini-card ${highlight.className}`} onClick={handleClick}>
      {notification.title}
    </div>
  );
}
```

### 5. Controle por Propriedade (Como no Histórico)

```jsx
import { useHighlightClass } from "../hooks/useHighlight";

function SearchHistoryCard({ search, highlightProcessSearch }) {
  // Versão simplificada - só retorna a classe
  const highlightClass = useHighlightClass(
    highlightProcessSearch,
    "highlight-process-found",
  );

  return <div className={`card ${highlightClass}`}>{/* Conteúdo */}</div>;
}
```

### 6. Toggle (Ligar/Desligar)

```jsx
import { useHighlight } from "../hooks/useHighlight";

function TestComponent() {
  const highlight = useHighlight();

  return (
    <div>
      <div className={`card ${highlight.className}`}>Card com destaque</div>
      <button onClick={highlight.toggle}>
        {highlight.isHighlighted ? "Desligar ✨" : "Ligar ⭕"}
      </button>
    </div>
  );
}
```

### 7. Ativar Temporariamente ao Receber Nova Notificação

```jsx
import { useHighlight } from "../hooks/useHighlight";
import { useEffect } from "react";

function NotificationsList({ notifications }) {
  const highlight = useHighlight({ duration: 8000 });

  useEffect(() => {
    // Quando receber nova notificação, destacar por 8s
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.read) {
        highlight.activate();
      }
    }
  }, [notifications]);

  return (
    <div className={`notifications-container ${highlight.className}`}>
      {notifications.map((n) => (
        <NotificationCard key={n.id} {...n} />
      ))}
    </div>
  );
}
```

---

## 🔧 API do Hook

### `useHighlight(options)`

**Parâmetros:**

```js
{
  duration: number,        // ms (0 = permanente, padrão: 0)
  initialState: boolean,   // Estado inicial (padrão: false)
  className: string        // Classe CSS (padrão: 'pulse-active')
}
```

**Retorna:**

```js
{
  isHighlighted: boolean,  // Se está destacado
  activate: (duration?) => void,   // Ativa (duração opcional)
  deactivate: () => void,          // Desativa
  toggle: () => void,              // Alterna
  className: string                // Classe CSS atual
}
```

### `useHighlightClass(condition, className)`

Versão simplificada que retorna apenas a classe CSS.

**Parâmetros:**

- `condition` (boolean): Se deve aplicar destaque
- `className` (string): Nome da classe (padrão: 'pulse-active')

**Retorna:** string (classe CSS ou vazio)

---

## 🎨 Variações de Estilo

| Classe                    | Cor      | Uso Recomendado             |
| ------------------------- | -------- | --------------------------- |
| `pulse-active`            | Verde    | Sucesso, encontrado, novo   |
| `pulse-active-mini`       | Verde    | Sidebar, cards pequenos     |
| `pulse-active-urgent`     | Vermelho | Alta prioridade, urgente    |
| `pulse-active-info`       | Azul     | Informação, destaque neutro |
| `highlight-process-found` | Verde    | Histórico (legado)          |

---

## ♿ Acessibilidade

O sistema respeita a preferência do usuário por movimento reduzido:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animações são desabilitadas automaticamente */
}
```

---

## 🔄 Migração de Código Existente

### Antes (SearchHistoryCard)

```jsx
const cardClassName = highlightProcessSearch
  ? "search-history-card highlight-process-found"
  : "search-history-card";
```

### Depois (Com Hook)

```jsx
import { useHighlightClass } from "../hooks/useHighlight";

const highlightClass = useHighlightClass(highlightProcessSearch);

return (
  <div className={`search-history-card ${highlightClass}`}>{/* ... */}</div>
);
```

---

## 📋 Próximos Passos de Refatoração

1. ✅ Criar hook `useHighlight`
2. ✅ Criar CSS global `highlight.css`
3. ✅ Importar no `App.jsx`
4. 🔄 Refatorar `NotificationsSummary` (em andamento)
5. ⏳ Refatorar `NotificationsPage`
6. ⏳ Refatorar `SearchHistoryCard`
7. ⏳ Remover CSS duplicado dos arquivos individuais

---

## 💡 Benefícios

✅ **Código centralizado** - Uma fonte, múltiplos usos  
✅ **Fácil manutenção** - Alterar em um lugar, reflete em todos  
✅ **Flexível** - Duração configurável, classes customizáveis  
✅ **Performance** - Animações só rodam quando necessário  
✅ **Acessível** - Respeita preferências do usuário  
✅ **Type-safe** - Documentação completa e exemplos

---

## 🐛 Troubleshooting

### Animação não aparece

- Verificar se `highlight.css` está importado no `App.jsx`
- Confirmar que a classe está sendo aplicada (DevTools)

### Conflito com CSS existente

- Usar `!important` (já está no CSS global)
- Verificar ordem de importação dos arquivos CSS

### Timer não limpa

- Hook já gerencia cleanup automaticamente
- Componente deve usar o hook corretamente (não criar múltiplas instâncias)

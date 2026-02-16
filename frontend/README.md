# Legal System - Frontend

> React 19 + Vite 7 SPA com design acessível e zero dependências externas para UI

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Desenvolvimento (http://localhost:5173)
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📦 Stack

- **React** 19.2.0 - UI library
- **Vite** 7.3.1 - Build tool e dev server
- **Node.js** 20.20.0 LTS - JavaScript runtime
- **ESLint** - Code linting

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
src/
├── components/       # React components
│   ├── common/       # (Planejado) Componentes reutilizáveis
│   ├── contacts/     # Componentes específicos de contatos
│   │   ├── ContactCard.jsx
│   │   ├── ContactCard.css
│   │   ├── ContactDetailModal.jsx
│   │   └── ContactDetailModal.css
│   ├── Header.jsx
│   ├── Menu.jsx
│   ├── Modal.jsx     # Modal genérico (3 tamanhos)
│   ├── MainContent.jsx
│   ├── Sidebar.jsx
│   └── SettingsModal.jsx
│
├── contexts/         # React Context API
│   └── SettingsContext.jsx  # Global settings + localStorage
│
├── pages/            # Page-level components
│   ├── ContactsPage.jsx
│   └── ContactsPage.css
│
├── services/         # External communication
│   └── api.js        # Backend API client
│
├── utils/            # Helper functions
│   └── masks.js      # Input masks (CPF, CNPJ, Phone, CEP)
│
├── assets/           # Static assets
├── App.jsx           # Root component
├── App.css
├── main.jsx          # Entry point
├── index.css         # Global styles + CSS reset
└── palette.css       # Design system (CSS Variables)
```

## 🎨 Design System

### CSS Variables (palette.css)

```css
/* Colors */
--color-primary: #3b82f6; /* Blue */
--color-primary-dark: #2563eb;
--color-success: #10b981; /* Green */
--color-danger: #dc2626; /* Red */
--color-warning: #f59e0b; /* Orange */

/* Text */
--color-text: #222;
--color-text-muted: #6b7280;
--color-heading: #111827;

/* UI */
--color-bg: #f7f7f7;
--color-border: #e0e0e0;
--color-border-focus: #3b82f6;

/* Typography */
--font-text: 16px;
--font-title: 24px;
--font-title-md: 18px;
```

### Princípios de Design

1. **Acessibilidade First**
   - Fontes grandes (16px mínimo, 24px títulos)
   - Alto contraste (WCAG AA)
   - Focus states visíveis
   - Labels descritivos

2. **Zero Dependências de UI**
   - Sem bibliotecas de componentes (Material, Ant, etc)
   - Ícones: Emojis (sem Font Awesome, Phosphor, etc)
   - Full control sobre CSS e comportamento

3. **Mobile-First** (planejado)
   - Responsive design
   - Touch-friendly (botões grandes)

## 🧩 Componentes Principais

### Modal (Generic)

Modal reutilizável com 3 tamanhos.

**Props**:

- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `size`: 'small' | 'medium' | 'large'
- `children`: ReactNode

**Uso**:

```jsx
<Modal isOpen={isOpen} onClose={onClose} title="Título" size="large">
  <p>Conteúdo do modal</p>
</Modal>
```

### ContactCard

Mini-card para sidebar de contatos.

**Props**:

- `contact`: Contact object (name, person_type, contact_type_display, photo_thumb)
- `isActive`: boolean
- `onClick`: function

**Features**:

- Foto 40x40px ou ícone (👤 PF / 🏢 PJ)
- Nome destacado
- Tipo de contato (badge)
- Highlight em hover e selected

### ContactDetailModal

Modal híbrido VIEW/EDIT/CREATE para contatos.

**Props**:

- `contactId`: number | null (null = CREATE mode)
- `isOpen`: boolean
- `onClose`: function
- `onContactUpdated`: function(contact, wasCreating, wasDeleted)

**Modes**:

1. **VIEW**: Exibição organizada em seções
2. **EDIT**: Campos editáveis com validação
3. **CREATE**: Formulário vazio para novo contato

**Features**:

- Máscaras em tempo real (CPF, CNPJ, Phone, CEP)
- Validação: Nome obrigatório
- Field mapping: Frontend ↔ Backend (document ↔ document_number, etc)
- Exclusão com senha proteção
- Auto-close após CREATE

### SettingsModal

Modal de configurações globais.

**Features**:

- Toggle: "Exibir campos vazios"
- Input: Senha para exclusão
- Persistência: localStorage
- Validação: Não salva se cancelar

## 🔧 Utilities

### masks.js

Zero-dependency input masks e validações.

**Functions**:

```javascript
// Formatação
maskCPF(value); // 000.000.000-00
maskCNPJ(value); // 00.000.000/0000-00
maskPhone(value); // (00) 0000-0000 ou (00) 00000-0000
maskCEP(value); // 00000-000
maskDocument(value, type); // CPF ou CNPJ automático
maskProcessNumber(value); // 0000000-00.0000.0.00.0000 (CNJ)

// Limpeza
unmask(value); // Remove formatação

// Validação
isValidCPF(cpf); // true/false (algoritmo completo)
isValidCNPJ(cnpj); // true/false (algoritmo completo)
```

**Características**:

- Formatação em tempo real durante digitação
- Auto-detecção (fixo vs celular)
- Validação com dígitos verificadores
- Zero dependências externas

### api.js

Cliente HTTP para comunicação com backend.

**API**:

```javascript
contactsAPI.getAll(params); // GET /api/contacts/
contactsAPI.getById(id); // GET /api/contacts/:id/
contactsAPI.create(data); // POST /api/contacts/
contactsAPI.update(id, data); // PUT /api/contacts/:id/
contactsAPI.delete(id); // DELETE /api/contacts/:id/
```

**Features**:

- Error handling centralizado
- Content-Type: application/json
- Tratamento de 204 No Content (DELETE)

## 🎯 State Management

### SettingsContext

Global settings com localStorage persistence.

**State**:

```javascript
{
  showEmptyFields: false,     // Toggle para exibir campos vazios
  deletePassword: ''          // Senha para exclusão
}
```

**Hooks**:

```javascript
const { settings, updateSettings } = useSettings();
```

### Local State Pattern

Cada página gerencia seu próprio estado:

```javascript
// ContactsPage
const [contacts, setContacts] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
const [selectedContactId, setSelectedContactId] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);
```

## 📡 Data Flow

### CRUD Flow Example (Contacts)

**CREATE**:

```
User → Form input (masks applied)
     → handleSave (unmask + validate)
     → POST /api/contacts/ (clean data)
     → Backend creates & returns contact
     → Frontend applies masks & adds to list
     → Modal closes
```

**UPDATE**:

```
User → Click Edit button
     → Modal enters EDIT mode
     → Edit fields (masks applied)
     → handleSave (unmask + validate)
     → PUT /api/contacts/:id/ (clean data)
     → Backend updates & returns contact
     → Frontend applies masks & updates list
     → Modal exits EDIT mode
```

**DELETE**:

```
User → Click Delete button
     → Confirmation modal opens
     → If password set: validate
     → DELETE /api/contacts/:id/
     → Backend deletes (204)
     → Frontend removes from list
     → Modals close
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] CRUD: Create, Read, Update, Delete
- [ ] Máscaras: Formatação em tempo real
- [ ] Validações: Nome obrigatório, senha correta
- [ ] Settings: Persistência em localStorage
- [ ] Search: Filtro instantâneo de contatos
- [ ] Responsive: Desktop 1920x1080, 1366x768
- [ ] Acessibilidade: Tab navigation funcional

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Build & Deploy

### Development

```bash
npm run dev
# http://localhost:5173
# Hot Module Replacement (HMR)
```

### Production Build

```bash
npm run build
# Output: dist/
# - index.html
# - assets/*.js (minified)
# - assets/*.css (minified)
```

### Environment Variables

```env
VITE_API_URL=http://127.0.0.1:8000/api  # Backend API URL
```

## 📝 Conventions

### Naming

- **Components**: PascalCase (`ContactCard.jsx`)
- **Files**: camelCase (`api.js`, `masks.js`)
- **CSS Classes**: kebab-case (`contact-card`, `btn-primary`)
- **Functions**: camelCase (`handleSave`, `maskCPF`)

### File Structure

```
ComponentName/
├── ComponentName.jsx
└── ComponentName.css
```

ou

```
ComponentName.jsx
ComponentName.css
```

### Comments

```javascript
// Portuguese for domain logic
// English for technical details
```

## 🔮 Roadmap

### Próximas Refatorações

1. **Componentes Comuns** (components/common/)
   - `ConfirmDialog.jsx` : Modal de confirmação genérico
   - `Toast.jsx` : Notificações temporadas auto-close
   - `FormField.jsx` : Input field reutilizável com label e validação
   - `Button.jsx` : Botões padronizados
   - `Badge.jsx` : Etiquetas de status

2. **TypeScript** (consideração futura)
   - Type safety
   - Better IDE support
   - Menos bugs em runtime

3. **Testing** (consideração futura)
   - Vitest + React Testing Library
   - Unit tests para utils
   - Integration tests para pages

## 📚 Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vite.dev)
- [MDN Web Docs](https://developer.mozilla.org)

---

**Versão**: 0.1.0  
**Status**: 🟢 Em desenvolvimento ativo  
**Última atualização**: 16 de fevereiro de 2026

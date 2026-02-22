# Plano de Testes Manual - Módulo Cases

**Data:** 21/02/2026  
**Módulo:** Cases (Processos)  
**Objetivo:** Validar funcionalidades de CRUD, filtros, estatísticas e interface

---

## Pré-requisitos

### Iniciar Servidores

**Terminal 1 - Backend (Django):**

```powershell
cd C:\dev\legal-system\backend
& C:\dev\legal-system\.venv\Scripts\Activate.ps1
python manage.py runserver
```

- ✅ Servidor deve iniciar em http://127.0.0.1:8000
- ✅ Mensagem: "Starting development server..."

**Terminal 2 - Frontend (Vite):**

```powershell
cd C:\dev\legal-system\frontend
npm run dev
```

- ✅ Servidor deve iniciar em http://localhost:5173
- ✅ Mensagem: "Local: http://localhost:5173/"

---

## PARTE 1: Testes de Backend (API)

### 1.1 Verificar Endpoints Disponíveis

**Acesse no navegador:**

```
http://127.0.0.1:8000/api/cases/
```

**Resultado esperado:**

- ✅ Página DRF (Django REST Framework) carrega
- ✅ Mostra estrutura JSON vazia ou com dados
- ✅ Formulário de filtros visível no topo
- ✅ Botões: "OPTIONS", "GET"

---

### 1.2 Testar Endpoint de Estatísticas

**Acesse no navegador:**

```
http://127.0.0.1:8000/api/cases/stats/
```

**Resultado esperado:**

```json
{
  "total": 0,
  "by_status": [],
  "by_tribunal": [],
  "ativos": 0,
  "inativos": 0
}
```

- ✅ JSON bem formatado
- ✅ Campos: total, by_status, by_tribunal, ativos, inativos

---

### 1.3 Criar Processo via API (POST)

**Na página http://127.0.0.1:8000/api/cases/**

Role até o final e preencha o formulário:

**Dados para Teste 1:**

```json
{
  "numero_processo": "0000001-23.2024.8.26.0100",
  "titulo": "Ação de Cobrança - Teste Manual",
  "tribunal": "TJSP",
  "comarca": "São Paulo",
  "status": "ATIVO",
  "data_distribuicao": "2024-01-15"
}
```

**Ações:**

1. Cole o JSON no campo "Content"
2. Clique em "POST"

**Resultado esperado:**

- ✅ Status: 201 CREATED
- ✅ JSON de resposta contém:
  - `"id": 1`
  - `"numero_processo_formatted": "0000001-23.2024.8.26.0100"`
  - `"numero_processo_unformatted": "00000012320248260100"`
  - `"esta_ativo": true` (se criado recentemente)
  - `"dias_sem_movimentacao": 0 ou null`

---

### 1.4 Criar Segundo Processo (Inativo)

**Dados para Teste 2:**

```json
{
  "numero_processo": "0000002-23.2024.8.26.0200",
  "titulo": "Ação de Despejo - Processo Antigo",
  "tribunal": "STF",
  "comarca": "Brasília",
  "status": "INATIVO",
  "data_distribuicao": "2023-06-10",
  "data_ultima_movimentacao": "2023-08-15"
}
```

**Resultado esperado:**

- ✅ Status: 201 CREATED
- ✅ `"id": 2`
- ✅ `"esta_ativo": false` (>90 dias sem movimento)
- ✅ `"dias_sem_movimentacao": > 90`

---

### 1.5 Criar Terceiro Processo (Com Detalhes)

**Dados para Teste 3:**

```json
{
  "numero_processo": "0000003-23.2024.2.03.0001",
  "titulo": "Ação Trabalhista - Horas Extras",
  "tribunal": "TST",
  "comarca": "Campinas",
  "vara": "1ª Vara do Trabalho",
  "tipo_acao": "Trabalhista",
  "status": "ATIVO",
  "data_distribuicao": "2024-02-01",
  "data_ultima_movimentacao": "2024-02-10",
  "parte_contraria": "Empresa XYZ Ltda",
  "valor_causa": "50000.00",
  "observacoes": "Cliente solicita urgência. Prazo de contestação próximo."
}
```

**Resultado esperado:**

- ✅ Status: 201 CREATED
- ✅ Todos os campos salvos corretamente
- ✅ `valor_causa` como decimal

---

### 1.6 Testar Validação CNJ (Formato Inválido)

**Dados para Teste 4 (ERRO ESPERADO):**

```json
{
  "numero_processo": "123456",
  "titulo": "Processo Inválido",
  "tribunal": "TJSP",
  "comarca": "São Paulo",
  "status": "ATIVO"
}
```

**Resultado esperado:**

- ✅ Status: 400 BAD REQUEST
- ✅ Mensagem de erro contendo "Formato inválido" ou "CNJ"
- ✅ Processo NÃO é criado

---

### 1.7 Testar Filtros

**a) Filtrar por Tribunal:**

```
http://127.0.0.1:8000/api/cases/?tribunal=TJSP
```

- ✅ Retorna apenas processo ID 1 (TJSP)

**b) Filtrar por Status:**

```
http://127.0.0.1:8000/api/cases/?status=ATIVO
```

- ✅ Retorna processos ID 1 e 3 (ATIVO)

**c) Buscar por Número:**

```
http://127.0.0.1:8000/api/cases/?search=0000001
```

- ✅ Retorna processo ID 1

**d) Buscar por Título:**

```
http://127.0.0.1:8000/api/cases/?search=Trabalhista
```

- ✅ Retorna processo ID 3

---

### 1.8 Testar Update (PATCH)

**Acessar:**

```
http://127.0.0.1:8000/api/cases/1/
```

**Atualizar com:**

```json
{
  "titulo": "Ação de Cobrança - ATUALIZADO"
}
```

**Resultado esperado:**

- ✅ Status: 200 OK
- ✅ Título atualizado na resposta
- ✅ `"updated_at"` modificado

---

### 1.9 Testar Soft Delete

**Acessar:**

```
http://127.0.0.1:8000/api/cases/2/
```

**Clicar em "DELETE"** (botão vermelho no topo)

**Resultado esperado:**

- ✅ Status: 204 NO CONTENT
- ✅ Processo ID 2 não aparece mais em `/api/cases/`
- ✅ No admin Django, processo deve estar com `deleted=True`

---

### 1.10 Testar Restore

**Acessar:**

```
http://127.0.0.1:8000/api/cases/2/restore/
```

**Clicar em "POST"**

**Resultado esperado:**

- ✅ Status: 200 OK
- ✅ Processo ID 2 volta a aparecer em `/api/cases/`
- ✅ `"deleted": false` na resposta

---

### 1.11 Testar Statistics (Com Dados)

**Acessar:**

```
http://127.0.0.1:8000/api/cases/stats/
```

**Resultado esperado:**

```json
{
  "total": 3,
  "by_status": [
    ["ATIVO", 2],
    ["INATIVO", 1]
  ],
  "by_tribunal": [
    ["TJSP", 1],
    ["STF", 1],
    ["TST", 1]
  ],
  "ativos": 2,
  "inativos": 1
}
```

---

## PARTE 2: Testes de Frontend (Interface)

### 2.1 Acessar Página de Processos

**Abrir navegador:**

```
http://localhost:5173/cases
```

**Resultado esperado:**

- ✅ Página "Processos" carrega
- ✅ Menu lateral mostra "⚖️ Processos" destacado
- ✅ Header mostra "Processos" + botão "+ Novo Processo"
- ✅ Cards de estatísticas exibem: Total (3), Ativos (2), Inativos (1)
- ✅ 3 cards de processos são exibidos

---

### 2.2 Validar CaseCard (Visualização)

**Para cada card, verificar:**

**Card 1 (TJSP - Ação de Cobrança):**

- ✅ Badge azul "TJSP"
- ✅ Badge verde "ATIVO"
- ✅ Número processo: "0000001-23.2024.8.26.0100"
- ✅ Botão 📋 (copiar) ao lado do número
- ✅ Título: "Ação de Cobrança - ATUALIZADO"
- ✅ 📍 São Paulo
- ✅ Data Distribuição: 15/01/2024

**Card 2 (STF - Ação de Despejo):**

- ✅ Badge vermelho "STF"
- ✅ Badge cinza "INATIVO"
- ✅ Badge "Inativo >90d" (vermelho)
- ✅ Badge indicando dias sem movimento (ex: "150d sem movimento")

**Card 3 (TST - Ação Trabalhista):**

- ✅ Badge laranja "TST"
- ✅ Badge verde "ATIVO"
- ✅ 🏛️ "1ª Vara do Trabalho"
- ✅ Parte Contrária: "Empresa XYZ Ltda"

---

### 2.3 Testar Copiar Número do Processo

**Ação:**

1. Clicar no botão 📋 ao lado do número do processo

**Resultado esperado:**

- ✅ Botão muda para "✅ Copiado!"
- ✅ Após 2 segundos, volta ao original
- ✅ Número copiado na área de transferência (Ctrl+V para testar)

---

### 2.4 Testar Filtros

**a) Filtro de Busca:**

1. Digite "Trabalhista" no campo de busca
2. Clique em "Buscar"

- ✅ Mostra apenas Card 3

**b) Filtro por Tribunal:**

1. Selecione "TJSP"
2. Clique em "Buscar"

- ✅ Mostra apenas Card 1

**c) Filtro por Status:**

1. Selecione "INATIVO"
2. Clique em "Buscar"

- ✅ Mostra apenas Card 2

**d) Limpar Filtros:**

1. Clique em "Limpar"

- ✅ Todos os filtros voltam ao padrão
- ✅ Todos os 3 cards aparecem novamente

---

### 2.5 Abrir Modal de Detalhes (View Mode)

**Ação:**

1. Clicar no Card 3 (Ação Trabalhista)

**Resultado esperado:**

- ✅ Modal abre centralmente
- ✅ Header: "Detalhes do Processo"
- ✅ 4 abas visíveis: 📋 Informações, 👥 Partes (0), 📰 Publicações (0), ⏰ Prazos (0)
- ✅ Aba "Informações" ativa por padrão
- ✅ Modo visualização (não editável)

**Campos exibidos:**

- ✅ Seção "Processo": número, título, tribunal, status
- ✅ Seção "Localização": comarca, vara
- ✅ Seção "Datas": distribuição, última movimentação, dias sem movimento
- ✅ Seção "Partes": parte contrária
- ✅ Seção "Observações": texto completo
- ✅ Botões: "✏️ Editar" e "🗑️ Deletar"

---

### 2.6 Testar Modo Edição

**Ação:**

1. No modal aberto, clicar em "✏️ Editar"

**Resultado esperado:**

- ✅ Modal muda para modo edição
- ✅ Campos se tornam inputs editáveis
- ✅ Botões mudam para "Salvar" e "Cancelar"

**Editar campo:**

1. Alterar "Observações" para: "TESTE EDITADO - Observações atualizadas"
2. Clicar em "Salvar"

**Resultado esperado:**

- ✅ Mensagem: "Processo atualizado com sucesso!" (Toast)
- ✅ Modal volta para modo visualização
- ✅ Observações mostram texto atualizado
- ✅ Estatísticas não mudam (ainda 2 ativos)

---

### 2.7 Testar Abas do Modal

**Aba "👥 Partes":**

1. Clicar na aba "Partes"

- ✅ Mostra: "Nenhuma parte cadastrada"
- ✅ (Funcionalidade de adicionar partes é futura)

**Aba "📰 Publicações":**

1. Clicar na aba "Publicações"

- ✅ Mostra: "🚧 Em construção: Publicações vinculadas ao processo"

**Aba "⏰ Prazos":**

1. Clicar na aba "Prazos"

- ✅ Mostra: "🚧 Em construção: Prazos e agenda do processo"

---

### 2.8 Testar Criação de Novo Processo

**Ação:**

1. Fechar modal (X ou clicar fora)
2. Clicar em "+ Novo Processo" (header)

**Resultado esperado:**

- ✅ Modal abre em modo edição
- ✅ Header: "Novo Processo"
- ✅ Formulário vazio
- ✅ Apenas 1 aba: "📋 Informações"
- ✅ Botão "Salvar"

**Preencher formulário:**

```
Número do Processo: 0000004-23.2025.8.26.0001
Título: Ação de Indenização - Teste Frontend
Tribunal: TJSP
Comarca: Santos
Vara: 2ª Vara Cível
Status: ATIVO
Tipo de Ação: Cível
Data Distribuição: 2025-02-01
Parte Contrária: João Silva
Valor da Causa: 25000
Observações: Processo criado via interface frontend
```

**Clicar em "Salvar"**

**Resultado esperado:**

- ✅ Toast: "Processo atualizado com sucesso!"
- ✅ Modal fecha
- ✅ Página recarrega processos
- ✅ Estatísticas atualizam: Total (4), Ativos (3)
- ✅ Novo card aparece na lista

---

### 2.9 Testar Validação de CNJ Inválido

**Ação:**

1. Clicar em "+ Novo Processo"
2. Preencher:
   - Número: "123456" (INVÁLIDO)
   - Título: "Teste Validação"
   - Tribunal: TJSP
   - Status: ATIVO
3. Clicar em "Salvar"

**Resultado esperado:**

- ✅ Alert (ou Toast) mostra erro
- ✅ Mensagem contém "Formato inválido" ou "CNJ"
- ✅ Processo NÃO é criado
- ✅ Modal permanece aberto

---

### 2.10 Testar Delete

**Ação:**

1. Abrir detalhes do Card 4 (recém-criado)
2. Clicar em "🗑️ Deletar"
3. Confirmar no popup

**Resultado esperado:**

- ✅ Popup nativo: "Tem certeza que deseja deletar este processo?"
- ✅ Após confirmar: Toast "Processo deletado com sucesso!"
- ✅ Modal fecha
- ✅ Card 4 desaparece da lista
- ✅ Estatísticas atualizam: Total (3), Ativos (2)

---

### 2.11 Testar Ordenação

**a) Ordenar por Mais Recentes:**

1. No filtro "Ordenar", selecione "Mais Recentes"
2. Clique em "Buscar"

- ✅ Cards reordenados (último movimento primeiro)

**b) Ordenar por Título A-Z:**

1. Selecione "Título A-Z"
2. Clique em "Buscar"

- ✅ Cards em ordem alfabética

---

### 2.12 Testar Auto-Status Filter

**Ação:**

1. No filtro "Auto-Status", selecione "Inativo (>90d)"
2. Clique em "Buscar"

**Resultado esperado:**

- ✅ Mostra apenas processos com `esta_ativo: false`
- ✅ Card 2 (STF - >90 dias) aparece

---

### 2.13 Testar Responsividade (Mobile)

**Ação:**

1. Abrir DevTools (F12)
2. Ativar modo responsivo (Ctrl+Shift+M)
3. Selecionar "iPhone 12 Pro" ou largura 375px

**Resultado esperado:**

- ✅ Cards empilhados em coluna única
- ✅ Filtros empilhados verticalmente
- ✅ Modal ocupa tela inteira
- ✅ Abas rolam horizontalmente
- ✅ Botões legíveis e clicáveis

---

## PARTE 3: Testes de Integração

### 3.1 Sincronização Backend ↔ Frontend

**Ação:**

1. Criar processo via API (Backend)
2. F5 na página `/cases` (Frontend)

**Resultado esperado:**

- ✅ Novo processo aparece na lista
- ✅ Estatísticas atualizadas

---

### 3.2 Verificar Admin Django

**Acessar:**

```
http://127.0.0.1:8000/admin/cases/case/
```

**Resultado esperado:**

- ✅ Lista de processos com badges coloridos
- ✅ Filtros laterais (tribunal, status, deleted)
- ✅ Busca funcional
- ✅ Clicar em processo abre detalhes com fieldsets organizados
- ✅ Inline de CaseParty visível

---

## PARTE 4: Testes de Edge Cases

### 4.1 Processo Sem Número

**Via API, criar:**

```json
{
  "numero_processo": "",
  "titulo": "Processo Sem Número",
  "tribunal": "TJSP",
  "status": "ATIVO"
}
```

**Resultado esperado:**

- ✅ Permite criação (campo não obrigatório)
- ✅ Frontend exibe título sem número

---

### 4.2 Processo Com Tags

**Editar processo 1 via API:**

```json
{
  "tags": ["urgente", "cliente-vip", "complexo"]
}
```

**Resultado esperado:**

- ✅ Tags aparecem no card (3 tags + contador se >3)
- ✅ Tags visíveis no modal

---

### 4.3 Processo Muito Antigo

**Criar processo com data_ultima_movimentacao de 200 dias atrás**

**Resultado esperado:**

- ✅ `esta_ativo: false`
- ✅ Badge "Inativo >90d"
- ✅ Badge "200d sem movimento" (laranja ou vermelho)
- ✅ Auto-status = "INATIVO"

---

## PARTE 5: Verificação de Console

### 5.1 Verificar Erros no Console

**Browser DevTools (F12) → Console:**

- ✅ Nenhum erro em vermelho
- ✅ Nenhum warning crítico
- ✅ Requests para `/api/cases/` com status 200

**Terminal Backend:**

- ✅ Nenhum erro de Python
- ✅ Requests GET/POST/PATCH/DELETE logados
- ✅ Status codes corretos (200, 201, 204, 400)

---

## Checklist de Aceitação Final

### Backend ✅

- [ ] Endpoints funcionando (GET, POST, PATCH, DELETE)
- [ ] Validação CNJ funcionando
- [ ] Soft delete + restore funcionando
- [ ] Filtros e busca funcionando
- [ ] Estatísticas corretas
- [ ] Auto-status calculado corretamente

### Frontend ✅

- [ ] Página carrega sem erros
- [ ] Cards exibem dados corretamente
- [ ] Badges coloridos por tribunal/status
- [ ] Filtros funcionam
- [ ] Modal abre/fecha corretamente
- [ ] Modo view/edit alternando
- [ ] CRUD completo (Create, Read, Update, Delete)
- [ ] Validações no frontend
- [ ] Toast notifications funcionando
- [ ] Responsivo (mobile)

### Integração ✅

- [ ] Backend ↔ Frontend sincronizados
- [ ] Admin Django acessível
- [ ] Estatísticas em tempo real

---

## Bugs Encontrados (Preencher durante teste)

**Exemplo:**

```
1. [BAIXO] Card X não atualiza após delete
   Reprodução: ...
   Esperado: ...
   Obtido: ...

2. [MÉDIO] Modal não fecha ao pressionar ESC
   ...
```

---

## Conclusão do Teste

**Data/Hora:** ******\_******  
**Testador:** ******\_******  
**Status:** [ ] APROVADO [ ] REPROVADO [ ] COM RESSALVAS  
**Observações:**

---

**Próximos Passos:** Fase 3 - Integração com Publications

# Mapa de Rotas da API - Legal System

Documentação completa de todas as rotas disponíveis no backend Django REST Framework.

**Base URL:** `http://localhost:8000/api/`

---

## 📋 Índice

1. [Cases (Processos)](#cases-processos)
2. [Case Parties (Partes)](#case-parties-partes)
3. [Case Movements (Movimentações)](#case-movements-movimentações)
4. [Payments (Pagamentos)](#payments-pagamentos)
5. [Expenses (Despesas)](#expenses-despesas)
6. [Contacts (Contatos)](#contacts-contatos)
7. [Publications (Publicações)](#publications-publicações)
8. [Notifications (Notificações)](#notifications-notificações)

---

## Cases (Processos)

### Base Path: `/api/cases/`

| Método     | Rota               | Descrição                      | Parâmetros         |
| ---------- | ------------------ | ------------------------------ | ------------------ |
| **GET**    | `/api/cases/`      | Lista todos os casos           | `?page=1&limit=20` |
| **POST**   | `/api/cases/`      | Cria novo caso                 | JSON body          |
| **GET**    | `/api/cases/{id}/` | Obtém detalhes de um caso      | -                  |
| **PUT**    | `/api/cases/{id}/` | Atualiza completamente um caso | JSON body          |
| **PATCH**  | `/api/cases/{id}/` | Atualiza parcialmente um caso  | JSON body          |
| **DELETE** | `/api/cases/{id}/` | Deleta um caso                 | -                  |

**Campos do Modelo Case:**

- `id` (integer, read-only)
- `numero_processo` (string, required)
- `titulo` (string)
- `tribunal` (string, required)
- `vara` (string)
- `comarca` (string)
- `tipo_acao` (choice: CIVEL, CRIMINAL, TRABALHISTA, etc)
- `status` (choice: ATIVO, SUSPENSO, ENCERRADO)
- `data_distribuicao` (date)
- `observacoes` (text)
- `created_at` (datetime, read-only)
- `updated_at` (datetime, read-only)

---

## Case Parties (Partes)

### Base Path: `/api/case-parties/`

| Método     | Rota                      | Descrição                        | Parâmetros     |
| ---------- | ------------------------- | -------------------------------- | -------------- |
| **GET**    | `/api/case-parties/`      | Lista todas as partes            | `?case_id=123` |
| **POST**   | `/api/case-parties/`      | Cria nova parte                  | JSON body      |
| **GET**    | `/api/case-parties/{id}/` | Obtém detalhes de uma parte      | -              |
| **PUT**    | `/api/case-parties/{id}/` | Atualiza completamente uma parte | JSON body      |
| **PATCH**  | `/api/case-parties/{id}/` | Atualiza parcialmente uma parte  | JSON body      |
| **DELETE** | `/api/case-parties/{id}/` | Remove uma parte                 | -              |

**Campos do Modelo CaseParty:**

- `id` (integer, read-only)
- `case` (integer, FK to Case, required)
- `contact` (integer, FK to Contact, required)
- `role` (choice: AUTOR, REU, TESTEMUNHA, TERCEIRO, required)
- `is_client` (boolean, default=false)
- `representation_type` (choice: INDIVIDUAL, COLETIVA)
- `since_date` (date)
- `created_at` (datetime, read-only)
- `updated_at` (datetime, read-only)

**Filtros Comuns:**

- `?case_id=123` - Partes de um caso específico
- `?is_client=true` - Apenas partes cliente
- `?role=AUTOR` - Por papel

---

## Case Movements (Movimentações)

### Base Path: `/api/case-movements/`

| Método     | Rota                        | Descrição                               | Parâmetros     |
| ---------- | --------------------------- | --------------------------------------- | -------------- |
| **GET**    | `/api/case-movements/`      | Lista todas as movimentações            | `?case_id=123` |
| **POST**   | `/api/case-movements/`      | Cria nova movimentação                  | JSON body      |
| **GET**    | `/api/case-movements/{id}/` | Obtém detalhes de uma movimentação      | -              |
| **PUT**    | `/api/case-movements/{id}/` | Atualiza completamente uma movimentação | JSON body      |
| **PATCH**  | `/api/case-movements/{id}/` | Atualiza parcialmente uma movimentação  | JSON body      |
| **DELETE** | `/api/case-movements/{id}/` | Remove uma movimentação                 | -              |

**Campos do Modelo CaseMovement:**

- `id` (integer, read-only)
- `case` (integer, FK to Case, required) ⚠️ **NÃO PODE SER NULO**
- `data` (date, required)
- `tipo` (choice: DESPACHO, DECISAO, SENTENCA, ACORDAO, AUDIENCIA, JUNTADA, INTIMACAO, CITACAO, CONCLUSAO, RECURSO, PETICAO, OUTROS, required)
- `titulo` (string, required)
- `descricao` (text)
- `prazo` (integer, dias - opcional)
- `origem` (choice: MANUAL, DJE, ESAJ, PJE, default=MANUAL)
- `publicacao_id` (integer, FK to Publication, optional)
- `created_at` (datetime, read-only)
- `updated_at` (datetime, read-only)

**Filtros Comuns:**

- `?case_id=123` - Movimentações de um caso específico
- `?tipo=DESPACHO` - Por tipo
- `?data_from=2024-01-01&data_to=2024-12-31` - Por intervalo de datas

⚠️ **IMPORTANTE:** O campo `case` é obrigatório. Não tente criar movimentação sem salvar o case primeiro.

---

## Payments (Pagamentos)

### Base Path: `/api/payments/`

| Método     | Rota                  | Descrição                           | Parâmetros     |
| ---------- | --------------------- | ----------------------------------- | -------------- |
| **GET**    | `/api/payments/`      | Lista todos os pagamentos           | `?case_id=123` |
| **POST**   | `/api/payments/`      | Cria novo pagamento                 | JSON body      |
| **GET**    | `/api/payments/{id}/` | Obtém detalhes de um pagamento      | -              |
| **PUT**    | `/api/payments/{id}/` | Atualiza completamente um pagamento | JSON body      |
| **PATCH**  | `/api/payments/{id}/` | Atualiza parcialmente um pagamento  | JSON body      |
| **DELETE** | `/api/payments/{id}/` | Remove um pagamento                 | -              |

**Campos do Modelo Payment:**

- `id` (integer, read-only)
- `case` (integer, FK to Case, required)
- `data` (date, required)
- `valor` (decimal, required)
- `tipo_pagamento` (choice: PARCELA, INTEGRAL, COMPLEMENTO)
- `descricao` (text)
- `created_at` (datetime, read-only)
- `updated_at` (datetime, read-only)

---

## Expenses (Despesas)

### Base Path: `/api/expenses/`

| Método     | Rota                  | Descrição                          | Parâmetros     |
| ---------- | --------------------- | ---------------------------------- | -------------- |
| **GET**    | `/api/expenses/`      | Lista todas as despesas            | `?case_id=123` |
| **POST**   | `/api/expenses/`      | Cria nova despesa                  | JSON body      |
| **GET**    | `/api/expenses/{id}/` | Obtém detalhes de uma despesa      | -              |
| **PUT**    | `/api/expenses/{id}/` | Atualiza completamente uma despesa | JSON body      |
| **PATCH**  | `/api/expenses/{id}/` | Atualiza parcialmente uma despesa  | JSON body      |
| **DELETE** | `/api/expenses/{id}/` | Remove uma despesa                 | -              |

**Campos do Modelo Expense:**

- `id` (integer, read-only)
- `case` (integer, FK to Case, required)
- `data` (date, required)
- `descricao` (string, required)
- `categoria` (choice: CUSTAS, DIARIAS, SERVICOS, OUTRAS)
- `valor` (decimal, required)
- `created_at` (datetime, read-only)
- `updated_at` (datetime, read-only)

---

## Contacts (Contatos)

### Base Path: `/api/contacts/`

| Método     | Rota                  | Descrição                         | Parâmetros              |
| ---------- | --------------------- | --------------------------------- | ----------------------- |
| **GET**    | `/api/contacts/`      | Lista todos os contatos           | `?search=termo&type=PF` |
| **POST**   | `/api/contacts/`      | Cria novo contato                 | JSON body               |
| **GET**    | `/api/contacts/{id}/` | Obtém detalhes de um contato      | -                       |
| **PUT**    | `/api/contacts/{id}/` | Atualiza completamente um contato | JSON body               |
| **PATCH**  | `/api/contacts/{id}/` | Atualiza parcialmente um contato  | JSON body               |
| **DELETE** | `/api/contacts/{id}/` | Remove um contato                 | -                       |

**Campos do Modelo Contact:**

- `id` (integer, read-only)
- `nome` (string, required)
- `tipo` (choice: PF - Pessoa Física, PJ - Pessoa Jurídica, required)
- `documento` (string: CPF ou CNPJ)
- `email` (email)
- `telefone` (string)
- `endereco` (text)
- `ativo` (boolean, default=true)
- `created_at` (datetime, read-only)
- `updated_at` (datetime, read-only)

**Filtros Comuns:**

- `?search=João` - Busca por nome
- `?tipo=PF` - Por tipo (PF ou PJ)
- `?documento=12345678900` - Busca exata por documento

---

## Publications (Publicações)

### Base Path: `/api/publications/`

| Método     | Rota                                     | Descrição                                 | Parâmetros                             |
| ---------- | ---------------------------------------- | ----------------------------------------- | -------------------------------------- |
| **GET**    | `/api/publications/today`                | Obtém publicações de hoje                 | `?tribunal=ST&offset=0`                |
| **GET**    | `/api/publications/search`               | Busca publicações                         | `?numero_processo=0000001&tribunal=ST` |
| **GET**    | `/api/publications/last-search`          | Obtém último termo de busca               | -                                      |
| **GET**    | `/api/publications/retrieve-last-search` | Recupera resultados última busca          | -                                      |
| **GET**    | `/api/publications/pending`              | Lista publicações pendentes de integração | -                                      |
| **GET**    | `/api/publications/pending/count`        | Conta publicações pendentes               | -                                      |
| **GET**    | `/api/publications/history`              | Histórico de buscas                       | -                                      |
| **GET**    | `/api/publications/history/<search_id>`  | Detalhes de uma busca                     | -                                      |
| **GET**    | `/api/publications/<id_api>`             | Obtém publicação específica               | -                                      |
| **POST**   | `/api/publications/<id_api>/integrate`   | Integra publicação com um case            | JSON body: `{"case_id": 123}`          |
| **DELETE** | `/api/publications/<id_api>/delete`      | Deleta publicação                         | -                                      |
| **POST**   | `/api/publications/batch-integrate`      | Integra múltiplas publicações             | JSON body                              |
| **POST**   | `/api/publications/delete-multiple`      | Deleta múltiplas publicações              | JSON body                              |
| **DELETE** | `/api/publications/delete-all`           | Deleta todas as publicações               | -                                      |

**Parâmetros de Busca (search):**

- `numero_processo` (string, required)
- `tribunal` (string: ST, STJ, TRF, TJSP, etc, required)

**Campos da Publication:**

- `id_api` (integer, PK)
- `numero_processo` (string)
- `tribunal` (string)
- `vara` (string)
- `titulo` (string)
- `descricao` (text)
- `data_disponibilizacao` (datetime)
- `tipo_comunicacao` (string)
- `orgao` (string)
- `link_oficial` (URL)
- `case` (FK to Case, optional - set on integration)
- `integration_status` (choice: PENDING, INTEGRATED, FAILED)
- `integration_attempted_at` (datetime)
- `integration_notes` (text)

---

## Notifications (Notificações)

### Base Path: `/api/notifications/`

| Método     | Rota                       | Descrição                              | Parâmetros           |
| ---------- | -------------------------- | -------------------------------------- | -------------------- |
| **GET**    | `/api/notifications/`      | Lista todas as notificações            | `?user=1&read=false` |
| **POST**   | `/api/notifications/`      | Cria nova notificação                  | JSON body            |
| **GET**    | `/api/notifications/{id}/` | Obtém detalhes de uma notificação      | -                    |
| **PUT**    | `/api/notifications/{id}/` | Atualiza completamente uma notificação | JSON body            |
| **PATCH**  | `/api/notifications/{id}/` | Atualiza parcialmente uma notificação  | JSON body            |
| **DELETE** | `/api/notifications/{id}/` | Remove uma notificação                 | -                    |
| **POST**   | `/api/notifications/test/` | Cria notificação de teste              | -                    |

**Campos do Modelo Notification:**

- `id` (integer, read-only)
- `user` (FK to User)
- `tipo` (string)
- `titulo` (string)
- `mensagem` (text)
- `read` (boolean, default=false)
- `created_at` (datetime, read-only)
- `updated_at` (datetime, read-only)

---

## Padrões de Resposta

### Sucesso (200, 201)

```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  ...
}
```

### Erro (400, 404, 500)

```json
{
  "detail": "Descrição do erro",
  "field_name": ["Mensagem de erro específica do campo"]
}
```

---

## Status Codes Comuns

| Código  | Significado                                                   |
| ------- | ------------------------------------------------------------- |
| **200** | OK - Sucesso na requisição GET/PUT/PATCH                      |
| **201** | Created - Recurso criado com sucesso                          |
| **400** | Bad Request - Dados inválidos (ex: campo obrigatório ausente) |
| **404** | Not Found - Recurso não encontrado                            |
| **500** | Internal Server Error - Erro no servidor                      |

---

## Exemplos de Uso

### Criar um Case

```bash
POST /api/cases/
Content-Type: application/json

{
  "numero_processo": "0000001-00.2024.8.26.0000",
  "titulo": "Ação Cível de Cobrança",
  "tribunal": "ST",
  "vara": "1ª Vara Cível",
  "comarca": "São Paulo",
  "tipo_acao": "CIVEL",
  "status": "ATIVO"
}
```

### Adicionar Parte a um Case (⚠️ OBRIGATÓRIO: case já deve existir)

```bash
POST /api/case-parties/
Content-Type: application/json

{
  "case": 123,
  "contact": 456,
  "role": "AUTOR",
  "is_client": true
}
```

### Adicionar Movimentação a um Case (⚠️ OBRIGATÓRIO: case_id não pode ser nulo)

```bash
POST /api/case-movements/
Content-Type: application/json

{
  "case": 123,
  "data": "2024-02-27",
  "tipo": "DESPACHO",
  "titulo": "Despacho do Juiz",
  "descricao": "Descrição completa...",
  "origem": "MANUAL"
}
```

### Buscar Publicações

```bash
GET /api/publications/search?numero_processo=0000001&tribunal=ST
```

### Integrar Publicação a um Case

```bash
POST /api/publications/1234/integrate
Content-Type: application/json

{
  "case_id": 123
}
```

---

## Notas Importantes

⚠️ **Ordem de Criação Obrigatória (Fluxo Novo Case):**

1. **Criar Case** primeiro → recebe `id`
2. Depois adicionar **Parties** (referenciando `case_id`)
3. Depois adicionar **Movements** (referenciando `case_id`)

❌ **Erros Comuns:**

- Tentar criar Party/Movement sem ter case `id` → `case: Este campo não pode ser nulo`
- Enviar campo read-only (`created_at`, `updated_at`, `id`) → será ignorado
- Esquecer campos obrigatórios → `[required field] - Este campo é obrigatório`

✅ **Boas Práticas:**

- Sempre validar dados no frontend antes de enviar
- Salvar Case antes de permitir adição de Parties/Movements na UI
- Usar filtros nas listagens para melhor performance (`?case_id=123`)
- Tratar erros 400 com mensagens específicas para cada campo

---

**Última atualização:** 27/02/2026
**Versão da API:** V1 (Django REST Framework)

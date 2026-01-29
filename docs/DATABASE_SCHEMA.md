# Estrutura de Dados - Sistema Judiciário

## Modelos ORM (SQLAlchemy)

### 1. Client (Cliente)

Armazena informações dos clientes da advogada.

#### Campos Pessoa Física:

- `name` - Nome completo
- `cpf` - CPF (sem formatação)
- `rg` - RG
- `profession` - Profissão
- `marital_status` - Estado civil

#### Campos Pessoa Jurídica:

- `company_name` - Razão social
- `cnpj` - CNPJ (sem formatação)
- `legal_representative` - Representante legal

#### Campos Comuns:

- `phone` - Telefone de contato
- `email` - Email
- `address` - Endereço (rua)
- `number` - Número
- `complement` - Complemento
- `neighborhood` - Bairro
- `city` - Cidade
- `state` - Estado (UF)
- `zipcode` - CEP (sem formatação)
- `notes` - Observações adicionais
- `created_at` - Data de criação
- `updated_at` - Data de última atualização

---

### 2. Case (Processo)

Armazena informações sobre os processos jurídicos.

#### Identificação:

- `case_number` - Número do processo (formato CNJ)
- `case_type` - Tipo de ação (Ordinária, Cautelar, Execução, etc.)

#### Dados Processuais:

- `client_id` - FK para Cliente (parte autora)
- `opposing_party` - Nome da parte contrária
- `description` - Descrição do caso
- `court` - Nome do tribunal
- `judge` - Nome do juiz
- `legal_area` - Área jurídica (Cível, Criminal, Trabalhista, etc.)

#### Status e Prioridade:

- `status` - Estado do processo (Pendente, Em Andamento, Concluído, Suspenso, Arquivado)
- `priority` - Prioridade (Baixa, Normal, Alta, Urgente)

#### Datas Importantes:

- `filing_date` - Data de distribuição
- `deadline` - Próxima data importante
- `conclusion_date` - Data de conclusão

#### Financeiro:

- `claim_value` - Valor da causa (armazenado como string)

#### Metadados:

- `created_at` - Data de criação
- `updated_at` - Data de última atualização

---

### 3. Notice (Aviso/Prazo)

Armazena avisos, prazos e notificações importantes.

#### Dados:

- `case_id` - FK para Processo
- `title` - Título do aviso
- `description` - Descrição detalhada
- `due_date` - Data de vencimento
- `notification_date` - Data da notificação
- `completed_date` - Data de conclusão
- `is_completed` - Flag se foi concluído

#### Metadados:

- `created_at` - Data de criação
- `updated_at` - Data de última atualização

---

## Operações CRUD

### ClientCRUD

- `create()` - Criar novo cliente
- `read()` - Obter cliente por ID
- `read_by_cpf()` - Obter por CPF
- `read_by_cnpj()` - Obter por CNPJ
- `read_by_email()` - Obter por email
- `read_all()` - Listar todos com paginação
- `search()` - Pesquisar por nome ou documento
- `update()` - Atualizar dados
- `delete()` - Deletar cliente

### CaseCRUD

- `create()` - Criar novo processo
- `read()` - Obter processo por ID
- `read_by_case_number()` - Obter por número do processo
- `read_by_client()` - Listar processos de um cliente
- `read_all()` - Listar todos com paginação
- `read_by_status()` - Filtrar por status
- `read_urgent()` - Obter processos urgentes/altos
- `search()` - Pesquisar por número ou réu
- `update()` - Atualizar dados
- `delete()` - Deletar processo

### NoticeCRUD

- `create()` - Criar novo aviso
- `read()` - Obter aviso por ID
- `read_by_case()` - Listar avisos de um processo
- `read_pending()` - Listar avisos pendentes
- `read_overdue()` - Listar avisos vencidos
- `read_upcoming()` - Avisos próximos a vencer
- `update()` - Atualizar dados
- `mark_completed()` - Marcar como concluído
- `delete()` - Deletar aviso

---

## Interface PySide6 (Acessibilidade)

### Configuração de Acessibilidade:

- **Fontes**: 14px-16px para legibilidade
- **Cores**: Alto contraste (branco/preto/azul)
- **Botões**: 40px-50px de altura
- **Elementos**: Alinhamento claro e espaçamento

### Telas Implementadas:

1. **ClientListWindow** - Listagem e gestão de clientes
2. **ClientFormDialog** - Cadastro/edição de clientes

### Próximas Telas:

- Case management
- Notice/deadline tracking
- Dashboard com resumos
- AI-powered summaries

---

## Banco de Dados

- **Tipo**: SQLite (local)
- **Arquivo**: `data/legal_system.db`
- **Inicialização**: Automática ao chamar `init_db()`

### Exemplo de Uso:

```python
from src.database import SessionLocal, init_db
from src.crud import ClientCRUD

init_db()
db = SessionLocal()

# Criar cliente
client = ClientCRUD.create(
    db,
    name="João Silva",
    client_type="Pessoa Física",
    cpf="12345678901",
    email="joao@email.com"
)

# Pesquisar
results = ClientCRUD.search(db, "João")

db.close()
```

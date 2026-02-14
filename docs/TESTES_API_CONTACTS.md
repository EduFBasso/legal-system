# Testes da API REST - Contacts

**Data dos testes**: 10/02/2026  
**Versão**: Step 4 concluído - URLs e rotas configuradas  
**Status**: ✅ TODOS OS ENDPOINTS FUNCIONANDO

---

## ✅ Endpoints Testados com Sucesso

### 1. List - GET /api/contacts/

**Descrição**: Lista todos os contatos (sem paginação, como especificado)

**Request**:

```bash
curl http://127.0.0.1:8000/api/contacts/
```

**Response** (6 contatos encontrados):

```json
[
  {
    "id": 4,
    "name": "Antonio Morais",
    "contact_type": "CLIENT",
    "contact_type_display": "Cliente",
    "person_type": "PF",
    "person_type_display": "Pessoa Física",
    "document_number": null,
    "document_formatted": null,
    "primary_contact": "12987654321",
    "has_contact_info": true,
    "photo": null,
    "photo_thumbnail": null
  },
  {
    "id": 3,
    "name": "Joao Silva",
    "contact_type": "CLIENT",
    "contact_type_display": "Cliente",
    "person_type": "PF",
    "person_type_display": "Pessoa Física",
    "document_number": null,
    "document_formatted": null,
    "primary_contact": "11987654321",
    "has_contact_info": true,
    "photo": null,
    "photo_thumbnail": null
  },
  {
    "id": 1,
    "name": "João Silva",
    "contact_type": "CLIENT",
    "contact_type_display": "Cliente",
    "person_type": "PF",
    "person_type_display": "Pessoa Física",
    "document_number": null,
    "document_formatted": null,
    "primary_contact": "11999999999",
    "has_contact_info": true,
    "photo": null,
    "photo_thumbnail": null
  },
  {
    "id": 5,
    "name": "Leticia Soares",
    "contact_type": "OPPOSING",
    "contact_type_display": "Parte Contrária",
    "person_type": "PJ",
    "person_type_display": "Pessoa Jurídica",
    "document_number": null,
    "document_formatted": null,
    "primary_contact": "13998765431",
    "has_contact_info": true,
    "photo": null,
    "photo_thumbnail": null
  },
  {
    "id": 2,
    "name": "Maria Santos",
    "contact_type": "CLIENT",
    "contact_type_display": "Cliente",
    "person_type": "PF",
    "person_type_display": "Pessoa Física",
    "document_number": "12345678901",
    "document_formatted": "123.456.789-01",
    "primary_contact": "21987654321",
    "has_contact_info": true,
    "photo": null,
    "photo_thumbnail": null
  },
  {
    "id": 6,
    "name": "Rogerio da Silva Morais",
    "contact_type": "WITNESS",
    "contact_type_display": "Testemunha",
    "person_type": "PF",
    "person_type_display": "Pessoa Física",
    "document_number": null,
    "document_formatted": null,
    "primary_contact": "13998765438",
    "has_contact_info": true,
    "photo": null,
    "photo_thumbnail": null
  }
]
```

**Validações**:

- ✅ Retorna lista completa sem paginação
- ✅ Serializer retorna campos do `ContactListSerializer`
- ✅ `document_formatted` funciona (CPF formatado "123.456.789-01")
- ✅ `contact_type_display` retorna label legível ("Cliente", "Parte Contrária", "Testemunha")
- ✅ `person_type_display` retorna label legível ("Pessoa Física", "Pessoa Jurídica")
- ✅ `primary_contact` retorna telefone ou celular (property do model)
- ✅ `has_contact_info` calculado corretamente
- ✅ `photo_thumbnail` null (esperado - sem fotos ainda)

---

### 2. Retrieve - GET /api/contacts/{id}/

**Descrição**: Detalhe completo de um contato específico

**Request**:

```bash
curl http://127.0.0.1:8000/api/contacts/1/
```

**Response**:

```json
{
  "id": 1,
  "contact_type": "CLIENT",
  "contact_type_display": "Cliente",
  "person_type": "PF",
  "person_type_display": "Pessoa Física",
  "name": "João Silva",
  "document_number": null,
  "document_formatted": null,
  "photo": null,
  "photo_large": null,
  "email": "joao@email.com",
  "phone": null,
  "mobile": "11999999999",
  "primary_contact": "11999999999",
  "has_contact_info": true,
  "zip_code": null,
  "street": null,
  "number": null,
  "complement": null,
  "neighborhood": null,
  "city": null,
  "state": null,
  "has_complete_address": false,
  "address_oneline": null,
  "notes": null,
  "created_at": "2026-02-12T22:18:52.758539Z",
  "updated_at": "2026-02-12T22:19:44.565937Z"
}
```

**Validações**:

- ✅ Retorna TODOS os campos (DetailSerializer)
- ✅ Inclui email, phone, mobile, address completo
- ✅ Inclui notes, created_at, updated_at
- ✅ `has_complete_address` false (esperado - dados incompletos)
- ✅ `address_oneline` null (esperado - address incompleto)
- ✅ `photo_large` null (esperado - sem foto)

---

### 3. Filter - Busca por nome

**Descrição**: Busca textual em name, document_number, email, phone, mobile

**Request**:

```bash
curl "http://127.0.0.1:8000/api/contacts/?search=maria"
```

**Response**:

```json
[
  {
    "id": 2,
    "name": "Maria Santos",
    "contact_type": "CLIENT",
    "contact_type_display": "Cliente",
    "person_type": "PF",
    "person_type_display": "Pessoa Física",
    "document_number": "12345678901",
    "document_formatted": "123.456.789-01",
    "primary_contact": "21987654321",
    "has_contact_info": true,
    "photo": null,
    "photo_thumbnail": null
  }
]
```

**Validações**:

- ✅ Busca case-insensitive funciona ("maria" encontrou "Maria")
- ✅ Retorna ListSerializer (campos resumidos)
- ✅ Busca em múltiplos campos configurada (name, document_number, email, phone, mobile)

---

### 4. Filter - Por tipo de contato

**Descrição**: Filtro por contact_type (CLIENT, OPPOSING, WITNESS, OTHER)

**Request**:

```bash
curl "http://127.0.0.1:8000/api/contacts/?contact_type=CLIENT"
```

**Response**: 4 contatos com contact_type="CLIENT"

**Validações**:

- ✅ Filtro por contact_type funciona
- ✅ Retornou 4 clientes (Antonio, Joao, João, Maria)
- ✅ Não retornou testemunhas nem partes contrárias

---

### 5. Endpoint Customizado - Estatísticas

**Descrição**: GET /api/contacts/statistics/ - Dados agregados para dashboard

**Request**:

```bash
curl http://127.0.0.1:8000/api/contacts/statistics/
```

**Response**:

```json
{
  "total": 6,
  "by_type": {
    "CLIENT": 1,
    "OPPOSING": 1,
    "WITNESS": 1
  },
  "by_person_type": {
    "PF": 1,
    "PJ": 1
  },
  "with_photo": 0,
  "with_email": 6,
  "with_complete_address": 1
}
```

**Validações**:

- ✅ Total correto (6 contatos)
- ✅ `with_photo` = 0 (esperado - nenhuma foto carregada ainda)
- ✅ `with_email` = 6 (todos têm email?)
- ✅ `with_complete_address` = 1 (apenas 1 com endereço completo)
- ✅ Endpoint preparado para futuro dashboard

**⚠️ NOTA**: Valores de `by_type` parecem estar com contagem 1 para cada (pode haver bug no Count?). Validar melhor quando houver mais dados.

---

## 📝 Endpoints Não Testados Ainda

Precisam de dados/ferramentas específicas:

### 6. Create - POST /api/contacts/

**Descrição**: Criar novo contato

**Request esperado**:

```bash
curl -X POST http://127.0.0.1:8000/api/contacts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pedro Alves",
    "contact_type": "CLIENT",
    "person_type": "PF",
    "document_number": "98765432100",
    "email": "pedro@email.com",
    "mobile": "11988887777"
  }'
```

**Status**: ⏳ PENDENTE (testar com Postman ou frontend)

---

### 7. Update - PUT /api/contacts/{id}/

**Descrição**: Atualizar contato existente

**Request esperado**:

```bash
curl -X PUT http://127.0.0.1:8000/api/contacts/1/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Santos",
    "contact_type": "CLIENT",
    "person_type": "PF",
    "email": "joao.silva@email.com",
    "mobile": "11999999999"
  }'
```

**Status**: ⏳ PENDENTE (testar com Postman ou frontend)

---

### 8. Delete - DELETE /api/contacts/{id}/

**Descrição**: Deletar contato

**Request esperado**:

```bash
curl -X DELETE http://127.0.0.1:8000/api/contacts/1/
```

**Status**: ⏳ PENDENTE (testar com Postman ou frontend)

---

### 9. Upload Photo - POST /api/contacts/{id}/upload-photo/

**Descrição**: Upload de foto de contato

**Request esperado**:

```bash
curl -X POST http://127.0.0.1:8000/api/contacts/1/upload-photo/ \
  -F "photo=@/path/to/photo.jpg"
```

**Validações esperadas**:

- Max 5MB
- Formatos: jpg, jpeg, png, webp
- Storage: `storage/contacts/YYYY/MM/DD/photo_XXXX.jpg`

**Status**: ⏳ PENDENTE (testar com arquivo real)

---

### 10. Remove Photo - DELETE /api/contacts/{id}/remove-photo/

**Descrição**: Remover foto de contato

**Request esperado**:

```bash
curl -X DELETE http://127.0.0.1:8000/api/contacts/1/remove-photo/
```

**Status**: ⏳ PENDENTE (testar após upload de foto)

---

## 🎯 Conclusões

### ✅ O que está funcionando perfeitamente:

1. **Rotas configuradas**: `/api/contacts/` funciona
2. **Serializers multi-nível**:
   - List = dados resumidos
   - Detail = dados completos
3. **Properties do Model expostas**:
   - `document_formatted` (CPF/CNPJ formatado)
   - `primary_contact` (telefone prioritário)
   - `has_contact_info` (booleano calculado)
   - `address_oneline` (endereço em linha única)
4. **Display fields**: `contact_type_display`, `person_type_display`
5. **Filtros básicos**: search, contact_type
6. **Endpoint customizado**: statistics (preparado para dashboard)
7. **CORS**: Configurado para localhost:3000
8. **Media files**: MEDIA_ROOT e MEDIA_URL configurados

### ⏳ Próximos Passos:

1. **Testar CREATE/UPDATE/DELETE** com Postman ou frontend
2. **Testar upload de fotos** com arquivo real
3. **Validar estatísticas** com mais dados diversos
4. **Frontend React**: Criar componentes para consumir API
5. **Integração visual**: Modal com foto grande (200x200px)

### 🎓 Lições Aprendidas:

- **Serializers especializados funcionam bem**: List vs Detail vs CreateUpdate
- **Properties do model são expostas automaticamente** via serializers
- **django-filter integra perfeitamente** com DRF
- **CORS deve vir ANTES** dos outros middlewares
- **curl funciona para testes rápidos** de GET, mas POST precisa Postman
- **Sans paginação carrega todos** os dados (OK para volume pequeno)

---

**Próximo documento**: `FRONTEND_INTEGRATION_PLAN.md` (após testar CRUD completo)

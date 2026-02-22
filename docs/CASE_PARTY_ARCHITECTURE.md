# Arquitetura de Partes do Processo (CaseParty)

## Visão Geral

O sistema já possui uma arquitetura correta para gerenciar partes envolvidas em processos através do modelo **CaseParty**. Este documento explica a arquitetura e como usá-la corretamente.

## Modelos Envolvidos

### 1. Contact (Pessoa)

```python
# backend/apps/contacts/models.py
class Contact(models.Model):
    """
    Pessoa/Entidade cadastrada no sistema.
    Pode ter diferentes papéis em diferentes processos.
    """
    name = models.CharField(max_length=200)
    cpf_cnpj = models.CharField(max_length=18, unique=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    # ... outros campos
```

**Características:**

- Um Contact representa uma **pessoa física ou jurídica**
- Pode ser: cliente, advogado, testemunha, réu, autor, etc.
- Cadastro único com dados completos
- Reutilizável em múltiplos processos

### 2. Case (Processo)

```python
# backend/apps/cases/models.py
class Case(models.Model):
    """Processo judicial"""
    numero_processo = models.CharField(...)
    titulo = models.CharField(...)
    # ... outros campos

    # Campo legado (texto livre)
    parte_contraria = models.CharField(blank=True)
```

### 3. CaseParty (Relacionamento)

```python
# backend/apps/cases/models.py
class CaseParty(models.Model):
    """
    Relacionamento ManyToMany entre Case e Contact.
    Define o papel de cada pessoa no processo.
    """
    case = models.ForeignKey('Case', on_delete=models.CASCADE)
    contact = models.ForeignKey('contacts.Contact', on_delete=models.CASCADE)

    role = models.CharField(
        max_length=20,
        choices=[
            ('CLIENTE', 'Cliente/Representado'),
            ('AUTOR', 'Autor'),
            ('REU', 'Réu'),
            ('TESTEMUNHA', 'Testemunha'),
            ('PERITO', 'Perito'),
            ('TERCEIRO', 'Terceiro Interessado'),
        ],
        default='CLIENTE'
    )

    observacoes = models.TextField(blank=True)

    class Meta:
        unique_together = ('case', 'contact')
```

## Como Funciona

### Exemplo 1: Cliente que Processa (Autor)

**Situação:** Maria Silva (cliente da Dra. Vitória) processa João Santos por dívida.

**Cadastros:**

1. Maria Silva → Contact (CPF 123.456.789-00)
2. João Santos → Contact (CPF 987.654.321-00)
3. Processo 0000004-23.2025.8.26.0001 → Case

**Relacionamentos (CaseParty):**

```python
# Maria é cliente E autora
CaseParty(
    case=processo_0000004,
    contact=maria_silva,
    role='AUTOR'
)

# João é réu
CaseParty(
    case=processo_0000004,
    contact=joao_santos,
    role='REU'
)
```

**Identificar cliente:** Query todos os CaseParty do processo e verificar qual Contact está vinculado ao escritório/advogado.

### Exemplo 2: Cliente que Foi Processado (Réu)

**Situação:** Pedro Costa (cliente) foi processado por Empresa XYZ.

**Cadastros:**

1. Pedro Costa → Contact
2. Empresa XYZ → Contact
3. Processo 0000005-23.2025.8.26.0001 → Case

**Relacionamentos:**

```python
# Empresa é autora
CaseParty(
    case=processo_0000005,
    contact=empresa_xyz,
    role='AUTOR'
)

# Pedro é cliente E réu
CaseParty(
    case=processo_0000005,
    contact=pedro_costa,
    role='REU'
)
```

### Exemplo 3: Múltiplas Partes

**Situação:** Ação coletiva com 3 autores contra 2 réus, cliente é um dos autores.

```python
# 3 Autores (um é cliente)
CaseParty(case=processo, contact=cliente_maria, role='AUTOR')
CaseParty(case=processo, contact=coautor_joao, role='AUTOR')
CaseParty(case=processo, contact=coautor_ana, role='AUTOR')

# 2 Réus
CaseParty(case=processo, contact=reu_empresa_a, role='REU')
CaseParty(case=processo, contact=reu_empresa_b, role='REU')

# Testemunha
CaseParty(case=processo, contact=testemunha_carlos, role='TESTEMUNHA')
```

## Proposta de Melhoria: Identificar Cliente

### Problema Atual

Não há forma direta de identificar qual Contact é o **cliente** do escritório vs outras partes.

### Solução 1: Adicionar Campo is_client

```python
class CaseParty(models.Model):
    case = models.ForeignKey('Case', ...)
    contact = models.ForeignKey('contacts.Contact', ...)
    role = models.CharField(...)  # AUTOR, REU, etc

    # NOVO CAMPO
    is_client = models.BooleanField(
        default=False,
        help_text='Indica se este Contact é o cliente do escritório'
    )
```

**Vantagens:**

- Simples e direto
- Permite cliente com qualquer role
- Um processo pode ter múltiplos clientes (cônjuges, por exemplo)

**Uso:**

```python
# Cliente que é autor
CaseParty(case=proc, contact=maria, role='AUTOR', is_client=True)

# Cliente que é réu
CaseParty(case=proc, contact=pedro, role='REU', is_client=True)
```

### Solução 2: Novos Roles Compostos

```python
role = models.CharField(
    choices=[
        ('CLIENTE_AUTOR', 'Cliente (Autor)'),
        ('CLIENTE_REU', 'Cliente (Réu)'),
        ('AUTOR', 'Autor'),
        ('REU', 'Réu'),
        ('TESTEMUNHA', 'Testemunha'),
        # ...
    ]
)
```

**Vantagens:**

- Tudo em um campo
- Mais explícito

**Desvantagens:**

- Duplicação de roles (CLIENTE_AUTOR + AUTOR)
- Menos flexível

## Queries Úteis

### Obter Todas as Partes de um Processo

```python
processo = Case.objects.get(id=1)
partes = processo.parties.select_related('contact').all()

for parte in partes:
    print(f"{parte.contact.name} - {parte.get_role_display()}")
```

### Obter Cliente do Processo

```python
# Com is_client (Solução 1)
cliente_party = processo.parties.filter(is_client=True).first()
if cliente_party:
    cliente = cliente_party.contact

# Com role composto (Solução 2)
cliente_party = processo.parties.filter(
    role__startswith='CLIENTE_'
).first()
```

### Obter Todos os Processos de um Contact

```python
contact = Contact.objects.get(cpf_cnpj='123.456.789-00')
processos_roles = contact.case_roles.select_related('case').all()

for pr in processos_roles:
    print(f"Processo: {pr.case.numero_processo}")
    print(f"Papel: {pr.get_role_display()}")
```

### Autores vs Réus de um Processo

```python
autores = processo.parties.filter(role='AUTOR').select_related('contact')
reus = processo.parties.filter(role='REU').select_related('contact')

print("Autores:", [p.contact.name for p in autores])
print("Réus:", [p.contact.name for p in reus])
```

## Migração Gradual

### Campo Legado: parte_contraria

```python
# Case model
parte_contraria = models.CharField(
    blank=True,
    help_text='Campo legado - usar CaseParty'
)
```

**Estratégia:**

1. Manter campo legado temporariamente
2. Implementar gestão via CaseParty na UI
3. Migrar dados existentes para CaseParty
4. Depreciar campo legado
5. Remover em versão futura

### Script de Migração

```python
# Migrar parte_contraria para CaseParty
for case in Case.objects.filter(parte_contraria__isnull=False):
    if case.parte_contraria.strip():
        # Buscar ou criar Contact
        contact, created = Contact.objects.get_or_create(
            name=case.parte_contraria,
            defaults={'cpf_cnpj': f'LEGADO-{case.id}'}
        )

        # Criar CaseParty como REU
        CaseParty.objects.get_or_create(
            case=case,
            contact=contact,
            defaults={'role': 'REU'}
        )
```

## Frontend: Gestão de Partes

### Aba "Partes" na CaseDetailPage

**Funcionalidades:**

1. Listar todas as partes do processo
2. Adicionar nova parte (buscar Contact existente)
3. Definir role de cada parte
4. Marcar qual é o cliente
5. Remover parte
6. Editar observações

**Componente Sugerido:**

```jsx
<div className="case-parties-section">
  <h3>Partes do Processo</h3>

  {/* Lista de partes */}
  {parties.map((party) => (
    <div className="party-card" key={party.id}>
      <div className="party-info">
        <strong>{party.contact.name}</strong>
        <span className="party-role">{party.role_display}</span>
        {party.is_client && <span className="badge-client">Cliente</span>}
      </div>
      <div className="party-actions">
        <button onClick={() => editParty(party)}>Editar</button>
        <button onClick={() => removeParty(party)}>Remover</button>
      </div>
    </div>
  ))}

  {/* Adicionar nova parte */}
  <button onClick={openAddPartyModal}>+ Adicionar Parte</button>
</div>
```

**Modal Adicionar Parte:**

```jsx
<Modal>
  <h3>Adicionar Parte ao Processo</h3>

  {/* Buscar Contact */}
  <ContactSearchInput
    onSelect={setSelectedContact}
    placeholder="Buscar pessoa (nome, CPF, email)"
  />

  {/* Selecionar Role */}
  <select value={role} onChange={(e) => setRole(e.target.value)}>
    <option value="AUTOR">Autor</option>
    <option value="REU">Réu</option>
    <option value="TESTEMUNHA">Testemunha</option>
    {/* ... */}
  </select>

  {/* Marcar como cliente */}
  <label>
    <input
      type="checkbox"
      checked={isClient}
      onChange={(e) => setIsClient(e.target.checked)}
    />
    Este contato é o cliente do escritório
  </label>

  {/* Observações */}
  <textarea placeholder="Observações..." />

  <button onClick={saveParty}>Salvar</button>
</Modal>
```

## API Endpoints Necessários

### 1. Listar Partes de um Processo

```
GET /api/cases/{id}/parties/
```

**Response:**

```json
[
  {
    "id": 1,
    "contact": {
      "id": 5,
      "name": "Maria Silva",
      "cpf_cnpj": "123.456.789-00",
      "email": "maria@example.com"
    },
    "role": "AUTOR",
    "role_display": "Autor",
    "is_client": true,
    "observacoes": "Cliente do escritório"
  }
]
```

### 2. Adicionar Parte

```
POST /api/cases/{id}/parties/
```

**Request:**

```json
{
  "contact_id": 5,
  "role": "AUTOR",
  "is_client": true,
  "observacoes": "Cliente principal"
}
```

### 3. Atualizar Parte

```
PATCH /api/cases/{id}/parties/{party_id}/
```

### 4. Remover Parte

```
DELETE /api/cases/{id}/parties/{party_id}/
```

## Implementação Sugerida (Backend)

### ViewSet para CaseParty

```python
# backend/apps/cases/views.py
class CasePartyViewSet(viewsets.ModelViewSet):
    serializer_class = CasePartySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        case_id = self.kwargs.get('case_pk')
        return CaseParty.objects.filter(case_id=case_id).select_related('contact')

    def perform_create(self, serializer):
        case_id = self.kwargs.get('case_pk')
        serializer.save(case=Case.objects.get(id=case_id))
```

### Nested Router

```python
# backend/apps/cases/urls.py
from rest_framework_nested import routers

router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')

cases_router = routers.NestedSimpleRouter(router, r'cases', lookup='case')
cases_router.register(r'parties', CasePartyViewSet, basename='case-parties')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(cases_router.urls)),
]
```

## Próximos Passos

1. ✅ **Reverter campos duplicados** (parte_autora, posicao_cliente)
2. ⏳ **Decidir solução**: is_client (recomendado) ou roles compostos
3. ⏳ **Criar migration** para adicionar is_client ao CaseParty
4. ⏳ **Implementar endpoints** de gestão de partes
5. ⏳ **Criar componente frontend** para aba "Partes"
6. ⏳ **Migrar dados** de parte_contraria para CaseParty
7. ⏳ **Depreciar campo** parte_contraria

## Conclusão

A arquitetura CaseParty já existe e é a **solução correta** para gerenciar partes de processos. Usar campos de texto livre duplica funcionalidade e perde os benefícios de:

- Dados estruturados
- Reutilização de contatos
- Histórico completo de uma pessoa
- Flexibilidade (múltiplos autores, réus, etc.)
- Integridade referencial

**Recomendação:** Implementar gestão completa via CaseParty na UI e depreciar campos legados.

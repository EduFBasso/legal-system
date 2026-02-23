# Análise: Gestão de Partes no Processo

**Data:** 2026-02-22
**Contexto:** Definir como gerenciar partes (cliente, réu, autor, testemunha, etc.) na interface do processo

---

## 📊 Situação Atual

### Backend (✅ Estrutura Correta)

```python
# models.py - CaseParty
class CaseParty(models.Model):
    case = FK(Case)
    contact = FK(Contact)  # Pessoa (CPF, nome, email, telefone)
    role = CharField(choices=[
        'CLIENTE', 'AUTOR', 'REU',
        'TESTEMUNHA', 'PERITO', 'TERCEIRO'
    ])
    is_client = BooleanField(default=False)  # ✅ Recém adicionado
    observacoes = TextField()
```

**Benefícios:**

- ✅ Relacionamento estruturado (não é texto livre)
- ✅ Uma pessoa (Contact) pode ter múltiplos papéis em múltiplos processos
- ✅ Dados da pessoa (CPF, email, telefone) reutilizáveis
- ✅ Queries poderosas: "Todos os processos onde João participou"

### Frontend (❌ Incompleto)

- ⚠️ Apenas campo texto "Parte Contrária (legado)"
- ❌ Não implementa gestão de CaseParty
- ❌ Não permite adicionar réu, autor, testemunha estruturadamente
- ❌ Não permite marcar quem é cliente do escritório

---

## 🎯 Requisitos Identificados

1. **Marcar Cliente do Escritório**: Quem o escritório representa
2. **Definir Papel na Ação**: Autor, Réu, Testemunha, etc.
3. **Múltiplas Partes**: Processos podem ter vários autores, vários réus
4. **Dados Estruturados**: Nome, CPF, contato (não texto livre)
5. **Reutilização**: Mesma pessoa em múltiplos processos
6. **Velocidade**: Cadastro rápido sem muitos cliques

---

## 💡 Opções de Implementação

### **OPÇÃO A: Campos Rápidos no Formulário**

_(Mais simples, menos flexível)_

#### Implementação:

```jsx
// Adicionar ao formulário de Detalhes Completos:
<div className="info-field">
  <label>Nosso Cliente</label>
  <select>
    <option>Buscar contato...</option>
    {/* Lista de contatos */}
  </select>
</div>

<div className="info-field">
  <label>Posição do Cliente</label>
  <select>
    <option value="AUTOR">Autor/Requerente</option>
    <option value="REU">Réu/Requerido</option>
  </select>
</div>

<div className="info-field">
  <label>Parte Contrária</label>
  <select>
    <option>Buscar ou cadastrar...</option>
  </select>
</div>
```

#### Vantagens:

- ✅ Rápido de implementar (2-3 horas)
- ✅ Interface simples e direta
- ✅ Suficiente para 80% dos casos
- ✅ Não tira campos importantes (Tribunal, Status mantidos)

#### Desvantagens:

- ❌ Limitado a 1 cliente + 1 parte contrária
- ❌ Não permite múltiplos autores/réus
- ❌ Não permite adicionar testemunhas, peritos
- ❌ Não aproveita totalmente o CaseParty

#### Quando usar:

- Processos simples (1 cliente vs 1 parte contrária)
- Escritório pequeno com poucos processos complexos
- Prioridade na velocidade de implementação

---

### **OPÇÃO B: Gestão Completa via Aba "Partes"**

_(Correto, completo, mais trabalho)_

#### Implementação:

1. **Aba "Partes" funcional** (atualmente mostra "Em breve")
2. **Lista de Partes** com cards:

   ```
   ┌─────────────────────────────────────────┐
   │ 👤 Maria Silva (CPF: 123.456.789-00)   │
   │ Cliente do Escritório | Autora          │
   │ 📧 maria@email.com | 📱 (11) 98888-8888│
   │ [Editar] [Remover]                      │
   └─────────────────────────────────────────┘

   ┌─────────────────────────────────────────┐
   │ 🏢 Empresa XYZ Ltda (CNPJ: ...)        │
   │ Parte Contrária | Ré                    │
   │ [Editar] [Remover]                      │
   └─────────────────────────────────────────┘
   ```

3. **Botão "+ Adicionar Parte"** abre modal:

   ```
   Campo de busca: [Buscar contato existente...    ]
                   ou [+ Criar novo contato]

   Papel: [Dropdown: Autor/Réu/Testemunha/etc.]

   ☑ Este contato é cliente do escritório

   Observações: [Campo de texto]

   [Cancelar] [Salvar]
   ```

4. **API Backend**:

   ```
   GET    /api/cases/{id}/parties/           # Listar
   POST   /api/cases/{id}/parties/           # Adicionar
   PATCH  /api/cases/{id}/parties/{party_id}/  # Editar
   DELETE /api/cases/{id}/parties/{party_id}/  # Remover
   ```

5. **Resumo no Cartão Principal**:
   ```
   👥 Partes Envolvidas
   Cliente: Maria Silva (Autora)
   Parte Contrária: Empresa XYZ (Ré)
   + 2 testemunhas
   ```

#### Vantagens:

- ✅ Arquitetura correta (usa CaseParty)
- ✅ Múltiplas partes sem limite
- ✅ Testemunhas, peritos, terceiros
- ✅ Dados estruturados e reutilizáveis
- ✅ Interface profissional
- ✅ Preparado para crescimento

#### Desvantagens:

- ❌ Mais trabalhoso (6-8 horas)
- ❌ Requer implementação de ViewSet, rotas, componentes

#### Quando usar:

- Processos complexos (múltiplas partes)
- Escritório médio/grande
- Necessidade de gerenciar testemunhas, peritos
- Visão de longo prazo

---

### **OPÇÃO C: Híbrido (Recomendado! ⭐)**

_(Melhor custo-benefício)_

#### Implementação:

**Fase 1 - Campos Rápidos (imediato):**

```jsx
// No formulário "Detalhes Completos":
<div className="info-field">
  <label>Nosso Cliente Neste Processo</label>
  <ContactSearchInput
    value={formData.cliente_id}
    onChange={(contactId) => handleInputChange('cliente_id', contactId)}
  />
  <span className="field-hint">💡 Ou gerencie todas as partes na aba "Partes"</span>
</div>

<div className="info-field">
  <label>Posição do Cliente</label>
  <select value={formData.cliente_posicao}>
    <option value="AUTOR">Autor/Requerente</option>
    <option value="REU">Réu/Requerido</option>
  </select>
</div>
```

**Backend para Fase 1:**

```python
# models.py - Case
cliente_principal = models.ForeignKey(
    'contacts.Contact',
    on_delete=models.SET_NULL,
    null=True, blank=True,
    related_name='casos_como_cliente',
    help_text='Cliente principal deste processo (atalho)'
)

cliente_posicao = models.CharField(
    max_length=20,
    choices=[('AUTOR', 'Autor'), ('REU', 'Réu')],
    blank=True,
    help_text='Posição do cliente principal'
)

def save(self, *args, **kwargs):
    super().save(*args, **kwargs)

    # Auto-sincronizar com CaseParty
    if self.cliente_principal and self.cliente_posicao:
        CaseParty.objects.update_or_create(
            case=self,
            contact=self.cliente_principal,
            defaults={
                'role': self.cliente_posicao,
                'is_client': True
            }
        )
```

**Fase 2 - Aba Completa (depois):**

- Implementar gestão completa na aba "Partes" quando necessário
- Campos rápidos continuam funcionando
- Aviso: "3 partes adicionais cadastradas"

#### Vantagens:

- ✅ Solução rápida imediata (3 horas)
- ✅ Resolve 90% dos casos comuns
- ✅ Não bloqueia implementação completa depois
- ✅ Sincronização automática com CaseParty
- ✅ Campos importantes (Tribunal, Status) mantidos
- ✅ Caminho de upgrade claro

#### Desvantagens:

- ⚠️ Adiciona 2 campos ao modelo Case (redundância temporária)
- ⚠️ Limitado a 1 cliente principal inicialmente

#### Quando usar:

- **SEMPRE** - É a melhor escolha! 🎯

---

## 📋 Comparação Lado a Lado

| Critério             | Opção A (Simples) | Opção B (Completo) | Opção C (Híbrido) |
| -------------------- | ----------------- | ------------------ | ----------------- |
| Tempo implementação  | 2-3h              | 6-8h               | 3h + depois       |
| Múltiplas partes     | ❌                | ✅                 | ⚠️ Depois         |
| Testemunhas/Peritos  | ❌                | ✅                 | ⚠️ Depois         |
| Dados estruturados   | ✅                | ✅                 | ✅                |
| Velocidade de uso    | ⭐⭐⭐⭐⭐        | ⭐⭐⭐             | ⭐⭐⭐⭐⭐        |
| Escalabilidade       | ❌                | ✅                 | ✅                |
| Uso de CaseParty     | Opcional          | Sim                | Sim (automático)  |
| Requer teste usuário | Não               | Sim                | Não               |
| **Score Total**      | 6/10              | 9/10               | **10/10** ⭐      |

---

## 🎯 Recomendação Final

### **Implementar OPÇÃO C (Híbrido)**

**Agora (3 horas):**

1. Adicionar campos `cliente_principal` e `cliente_posicao` ao modelo Case
2. Criar migration
3. Atualizar serializer
4. Criar componente `ContactSearchInput` (autocomplete)
5. Adicionar campos ao formulário "Detalhes Completos"
6. Implementar sincronização automática com CaseParty no `save()`
7. Manter "Parte Contrária" legado temporariamente

**Depois (quando necessário):**

1. Implementar aba "Partes" completa
2. ViewSet para CRUD de CaseParty
3. Modal de adicionar/editar partes
4. Migração de dados legados

---

## 🚀 Próximos Passos Sugeridos

**Se aprovar Opção C:**

1. ✅ Criar migration para `cliente_principal` e `cliente_posicao`
2. ✅ Atualizar serializers
3. ✅ Criar `ContactSearchInput` component
4. ✅ Adicionar campos ao formulário
5. ✅ Testar sincronização com CaseParty
6. ✅ Commitar mudanças

**Tempo estimado:** 3 horas
**Benefício:** 90% da funcionalidade imediatamente

---

## ❓ Dúvidas para Esclarecer

1. **Tribunal, Status, Tipo de Ação** já são dropdowns. Quer mantê-los ou substituir por algo diferente?
2. **Parte Contrária** atual: manter como está até implementar gestão completa?
3. **Testemunhas** são urgentes ou podem esperar Fase 2?
4. **Múltiplos autores/réus** acontecem frequentemente ou são raros?

---

## ✅ STATUS DE IMPLEMENTAÇÃO - FASE 1 CONCLUÍDA

**Data de Implementação:** 2026-02-22

### Decisão Aprovada

**Opção C (Híbrido)** foi implementada com as seguintes observações:

- ✅ Cliente pode ser PF (CPF) ou PJ (CNPJ)
- ✅ Cadastrar cliente independe de processo
- ✅ Processo pode existir sem cliente vinculado (campos opcionais)
- ✅ Estrutura simples agora, preparada para evolução futura

### Backend Implementado

1. ✅ **Modelo Case** - Campos adicionados:
   - `cliente_principal` (FK opcional para Contact)
   - `cliente_posicao` (CharField opcional: AUTOR/REU)
2. ✅ **Migration 0003** - Aplicada com sucesso
3. ✅ **Serializers** - Campos incluídos:
   - `cliente_principal`, `cliente_nome`, `cliente_document`
   - `cliente_posicao`, `cliente_posicao_display`
4. ✅ **Sincronização Automática** - Método `save()` atualiza CaseParty

### Frontend Implementado

1. ✅ **Service** - `contactsService.js` criado
2. ✅ **Campos no Formulário**:
   - "Nosso Cliente Neste Processo" (select)
   - "Posição do Cliente" (select: Autor/Réu)
3. ✅ **Carregamento Dinâmico** - Contatos carregados em modo edição
4. ✅ **Hint Visual** - "💡 Gerencie todas as partes na aba 'Partes'"

### Arquivos Modificados

- `backend/apps/cases/models.py`
- `backend/apps/cases/serializers.py`
- `backend/apps/cases/migrations/0003_*.py`
- `frontend/src/services/contactsService.js` (novo)
- `frontend/src/pages/CaseDetailPage.jsx`
- `frontend/src/pages/CaseDetailPage.css`

### Próximos Passos (Fase 2 - Futuro)

- [ ] Implementar aba "Partes" completa
- [ ] CRUD de CaseParty via API
- [ ] Modal de adicionar/editar partes
- [ ] Suporte a múltiplas partes (múltiplos autores/réus)
- [ ] Cadastro de testemunhas, peritos, terceiros

---

**✨ Fase 1 concluída! Sistema pronto para uso com gestão básica de partes.**

# Plano de Testes Manuais - Sistema Jurídico

## 📋 Objetivo

Validar as principais funcionalidades do sistema através de testes manuais end-to-end.

## ⚙️ Pré-requisitos

- [ ] Backend rodando: `cd backend && python manage.py runserver`
- [ ] Frontend rodando: `cd frontend && npm run dev`
- [ ] Banco de dados migrado: `python manage.py migrate`
- [ ] Notificações Web Push habilitadas no navegador

---

## 🧪 Suite de Testes

### **TESTE 1: Cadastrar Novo Contato (Cliente)**

**Objetivo:** Verificar criação de contato que será usado como cliente

#### Passos:

1. Acessar `/contacts`
2. Clicar em "+ Novo Contato"
3. Preencher dados:
   - **Nome:** Maria Silva Advocacia (ou Nome completo para PF)
   - **Tipo:** Pessoa Física OU Pessoa Jurídica
   - **CPF/CNPJ:** 123.456.789-00 (ou válido)
   - **Email:** maria.silva@example.com
   - **Telefone:** (11) 98765-4321
   - **Endereço:** Rua Exemplo, 123 - São Paulo
   - **Tags:** cliente, VIP
4. Clicar em "Salvar Contato"

#### Resultado Esperado:

- ✅ Toast de sucesso: "Contato criado com sucesso!"
- ✅ Contato aparece na lista
- ✅ Card do contato exibe todas as informações
- ✅ Tags aparecem coloridas

#### Validações Adicionais:

- [ ] Buscar o contato pelo nome
- [ ] Filtrar por tipo (PF/PJ)
- [ ] Verificar badge com total de contatos

---

### **TESTE 2: Cadastrar Novo Processo**

**Objetivo:** Criar processo completo com todas as informações

#### Passos:

1. Acessar `/cases`
2. Clicar em "+ Novo Processo"
3. **Página de Detalhes** abre em modo edição
4. Preencher campos:

   **Informações Básicas:**
   - **Título:** Ação de Cobrança - Contrato Nº 12345
   - **Número do Processo:** 1006581-93.2024.8.26.0533 (formato CNJ)
   - **Tribunal:** TJSP - Tribunal de Justiça de São Paulo
   - **Status:** ATIVO
   - **Tipo de Ação:** COBRANCA (ou outro)
   - **Comarca:** São Paulo
   - **Vara:** 1ª Vara Cível
   - **Data de Distribuição:** [Escolher data passada, ex: 01/01/2024]

   **Valores e Observações:**
   - **Valor da Causa:** 50000.00
   - **Observações:** Processo urgente, cliente VIP, prazo apertado

5. Clicar em "💾 Salvar Alterações"

#### Resultado Esperado:

- ✅ Toast de sucesso: "Processo salvo com sucesso!"
- ✅ Modo edição desativa automaticamente
- ✅ Cartão "Resumo Rápido" exibe informações
- ✅ Número do processo formatado corretamente
- ✅ Status com badge colorido
- ✅ Valor formatado como moeda (R$ 50.000,00)

#### Validações Adicionais:

- [ ] Voltar para `/cases` e verificar processo na lista
- [ ] Badge de status correto (verde para ATIVO)
- [ ] Card do processo exibe título e número
- [ ] Clicar no processo reabre a página de detalhes

---

### **TESTE 3: Adicionar Cliente ao Processo (via Partes)**

**Objetivo:** Vincular o contato criado como cliente do processo

#### Passos:

1. Na página do processo, clicar na aba "👥 Partes"
2. Clicar em "+ Adicionar Parte"
3. No modal:
   - **Contato:** Selecionar "Maria Silva Advocacia" (criado no Teste 1)
   - **Papel no Processo:** AUTOR (Autor/Requerente)
   - **É nosso cliente?:** ✅ MARCAR
   - **Observações:** Cliente desde 2020, processos anteriores bem-sucedidos
4. Clicar em "Adicionar Parte"

#### Resultado Esperado:

- ✅ Toast de sucesso: "Parte adicionada com sucesso!"
- ✅ Modal fecha automaticamente
- ✅ Lista de partes atualiza
- ✅ Parte aparece com badge "NOSSO CLIENTE"
- ✅ Link para contato funcionando
- ✅ Papel exibido corretamente (Autor/Requerente)

#### Validações Adicionais:

- [ ] Voltar para aba "Informações"
- [ ] Verificar card "Nosso Cliente Neste Processo"
- [ ] Nome do cliente aparece automaticamente
- [ ] Papel (Autor/Requerente) exibido
- [ ] Botão "Gerenciar na aba Partes →" funciona

---

### **TESTE 4: Adicionar Parte Contrária**

**Objetivo:** Adicionar réu/parte contrária ao processo

#### Passos:

1. Na aba "👥 Partes", clicar em "+ Adicionar Parte"
2. No modal:
   - Se o contato não existe:
     - Clicar em "+ Novo Contato"
     - Cadastrar "João Santos Comércio Ltda" (PJ)
     - Salvar
   - Selecionar contato
   - **Papel no Processo:** REU (Réu/Requerido)
   - **É nosso cliente?:** ❌ NÃO MARCAR
3. Clicar em "Adicionar Parte"

#### Resultado Esperado:

- ✅ Parte contrária adicionada
- ✅ Badge "NOSSO CLIENTE" não aparece
- ✅ Lista organiza: Nossos Clientes primeiro, depois Outras Partes

#### Validações Adicionais:

- [ ] Adicionar mais partes (testemunhas, advogados)
- [ ] Verificar filtro "Nossos Clientes" e "Todas"
- [ ] Editar parte (clicar no lápis)
- [ ] Remover parte (clicar na lixeira com confirmação)

---

### **TESTE 5: Adicionar Movimentação SEM Prazo**

**Objetivo:** Cadastrar movimentação processual simples

#### Passos:

1. Clicar na aba "📋 Movimentações"
2. Clicar em "+ Nova Movimentação"
3. No modal:
   - **Data:** [Escolher data passada, ex: 05/02/2024]
   - **Tipo:** DESPACHO
   - **Título:** Despacho determinando juntada de documentos
   - **Descrição:** Juiz determinou a juntada dos documentos de fls. 20-25 aos autos
   - **Prazo (dias):** [DEIXAR VAZIO]
4. Clicar em "Salvar Movimentação"

#### Resultado Esperado:

- ✅ Toast de sucesso: "Movimentação cadastrada com sucesso!"
- ✅ Modal fecha
- ✅ Movimentação aparece na timeline
- ✅ Ícone de DESPACHO correto
- ✅ Data formatada
- ✅ Descrição expandida
- ✅ Origem: "Manual"
- ✅ SEM indicação de prazo

#### Validações Adicionais:

- [ ] Voltar para aba "Informações"
- [ ] Card "Última Movimentação" atualizado
- [ ] Data e resumo corretos
- [ ] "Dias sem movimentação" recalculado

---

### **TESTE 6: Adicionar Movimentação COM Prazo**

**Objetivo:** Cadastrar movimentação com prazo para testar sistema de notificações

#### Passos:

1. Na aba "📋 Movimentações", clicar em "+ Nova Movimentação"
2. Preencher:
   - **Data:** [HOJE] (usar data de hoje)
   - **Tipo:** INTIMACAO
   - **Título:** Intimação para apresentar contestação
   - **Descrição:** Prazo para apresentação de contestação conforme Art. 335 CPC
   - **Prazo (dias):** 3 (para testar notificação)
3. Clicar em "Salvar Movimentação"

#### Resultado Esperado:

- ✅ Movimentação criada com sucesso
- ✅ Timeline exibe: "⏰ Prazo: 3 dias (até [DATA])"
- ✅ Data limite calculada automaticamente (+3 dias)
- ✅ Ícones de editar ✏️ e deletar 🗑️ aparecem (pois origem é MANUAL)

#### Validações Adicionais:

- [ ] Clicar na aba "⏰ Prazos"
- [ ] Verificar prazo na lista
- [ ] Badge com contador de prazos no menu
- [ ] Status do prazo: "⏰ Próximo" ou "🔴 Vence hoje"

---

### **TESTE 7: Sistema de Notificações de Prazos**

**Objetivo:** Verificar criação automática de notificações

#### Passos:

1. **Logo após criar movimentação com prazo**, aguardar 2-3 segundos
2. Verificar **Web Push Notification** (notificação do navegador)
   - Se não aparecer, verificar permissões do navegador
3. Olhar **Sidebar** (lado esquerdo)
   - Ícone 🔔 deve ter badge vermelho com contador
4. Clicar no ícone de notificações na sidebar

#### Resultado Esperado:

- ✅ Web Push aparece com título: "⏰ Prazo vence em X dias"
- ✅ Mensagem: "Processo [NÚMERO]: [TÍTULO DA MOVIMENTAÇÃO]"
- ✅ Card de notificação na sidebar
- ✅ Prioridade correta (Urgente, Alta, Média)
- ✅ Link direciona para o processo

#### Validações Adicionais:

- [ ] Marcar notificação como lida
- [ ] Badge de contador diminui
- [ ] Filtrar: Todas / Não lidas / Lidas
- [ ] Clicar em "Ver detalhes" abre modal

---

### **TESTE 8: Editar Movimentação**

**Objetivo:** Modificar movimentação existente

#### Passos:

1. Na aba "📋 Movimentações", encontrar movimentação MANUAL
2. Clicar no ícone ✏️ (Editar)
3. Modal abre com dados preenchidos
4. Alterar:
   - **Título:** [Modificar título]
   - **Prazo:** [Alterar de 3 para 5 dias, por exemplo]
5. Clicar em "Atualizar Movimentação"

#### Resultado Esperado:

- ✅ Toast: "Movimentação atualizada com sucesso!"
- ✅ Timeline atualiza imediatamente
- ✅ Novo prazo calculado
- ✅ Lista de prazos atualiza automaticamente

---

### **TESTE 9: Deletar Movimentação**

**Objetivo:** Remover movimentação e verificar recalculos

#### Passos:

1. Na timeline, clicar no ícone 🗑️ (Deletar)
2. Confirmar no dialog: "Tem certeza?"
3. Aguardar resposta

#### Resultado Esperado:

- ✅ Toast: "Movimentação excluída com sucesso!"
- ✅ Movimentação removida da timeline
- ✅ "Última Movimentação" recalculada (mostra a anterior)
- ✅ Prazo removido da aba "⏰ Prazos"
- ✅ Badge de prazos atualiza

---

### **TESTE 10: Validação de Data Futura (Regra de Negócio)**

**Objetivo:** Garantir que não é possível criar movimentação com data futura

#### Passos:

1. Tentar criar nova movimentação
2. Selecionar **data futura** (amanhã ou depois)
3. Preencher título e tipo
4. Clicar em "Salvar Movimentação"

#### Resultado Esperado:

- ❌ Toast de erro: "A data da movimentação não pode ser futura"
- ❌ Movimentação NÃO é criada
- ❌ Modal permanece aberto para correção
- ✅ Input de data tem atributo `max="[HOJE]"` (não deixa escolher futuro)
- ✅ Hint abaixo do campo: "Apenas datas passadas ou de hoje são permitidas"

#### Validação Backend:

- Se tentar burlar via API (DevTools), retorna **400 Bad Request**
- Erro: "A data da movimentação não pode ser futura. Movimentações registram eventos que já ocorreram."

---

### **TESTE 11: Menu Prazos - Filtros**

**Objetivo:** Validar filtros e visualização completa de prazos

#### Passos:

1. Criar **3 movimentações com prazos diferentes**:
   - Prazo 1: Vencido (data -10 dias, prazo 5 dias) → Status: ❌ Vencido
   - Prazo 2: Hoje (data hoje, prazo 0 dias) → Status: 🔴 Vence hoje
   - Prazo 3: Futuro (data -5 dias, prazo 30 dias) → Status: ✅ Futuro

2. Clicar na aba "⏰ Prazos"
3. Testar cada filtro:
   - **Todos:** Mostra os 3 prazos
   - **Vencidos:** Mostra apenas Prazo 1
   - **Próximos:** Mostra Prazo 1 e Prazo 2
   - **Futuros:** Mostra Prazo 3

#### Resultado Esperado:

- ✅ Cards coloridos por status:
  - Vermelho: Vencidos
  - Laranja: Vence hoje
  - Amarelo: Próximos (< 7 dias)
  - Verde: Futuros
- ✅ Contador correto em cada botão de filtro
- ✅ Badge no menu "⏰ Prazos" com total

---

### **TESTE 12: Card "Próximos Prazos" em Informações**

**Objetivo:** Verificar resumo automático de prazos urgentes

#### Passos:

1. Com prazos cadastrados (Teste 11), ir para aba "Informações"
2. Rolar até seção "Resumo Rápido"
3. Procurar card "⚠️ Próximos Prazos"

#### Resultado Esperado:

- ✅ Mostra **até 3 prazos mais urgentes**
- ✅ Status colorido (emoji + cor da borda)
- ✅ Título da movimentação
- ✅ Data de vencimento
- ✅ Link "Ver todos os prazos →" direciona para aba Prazos
- ✅ Se não houver prazos urgentes: "✅ Nenhum prazo urgente"

---

### **TESTE 13: Testes Automatizados (Opcional)**

**Objetivo:** Confirmar que testes unitários estão passando

#### Passos:

1. Abrir terminal no diretório `backend/`
2. Ativar ambiente virtual: `.venv\Scripts\Activate.ps1`
3. Executar: `python manage.py test apps.cases.tests --verbosity=2`

#### Resultado Esperado:

```
Ran 46 tests in X.XXXs

OK (skipped=1)
```

- ✅ **46 testes** passando
- ✅ 5 testes de CaseMovement (model)
- ✅ 7 testes de CaseMovement (API)
- ✅ 2 testes de Deadline Notifications
- ✅ 1 teste: `test_reject_future_date` (validação de data futura)

---

## 📊 Checklist Final

### Funcionalidades Core

- [ ] Cadastro de contatos (PF/PJ)
- [ ] Cadastro de processos completo
- [ ] Vinculação cliente ↔ processo (via Partes)
- [ ] Sistema de partes (cliente + contrários)
- [ ] Movimentações processuais
- [ ] Prazos automáticos
- [ ] Notificações Web Push

### Validações de Negócio

- [ ] Datas futuras bloqueadas em movimentações
- [ ] Cálculo automático de data_limite_prazo
- [ ] Recalculo de última_movimentacao ao criar/deletar
- [ ] Sincronização CaseParty ↔ Informações

### UX/UI

- [ ] Toasts de feedback (sucesso/erro)
- [ ] Modais com confirmação (delete)
- [ ] Formulários com hints e validações
- [ ] Layout responsivo
- [ ] Badges e contadores corretos
- [ ] Links de navegação entre abas

### Sistema de Notificações

- [ ] Web Push funcionando
- [ ] Notificações na sidebar
- [ ] Badge com contador
- [ ] Prioridades corretas (Urgente/Alta/Média)
- [ ] Deduplicação (não cria duplicatas)
- [ ] Links direcionam corretamente

---

## 🐛 Problemas Conhecidos

Nenhum problema crítico conhecido até o momento.

---

## 📝 Observações

- **Navegadores testados:** Chrome, Edge, Firefox
- **Resolução mínima:** 1366x768
- **Permissões necessárias:** Web Notifications habilitadas
- **Ambiente:** Desenvolvimento local (não testado em produção)

---

## ✅ Aprovação

**Testado por:** ************\_************

**Data:** **_/_**/**\_\_**

**Status:** [ ] Aprovado [ ] Reprovado [ ] Aprovado com ressalvas

**Observações:**

---

---

---

---

**Última atualização:** 24/02/2026
**Versão do documento:** 1.0

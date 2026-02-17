# 🧪 Roteiro de Teste Pré-Instalação

**Objetivo**: Validar 100% do sistema antes da instalação presencial  
**Tempo estimado**: 15-20 minutos  
**Quando executar**: 1 dia antes da visita ao escritório

---

## ✅ FASE 1: Validação Automática (2 min)

### Passo 1: Executar validador

```
1. Duplo clique em: VALIDAR_SISTEMA.bat
2. Aguardar verificação completa
3. Verificar resultado: "SUCESSO" verde
```

**Se aparecer erros:**

- Anotar quais arquivos estão faltando
- Verificar se todas as pastas estão completas
- Recriar arquivos que faltam

---

## 🖥️ FASE 2: Teste de Instalação Limpa (5 min)

### Passo 2: Simular ambiente do cliente

**Opção A - Usar outra pasta (recomendado):**

```
1. Copiar pasta legal-system para: C:\temp\legal-system-teste
2. Abrir C:\temp\legal-system-teste
3. Executar INSTALAR.bat
4. Observar saída:
   [1/5] Verificando Python... ✓
   [2/5] Verificando Node.js... ✓
   [3/5] Instalando dependências Python... ✓
   [4/5] Instalando dependências Node... ✓
   [5/5] Configurando banco de dados... ✓
   INSTALACAO CONCLUIDA!
```

**Opção B - Usar VM/outro computador (ideal):**

- Copiar sistema para outro computador/VM
- Seguir mesmo processo acima
- Simula exatamente o ambiente do cliente

**Validação:**

- [ ] Script terminou sem erros
- [ ] Mensagem "INSTALACAO CONCLUIDA!" apareceu
- [ ] Nenhum erro vermelho na tela

---

## 🚀 FASE 3: Teste de Inicialização (3 min)

### Passo 3: Iniciar sistema

```
1. Na mesma pasta de teste, executar: INICIAR_SISTEMA.bat
2. Observar janela preta:
   [1/2] Iniciando servidor backend... (porta 8000)
   [2/2] Iniciando servidor frontend... (porta 5173)
   Abrindo navegador...
3. Aguardar ~10 segundos
4. Navegador deve abrir automaticamente
```

**Validação:**

- [ ] Janela preta abriu e permaneceu aberta
- [ ] Mensagens de início apareceram
- [ ] Navegador abriu em http://localhost:5173
- [ ] Página carregou com menu lateral

**Se navegador não abrir:**

- Aguardar mais 10 segundos
- Abrir manualmente: http://localhost:5173
- Pressionar F5 se página estiver em branco

---

## 📋 FASE 4: Teste Funcional - Contatos (4 min)

### Passo 4: Testar módulo de contatos

**4.1 Criar contato:**

```
1. Clicar em "👥 Contatos" no menu
2. Clicar em "+ Novo Contato"
3. Preencher dados de teste:
   Nome: João da Silva Teste
   CPF: 123.456.789-00
   Email: joao@teste.com
   Telefone: (11) 98765-4321
   OAB: 123456
4. Clicar "Salvar"
```

**Validação:**

- [ ] Modal abriu corretamente
- [ ] Campos aceitaram digitação
- [ ] Toast verde apareceu: "Contato criado com sucesso"
- [ ] Contato apareceu na lista

**4.2 Testar seleção:**

```
1. Clicar no cartão do contato criado
2. Observar: Deve ficar com borda azul e fundo azul claro
3. Clicar em outro lugar (fora do cartão)
4. Verificar: Borda azul PERMANECE (não some)
```

**Validação:**

- [ ] Cartão ficou azul ao clicar
- [ ] Seleção permaneceu após clicar fora
- [ ] Apenas UM cartão pode estar selecionado por vez

**4.3 Testar edição:**

```
1. Com cartão selecionado, clicar no ícone ✏️ (lápis)
2. Modal de edição deve abrir
3. Alterar nome para: "João da Silva Teste EDITADO"
4. Clicar "Salvar"
5. Modal deve fechar
6. Nome deve estar atualizado no cartão
```

**Validação:**

- [ ] Modal abriu ao clicar no lápis
- [ ] Campos vieram preenchidos com dados atuais
- [ ] Alteração foi salva
- [ ] Cartão manteve seleção (azul) após fechar modal

**4.4 Testar exclusão:**

```
1. Clicar no ícone ✏️ do contato
2. Clicar em "Excluir"
3. Confirmar exclusão
4. Contato deve sumir da lista
```

**Validação:**

- [ ] Confirmação apareceu
- [ ] Toast verde: "Contato excluído com sucesso"
- [ ] Contato removido da lista

---

## 📰 FASE 5: Teste Funcional - Publicações (6 min)

### Passo 5: Testar módulo de publicações

**5.1 Teste rápido (widget):**

```
1. Na página de Contatos, observar sidebar "Controles"
2. Localizar widget "Publicações Recentes"
3. Clicar em "🔄 Buscar Publicações"
4. Aguardar (~5 segundos)
5. Widget deve mostrar:
   - "Última busca: hoje às [HH:MM]"
   - "X publicações encontradas"
```

**Validação:**

- [ ] Botão mudou para "Buscando..." durante consulta
- [ ] Após finalizar, mostrou resultado
- [ ] Horário da busca apareceu corretamente
- [ ] Se encontrou publicações, número apareceu

**5.2 Teste avançado (página completa):**

```
1. Clicar em "📰 Publicações" no menu
2. Visualizar página de publicações

Na seção de filtros:
3. Data Início: Escolher 7 dias atrás (ex: 03/02/2026)
4. Data Fim: Hoje (ex: 10/02/2026)
5. Tribunais: Manter todos selecionados (TJSP, TRF3, TRT2, TRT15)
6. Clicar em "🔍 Buscar Publicações"
7. Aguardar (~5-10 segundos)
```

**Validação - Durante busca:**

- [ ] Botão mudou para "Buscando..."
- [ ] Loading spinner apareceu
- [ ] Filtros ficaram desabilitados

**Validação - Após busca:**

- [ ] Toast verde: "X publicações encontradas"
- [ ] Resumo apareceu:
  ```
  📅 Período: 03/02/2026 até 10/02/2026
  ⚖️ Tribunais: TJSP, TRF3, TRT2, TRT15
  📊 Resultados: X publicações
  ```
- [ ] Cartões de publicações apareceram na grid
- [ ] Cada cartão mostra:
  - Tribunal (ex: "TJSP")
  - Data (ex: "10/02/2026 às 14:30")
  - Número do processo (se disponível)
  - Trecho do texto (500 caracteres)
  - Botão "Ver Detalhes"

**5.3 Testar filtros:**

```
1. Desmarcar todos os tribunais (clicar "Nenhum")
2. Marcar apenas TJSP
3. Buscar novamente
4. Verificar: Apenas publicações do TJSP aparecem
```

**Validação:**

- [ ] Botões "Todos" e "Nenhum" funcionam
- [ ] Checkboxes individuais funcionam
- [ ] Resultados refletem os tribunais selecionados

**5.4 Testar detalhes:**

```
1. Clicar em "Ver Detalhes" em uma publicação
2. Modal deve abrir com detalhes completos

Verificar no modal:
- Título com tribunal e data
- ID da Comunicação
- Tipo de Comunicação
- Órgão
- Número do Processo (se disponível)
- Texto completo (rolável)
- Botão "Fechar" e [X]
```

**Validação:**

- [ ] Modal abriu corretamente
- [ ] Todos os campos estão visíveis
- [ ] Se texto tem HTML (tabelas), renderização está correta
- [ ] Botão "Fechar" funciona
- [ ] Clicar fora do modal também fecha
- [ ] Pressionar ESC fecha o modal

**5.5 Testar renderização HTML:**

```
Se alguma publicação tiver HTML (tabelas, seções):
1. Abrir modal dessa publicação
2. Verificar se tabelas estão formatadas
3. Verificar se não aparece tags <html>, <body>, etc.
```

**Validação:**

- [ ] Tabelas com bordas e zebrado
- [ ] Títulos e negrito corretos
- [ ] Sem tags HTML visíveis no texto
- [ ] Layout profissional e limpo

---

## 🛑 FASE 6: Teste de Parada (1 min)

### Passo 6: Encerrar sistema

```
1. Executar PARAR_SISTEMA.bat
   OU
2. Fechar a janela preta do INICIAR_SISTEMA.bat

Aguardar mensagem:
"Encerrando processos do sistema..."
"Sistema encerrado com sucesso."
```

**Validação:**

- [ ] Script executou sem erros
- [ ] Janela preta fechou
- [ ] Tentar acessar http://localhost:5173 → deve dar erro (esperado)

---

## 📱 FASE 7: Teste em Diferentes Cenários (Opcional - 5 min)

### Cenário A: Sem publicações

```
1. Buscar por período muito antigo (ex: 01/01/2020 a 02/01/2020)
2. Verificar mensagem: "Nenhuma publicação encontrada"
3. Sistema não deve quebrar ou dar erro
```

### Cenário B: Erro de internet

```
1. Desconectar internet manualmente
2. Tentar buscar publicações
3. Verificar toast vermelho: "Erro ao buscar publicações"
4. Sistema não deve travar
5. Reconectar internet e buscar novamente → deve funcionar
```

### Cenário C: Tribunal offline

```
1. Buscar publicações normalmente
2. Se algum tribunal falhar:
   - Toast deve mostrar erro específico
   - Outros tribunais devem retornar resultados normalmente
```

---

## 📊 CHECKLIST FINAL

### ✅ Validações obrigatórias:

- [ ] VALIDAR_SISTEMA.bat executou com sucesso
- [ ] INSTALAR.bat funciona sem erros
- [ ] INICIAR_SISTEMA.bat abre sistema automaticamente
- [ ] Módulo de Contatos:
  - [ ] Criar contato
  - [ ] Selecionar contato (fica azul)
  - [ ] Seleção persiste após fechar modal
  - [ ] Editar contato
  - [ ] Excluir contato
- [ ] Módulo de Publicações:
  - [ ] Widget na sidebar busca publicações
  - [ ] Página de publicações carrega
  - [ ] Filtros de data funcionam
  - [ ] Filtros de tribunal funcionam
  - [ ] Resultados aparecem corretamente
  - [ ] Modal de detalhes abre
  - [ ] HTML é renderizado (se aplicável)
- [ ] PARAR_SISTEMA.bat encerra tudo corretamente

### ✅ Itens para levar ao escritório:

- [ ] Pasta legal-system completa em pendrive/HD externo
- [ ] Instaladores offline:
  - [ ] Python 3.11+ instalador (.exe)
  - [ ] Node.js 20 LTS instalador (.msi)
- [ ] INSTALACAO_PRESENCIAL_CHECKLIST.md impresso
- [ ] DIFERENCIAIS_DO_SISTEMA.md (para apresentação)
- [ ] Seu notebook (para suporte se necessário)

---

## 🚨 Problemas Comuns e Soluções

### Problema: "Python não encontrado"

**Causa**: Python não instalado ou não no PATH  
**Solução**: Reinstalar Python marcando "Add Python to PATH"

### Problema: "Node não encontrado"

**Causa**: Node.js não instalado  
**Solução**: Instalar Node.js 20 LTS

### Problema: "Porta 8000 já em uso"

**Causa**: Outro processo usando a porta ou sistema anterior não parou  
**Solução**: Executar PARAR_SISTEMA.bat e aguardar 5 segundos

### Problema: "Página não carrega no navegador"

**Causa**: Frontend ainda compilando  
**Solução**: Aguardar mais 10 segundos e pressionar F5

### Problema: "Erro ao buscar publicações"

**Causa**: Sem internet ou API PJe offline  
**Solução**: Verificar conexão, tentar novamente em alguns minutos

---

## ✅ RESULTADO ESPERADO

Ao final dos testes, você deve ter validado:

1. ✅ **Estrutura completa** - Todos os arquivos presentes
2. ✅ **Instalação** - Script automatiza 100% do setup
3. ✅ **Inicialização** - Sistema sobe automaticamente
4. ✅ **Contatos** - CRUD completo funcionando
5. ✅ **Publicações** - Busca multi-tribunal OK
6. ✅ **Interface** - Seleção, modais, filtros OK
7. ✅ **Encerramento** - Sistema para sem problemas

**Se TODOS os itens acima passaram:** ✅ **SISTEMA PRONTO PARA INSTALAÇÃO!**

**Se algum item falhou:**

- Anotar qual teste falhou
- Verificar logs (backend.log, frontend.log)
- Corrigir antes de ir ao escritório
- Repetir testes

---

**Última verificação antes de sair:**

```
[ ] VALIDAR_SISTEMA.bat → SUCESSO
[ ] Teste funcional completo → OK
[ ] Pendrive com instaladores → Pronto
[ ] Checklist impresso → Pronto
```

**BOA SORTE NA INSTALAÇÃO! 🚀⚖️**

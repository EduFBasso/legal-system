# ✅ Checklist: Instalação Presencial no Escritório

**Data**: **_/_**/2026  
**Técnico**: ******\_\_\_******  
**Cliente**: Advogada Vitoria Rocha

---

## 📋 PRÉ-INSTALAÇÃO (Em Casa)

- [ ] Testar sistema localmente uma última vez
- [ ] Fazer backup do repositório em pendrive/HD externo
- [ ] Verificar se todos os .bat estão funcionando
- [ ] Preparar instaladores offline (caso escritório tenha internet lenta):
  - [ ] Python 3.11+ installer (python.org)
  - [ ] Node.js 20 LTS installer (nodejs.org)

---

## 🖥️ NO ESCRITÓRIO - Fase 1: Preparação (5-10 min)

### 1.1 Verificar Computador

- [ ] Sistema operacional: Windows 10/11
- [ ] RAM: Mínimo 4GB (recomendado 8GB)
- [ ] Espaço livre: ~2GB
- [ ] Antivírus: Verificar se não vai bloquear Python/Node

### 1.2 Instalar Pré-requisitos

- [ ] **Python 3.11+**
  - [ ] Download de python.org
  - [ ] ⚠️ **MARCAR "Add Python to PATH"**
  - [ ] Verificar: `python --version` no cmd
  - [ ] Resultado esperado: `Python 3.11.x`

- [ ] **Node.js 20 LTS**
  - [ ] Download de nodejs.org
  - [ ] Instalação padrão (Next → Finish)
  - [ ] Verificar: `node --version` no cmd
  - [ ] Resultado esperado: `v20.x.x`

### 1.3 Copiar Sistema

- [ ] Copiar pasta `legal-system` para: `C:\legal-system`
- [ ] **Não usar** OneDrive, Dropbox, Google Drive
- [ ] Verificar se todos os arquivos foram copiados (~500MB)

---

## ⚙️ FASE 2: Instalação Automática (10-15 min)

- [ ] Abrir pasta `C:\legal-system`
- [ ] Executar `INSTALAR.bat` (duplo clique)
- [ ] Observar saída:
  - [ ] Python encontrado ✓
  - [ ] Node.js encontrado ✓
  - [ ] Dependências Python instaladas ✓
  - [ ] Dependências Node instaladas ✓
  - [ ] Banco de dados criado ✓
  - [ ] "INSTALACAO CONCLUIDA!" aparece ✓

**Se der erro:**

- Anotar mensagem de erro completa
- Verificar logs em `backend.log` e `frontend.log`

---

## 🚀 FASE 3: Primeiro Teste (5 min)

- [ ] Executar `INICIAR_SISTEMA.bat`
- [ ] Aguardar janela preta abrir (NÃO FECHAR!)
- [ ] Navegador deve abrir automaticamente em ~10 segundos
- [ ] URL esperada: `http://localhost:5173`

### 3.1 Testar Módulos

**Contatos:**

- [ ] Clicar em "👥 Contatos" no menu
- [ ] Deve mostrar lista vazia ou contatos de exemplo
- [ ] Clicar "+ Novo Contato"
- [ ] Criar um contato de teste
- [ ] Salvar e verificar se aparece na lista
- [ ] Clicar no cartão → deve selecionar (azul)
- [ ] Clicar no ícone ✏️ → deve abrir modal de edição
- [ ] Testar edição e exclusão

**Publicações:**

- [ ] Clicar em "📰 Publicações" no menu
- [ ] Sidebar "Controles" deve mostrar widget de publicações
- [ ] Clicar "🔄 Buscar Publicações" no widget
- [ ] Deve buscar publicações de hoje
- [ ] Na página de publicações:
  - [ ] Selecionar período (ex: última semana)
  - [ ] Selecionar tribunais: TJSP, TRF3, TRT2, TRT15
  - [ ] Clicar "🔍 Buscar Publicações"
  - [ ] Aguardar consulta (8 requisições = ~5-10 segundos)
  - [ ] Verificar se aparece resumo: "X publicações encontradas"
  - [ ] Clicar em uma publicação para ver detalhes
  - [ ] Verificar se HTML está renderizado (tabelas, etc.)

---

## 📝 FASE 4: Configuração Final (5 min)

### 4.1 Criar Atalhos

- [ ] Criar atalho de `INICIAR_SISTEMA.bat` na Área de Trabalho
- [ ] Renomear para "🏛️ Sistema Jurídico"
- [ ] Criar atalho de `PARAR_SISTEMA.bat` na Área de Trabalho
- [ ] Testar atalhos

### 4.2 Treinamento Rápido

- [ ] Mostrar como iniciar (duplo clique no atalho)
- [ ] Explicar: **NÃO fechar a janela preta**
- [ ] Mostrar como parar (atalho ou fechar janela)
- [ ] Mostrar `VERIFICAR_STATUS.bat` para troubleshooting
- [ ] Entregar `LEIA-ME.txt` impresso ou PDF

---

## 🎯 DEMONSTRAÇÃO DOS DIFERENCIAIS (10 min)

### 5.1 Flexibilidade dos Tribunais

- [ ] Mostrar arquivo `backend/services/pje_comunica.py`
- [ ] Apontar linha: `TRIBUNAIS = ['TJSP', 'TRF3', 'TRT2', 'TRT15']`
- [ ] Explicar: "Para adicionar outro tribunal (ex: TRT1):
  1. Basta adicionar 'TRT1' nesta lista
  2. Reiniciar sistema
  3. Pronto! Novo tribunal aparece automaticamente nos filtros"

### 5.2 Busca Inteligente

- [ ] Explicar: Sistema faz 2 buscas por tribunal (OAB + Nome)
- [ ] Total: 4 tribunais × 2 buscas = 8 consultas paralelas
- [ ] Deduplicação automática de resultados
- [ ] Mostra resumo de quantas publicações foram encontradas

### 5.3 Renderização de HTML

- [ ] Buscar publicação que tenha HTML (tabelas, seções)
- [ ] Mostrar que tabelas e formatação são preservadas
- [ ] Comparar com outras ferramentas (se aplicável)

---

## 📞 PÓS-INSTALAÇÃO

### Informações de Suporte

- [ ] Deixar número de contato para suporte
- [ ] Explicar horário de atendimento
- [ ] Mencionar que pode adicionar funcionalidades conforme necessidade

### Próximas Funcionalidades (Mencionar)

- ⚖️ **Processos**: Gestão de processos judiciais
- 📅 **Agenda**: Prazos e compromissos
- 📊 **Relatórios**: Estatísticas e dashboards
- 🔔 **Notificações**: Alertas de novas publicações
- 🌐 **Dashboard**: Visão geral do escritório

### Feedback

- [ ] Perguntar se ela tem sugestões
- [ ] Anotar prioridades para próximas features
- [ ] Agendar próximo encontro (se necessário)

---

## ⚠️ TROUBLESHOOTING COMUM

### Problema: "Endereço já está em uso"

**Solução**:

1. Executar `PARAR_SISTEMA.bat`
2. Aguardar 5 segundos
3. Executar `INICIAR_SISTEMA.bat` novamente

### Problema: Página não carrega

**Solução**:

1. Verificar se janela preta está aberta
2. Aguardar mais 10 segundos
3. Pressionar F5 no navegador
4. Se persistir, verificar `frontend.log`

### Problema: Publicações não aparecem

**Solução**:

1. Verificar conexão com internet
2. API PJe Comunica pode estar offline (raro)
3. Testar em outro período/tribunal
4. Verificar `backend.log` para erros

### Problema: Sistema lento

**Solução**:

1. Fechar outros programas
2. Verificar RAM disponível (Task Manager)
3. Considerar upgrade de hardware se persistir

---

## 📝 ANOTAÇÕES DA INSTALAÇÃO

**Horário de início**: **\_\_**  
**Horário de término**: **\_\_**  
**Problemas encontrados**:

-
-
-

**Configurações específicas**:

-
-

**Feedback do cliente**:

-
-

---

## ✅ ASSINATURA DE CONCLUSÃO

**Técnico**: **********\_********** Data: **_/_**/2026

**Cliente**: **********\_********** Data: **_/_**/2026

Sistema instalado e funcionando corretamente: [ ] SIM [ ] NÃO

---

## 🎉 MENSAGEM FINAL

Parabéns! O sistema está funcionando perfeitamente.

Lembre-se:

- Para INICIAR: Duplo clique no atalho "🏛️ Sistema Jurídico"
- Para PARAR: Duplo clique no atalho "Parar Sistema" ou feche a janela preta
- Em caso de dúvidas: Consulte `LEIA-ME.txt` ou entre em contato

**Aproveite seu novo sistema jurídico!** ⚖️✨

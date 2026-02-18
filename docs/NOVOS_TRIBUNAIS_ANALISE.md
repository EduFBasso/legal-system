# Análise: Novos Tribunais para Integração

**Data:** 18/02/2026  
**Solicitante:** Advogada  
**Status:** Em Análise

---

## 🆕 Sistemas Solicitados

### 1. TRF3 - Tribunal Regional Federal da 3ª Região (1º Grau)

**Descrição:** Consulta pública · Processo Judicial Eletrônico  
**Link fornecido:** https://share.google/lhdQtfSg45ii20b3A  
**Sistema:** PJe (Processo Judicial Eletrônico)

**Características conhecidas:**

- Jurisdição: SP, MS (federal)
- Sistema: PJe (mesmo sistema base do PJe Comunica)
- Tipo: Consulta processual (não DJE)
- Busca: Geralmente por número de processo, nome de parte, OAB

**URL esperada:**

- Base: `https://pje1g.trf3.jus.br/`
- Consulta: `/consultapublica/ConsultaPublica/listView.seam`

---

### 2. TRT-15 - Tribunal Regional do Trabalho da 15ª Região

**Descrição:** Página inicial - Consulta Processual  
**Link fornecido:** https://share.google/73TSmO4ifLgj3qTni  
**Sistema:** PJe-JT (Processo Judicial Eletrônico - Justiça do Trabalho)

**Características conhecidas:**

- Jurisdição: Campinas e região (trabalhista)
- Sistema: PJe-JT (variante do PJe para Justiça do Trabalho)
- Tipo: Consulta processual
- Busca: Por número de processo, nome de parte, CPF/CNPJ, OAB

**URL esperada:**

- Base: `https://pje.trt15.jus.br/`
- Consulta: `/consultaprocessual/`

---

### 3. TJSP eProc - Sistema eProc (1º Grau)

**Descrição:** Sistema de consulta unificada do TJSP  
**URL fornecida:** `eproc-consulta.tjsp.jus.br/consulta_1g/externo_controlador.php?acao=tjsp@consulta_unificada_publica/consultar`  
**Sistema:** eProc (sistema próprio do TJSP, diferente do ESAJ)

**Características conhecidas:**

- Jurisdição: São Paulo (estadual)
- Sistema: eProc (sistema mais moderno que ESAJ)
- Tipo: Consulta processual unificada
- Busca: Por número de processo, nome, OAB
- **Importante:** Processos digitais do TJSP estão migrando para eProc

**URL completa (HTTPS):**

```
https://eproc-consulta.tjsp.jus.br/consulta_1g/externo_controlador.php?acao=tjsp@consulta_unificada_publica/consultar
```

---

## 📊 Comparação: Sistema Atual vs Novos

### Sistema Atual (PJe Comunica)

- **O que faz:** Busca em Diários de Justiça Eletrônicos (DJE)
- **Como funciona:** API pública documentada
- **Busca por:** OAB, nome da advogada/parte
- **Resultado:** Publicações (intimações, despachos, sentenças publicados no DJE)
- **Tribunais:** TJSP, TRF3, TRF4, TRT2, TRT15, TST, STJ, STF

### Novos Sistemas Solicitados

- **O que fazem:** Consulta processual direta (ver andamento de processos)
- **Como funcionam:**
  - ❓ **TRF3/TRT15:** Provavelmente têm API ou precisam scraping
  - ❓ **eProc TJSP:** Interface web, pode ter ou não API pública
- **Busca por:** Número de processo, nome de parte, OAB (dependendo do sistema)
- **Resultado:** Dados do processo (partes, movimentações, documentos)
- **Objetivo:** Acompanhar processos específicos, não publicações gerais

---

## 🔍 Diferenças Fundamentais

### PJe Comunica (Atual)

```
Busca → DJE → Publicações do dia → Filtro OAB/Nome → Lista de intimações
```

- ✅ Automatizável (API pública)
- ✅ Busca ampla (todos os processos do tribunal)
- ✅ Notificações proativas (pega tudo que saiu no DJE)
- ❌ Só mostra o que foi publicado oficialmente

### Consulta Processual (Solicitado)

```
Busca → Número do processo → Dados completos → Movimentações
```

- ❓ Automatização depende de API (pode precisar scraping)
- ❌ Busca específica (precisa saber número do processo)
- ✅ Informações completas do processo
- ✅ Útil para acompanhar casos específicos

---

## 💡 Análise de Viabilidade

### Cenário 1: API Pública Disponível

**SE** TRF3/TRT15/eProc têm API pública similar ao PJe Comunica:

- ✅ **Viável:** Integração direta similar ao atual
- ⏱️ **Tempo estimado:** 2-3 dias por tribunal
- 🎯 **Benefício:** Busca automatizada por OAB/nome

### Cenário 2: Sem API (Web Scraping)

**SE** não têm API pública:

- ⚠️ **Viável mas complexo:** Scraping com Selenium/Playwright
- ⏱️ **Tempo estimado:** 5-7 dias por tribunal
- ⚠️ **Riscos:**
  - Quebra se mudarem o site
  - CAPTCHAs podem bloquear
  - Mais lento que API
  - Questões legais (verificar ToS)

### Cenário 3: Integração Híbrida

**Recomendação:** Manter PJe Comunica + Adicionar links diretos

- ✅ **Mais simples:** Não precisa integrar API/scraping
- ✅ **Rápido:** 2-3 horas de implementação
- ✅ **Confiável:** Usa sistemas oficiais
- ℹ️ **Como funciona:**
  1. Sistema continua buscando no PJe Comunica (DJE)
  2. Para cada publicação encontrada, adiciona links para:
     - ESAJ (atual)
     - eProc TJSP (novo)
     - TRF3 consulta (novo)
     - TRT15 consulta (novo)
  3. Advogada clica no link apropriado com número já copiado

---

## 🎯 Recomendação

### Opção A: Links Diretos (Recomendado)\*\*

**Tempo:** 2-3 horas  
**Complexidade:** Baixa  
**Manutenção:** Mínima

**Como funciona:**

1. Detecta tribunal da publicação
2. Gera link para sistema apropriado:
   - TJSP → Botões: [ESAJ] [eProc]
   - TRF3 → Botão: [Consulta PJe TRF3]
   - TRT15 → Botão: [Consulta PJe TRT15]
3. Mantém cópia automática do número
4. Advogada clica, sistema abre e cola

**Vantagens:**

- ✅ Implementação rápida
- ✅ Zero manutenção (usa sistemas oficiais)
- ✅ Não quebra se sites mudarem
- ✅ Sem questões legais
- ✅ Mesma UX que temos hoje

### Opção B: Integração Full com API

**Tempo:** 1-2 semanas (se APIs existirem)  
**Complexidade:** Alta  
**Manutenção:** Média-Alta

**Como funciona:**

1. Pesquisa se APIs públicas existem
2. Integra cada API
3. Busca direta por OAB em cada sistema
4. Unifica resultados

**Vantagens:**

- ✅ Busca mais completa
- ✅ Dados estruturados

**Desvantagens:**

- ❌ Leva muito tempo
- ❌ Pode não ter API pública
- ❌ Manutenção complexa

### Opção C: Web Scraping

**Tempo:** 2-3 semanas  
**Complexidade:** Muito Alta  
**Manutenção:** Alta

**Não recomendado:**

- ❌ Frágil (quebra fácil)
- ❌ Lento
- ❌ Questões legais
- ❌ CAPTCHAs

---

## 📋 Próximos Passos

### Imediato (Aguardando Decisão):

1. **Confirmar com advogada:** Qual é o objetivo?
   - [ ] Quer apenas links mais diretos para eProc/TRF3/TRT15?
   - [ ] Quer buscar ATIVAMENTE nesses sistemas (como PJe Comunica)?
2. **Se objetivo é links:** → **Opção A** (2-3 horas)
   - Adicionar botões para eProc, TRF3, TRT15
   - Testar com processos reais
3. **Se objetivo é busca ativa:** → Pesquisar APIs
   - Investigar documentação oficial
   - Testar endpoints
   - Avaliar viabilidade

### Perguntas para Advogada:

1. Você quer que o sistema **busque automaticamente** nesses tribunais?
2. Ou prefere ter **links rápidos** quando encontrar publicações lá?
3. Esses processos aparecem no PJe Comunica (DJE) ou são separados?

---

## 🔗 Links de Referência

### Documentações a Pesquisar:

- [ ] PJe TRF3: https://pje1g.trf3.jus.br/
- [ ] PJe TRT15: https://pje.trt15.jus.br/
- [ ] eProc TJSP: https://eproc-consulta.tjsp.jus.br/
- [ ] API PJe Comunica (atual): https://api-publica.datajud.cnj.jus.br/

### Documentação Útil:

- PJe Comunica (sistema atual): ✅ API pública documentada
- DataJud CNJ: Portal unificado de dados judiciais (pode ter APIs)

---

**Criado por:** GitHub Copilot  
**Próxima ação:** Decisão sobre Opção A, B ou C

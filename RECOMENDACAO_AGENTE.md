# 🎓 RECOMENDAÇÃO: TIPO DE AGENTE IDEAL PARA ESTE PROJETO

**Análise:** 24 de fevereiro de 2026  
**Projeto:** Legal System - Sistema de Gestão Jurídica para Advocacia  
**Contexto:** Django + React, SQLite local, 1 cliente (advogado)

---

## 📊 ANÁLISE DA EQUIPE NECESSÁRIA

### Perfil do Projeto

```yaml
Tipo: Web Application (Backend + Frontend)
Stack: Django REST + React + SQLite3
Escopo: MVP Completo
Tamanho: Pequeno (1 usuário, local)
Criticidade: Média (dados jurídicos sensíveis)
Timeline: 3-6 meses (roadmap definido)
```

---

## 🎯 RECOMENDAÇÃO PRINCIPAL

### ✅ **AGENTE FULL-STACK (ESPECIALISTA)**

**Uma pessoa/time que domine ambos lado backend e frontend.**

#### Por Quê?

1. **Projeto requer integração entre camadas**
   - Frontend precisa consumir API Django
   - Mudanças no backend afetam frontend (contrato de dados)
   - Precisa entender fluxo completo: UI → HTTP → ORM → SQLite

2. **Decisões de arquitetura afetam ambas as partes**
   - Estrutura de serializers Django impacta tipos de dados React
   - Filtros na API precisam ser pensados com UX em mente
   - Cache de frontend vs cache de servidor

3. **Debugging requer visão de 360°**
   - "Por que a busca é lenta?" → Pode ser query Django ineficiente ou rendering React
   - "Por que dados não salvam?" → Pode ser CORS, validação backend, ou erro na chamada HTTP

4. **Documentação é bem estruturada**
   - Roadmap claro (Fases 1-7)
   - Decisões já tomadas (não precisa discutir arquitetura)
   - Desenvolvimento é mais sobre implementação do que design

---

## 👤 PERFIL IDEAL DO DESENVOLVEDOR

### Experiências Obrigatórias

✅ **Backend Django (2+ anos)**

- [ ] Modelos (ORM)
- [ ] Serializers (DRF)
- [ ] ViewSets e Routers
- [ ] Filtros e busca
- [ ] Admin interface
- [ ] Migrations

✅ **Frontend React (2+ anos)**

- [ ] Hooks (useState, useEffect, useContext)
- [ ] Context API ou Redux
- [ ] Componentização
- [ ] Integração com API REST
- [ ] Validade de formulários
- [ ] Tratamento de erro

✅ **Banco de Dados**

- [ ] SQL básico
- [ ] SQLite (desenvolvimento)
- [ ] Relacionamentos (FK, M2M)

✅ **Conceitos Web**

- [ ] REST API
- [ ] HTTP methods (GET, POST, PUT, DELETE)
- [ ] CORS
- [ ] localStorage/sessionStorage
- [ ] Form validation

### Soft Skills Desejáveis

- 🎯 **Comunicação com cliente não-técnico**
  - Advogada não programa
  - Precisa explicar features em linguagem simples
  - Feedback qualitativo (não "código boilerplate")

- 📋 **Atenção ao detalhe**
  - Sistema jurídico: erros têm consequências
  - Validação de dados é crítica (CPF, CNPJ, número de processo)
  - Números-processo seguem formato CNJ específico

- 🎨 **UX/Acessibilidade**
  - Projeto menciona "acessibilidade" (fontes grandes, alto contraste)
  - Cliente é da saúde (clinic-system foi inspiração)
  - Interface deve ser intuitiva para não-dev

- 🚀 **Iniciativa**
  - Documentação bem estruturada = menos reuniões
  - Pode tomar decisões técnicas menores sem aprovação constante
  - Propor otimizações (se caso for usar índices no banco, etc)

---

## 📈 ESTRUTURA DE EQUIPE RECOMENDADA

### Opção 1: Uma Pessoa (⭐ RECOMENDADO)

```
┌──────────────────────────┐
│  Full-Stack Developer    │
│  (1 pessoa)              │
│                          │
│ ✅ Django + REST API     │
│ ✅ React + Hooks         │
│ ✅ SQLite3               │
│ ✅ Comunicação com cliente
└──────────────────────────┘

Vantagens:
+ Visão holística
+ Decisões rápidas
+ Menos overhead de comunicação
+ Responsável pelo sucesso do projeto

Desvantagens:
- Aprende enquanto faz (se novo em Django/React)
- Pode ficar sobrecarregado em picos
- Point of failure (se sair, projeto fica vulnerável)

Indicado para: Consultant, Freelancer, dev sênior em modo aprendizado
```

### Opção 2: Dois Developers (Especializados)

```
┌──────────────┐         ┌──────────────┐
│ Dev Backend  │ ◄────► │ Dev Frontend │
│   (1 pessoa) │ (API)  │   (1 pessoa) │
│              │         │              │
│ ✅ Django    │         │ ✅ React     │
│ ✅ REST API  │         │ ✅ Hooks     │
│ ✅ Banco     │         │ ✅ Styles    │
└──────────────┘         └──────────────┘
       ▲                        ▲
       └────────┬───────────────┘
         Semanal Sync Call
         (2h/semana)

Vantagens:
+ Especialização profunda
+ Pode trabalhar em paralelo
+ Melhor para equipes maiores

Desvantagens:
- Precisa comunicação semanal
- Contrato API precisa ser bem definido
- Mais overhead
- Mais caro

Indicado para: Agência com múltiplos projects, startup com budget
```

### Opção 3: Backend (Senior) + Frontend (Junior)

```
┌──────────────┐         ┌──────────────┐
│ Dev Backend  │ ◄────► │ Dev Frontend │
│   (Senior)   │ (API)  │   (Junior)   │
│              │         │              │
│ Lead Backend │         │ Aprendendo   │
│ Arquitetura  │         │ React        │
└──────────────┘         └──────────────┘

Vantagens:
+ Backend bem estruturado
+ Junior aprende com senior feedback
+ Mais barato que 2 seniors

Desvantagens:
- Precisa mentoring frequente
- Timeline pode ser mais longa
- Junior pode ter curva de aprendizado

Indicado para: Agências em crescimento, bootcamp grads
```

---

## 💼 SKILLS ESPECÍFICAS DO PROJETO

### Must-Have (Obrigatório)

| Skill       | Nível        | Razão                                               |
| ----------- | ------------ | --------------------------------------------------- |
| Django      | Senior       | Modelos complexos (Case + CaseParty + CaseMovement) |
| React Hooks | Intermediate | Project usa Context + custom hooks                  |
| REST API    | Intermediate | Todo o FE/BE é comunicação HTTP                     |
| Git/GitHub  | Intermediate | Versionamento de migrations + features branches     |
| SQLite3     | Beginner     | Básico suficiente (Django ORM cuida do resto)       |
| CSS/Layout  | Intermediate | Design já existe (palette.css), só aplicar          |

### Nice-to-Have (Bônus)

| Skill                 | Benefício                          |
| --------------------- | ---------------------------------- |
| django-filter         | Filtros na API prontos             |
| pytest                | Testes de backend existem          |
| vitest                | Testes de frontend configurados    |
| Acessibilidade (WCAG) | Projeto é acessível                |
| Jurídico (básico)     | Entender termos jurídicos ajuda UX |
| Publicações/Tribunais | Conhecimento de PJe é bônus        |

---

## 📅 ESTIMATIVA DE TIMELINE

### Com 1 Full-Stack Developer (Senior)

```
Fase 2: Refatoração    | 1-2 semanas   (componentes comuns)
Fase 4: Cases          | 4-6 semanas   (models + views + UI)
Fase 5: Notificações   | 2-3 semanas   (Web Push + email)
Fase 6: Relatórios     | 2-3 semanas   (PDF/charts)
Fase 7: Multi-user     | 3-4 semanas   (auth + permissions)
─────────────────────────────────────────────────
TOTAL                  | 12-18 semanas (3-4.5 meses)
```

### Com 2 Developers (Back + Front)

```
Pode fazer paralelo, mas precisa de mais overhead de coordenação.
Timeline não melhora muito (dependências entre fases).
Estimativa: 10-16 semanas
```

---

## 🎬 ONBOARDING ESPERADO

### Dia 1

```
- Ler ESTADO_DO_PROJETO.md (30min)
- Ler ARQUITETURA_VISUAL.md (45min)
- Ler DECISOES_CONFIRMADAS.md (30min)
- Fazer git clone + setup local (1h)
- Rodar testes (30min)
```

### Dia 2

```
- Explorar código existente (contacts + publications)
- Entender fluxo de dados
- Fazer primeiro commit (fix menor ou docs)
```

### Semana 1

```
- Entender roadmap completo
- Conhecer a advogada (feedback)
- Propor timeline refinado
- Começar Fase 4 (Cases) ou Fase 2 (Refatoração)
```

---

## 💰 ESTIMATIVA DE CUSTOS

### Full-Stack Developer (Freelancer/Contractor)

```
Taxa horária: R$ 100-300/hora (varia por experiência)

Caso 1: Desenvolvimento Full-Time (40h/semana)
Semanas: 12-18
Custo: (12-18) × 40 × R$ 150 = R$ 72.000 - R$ 108.000

Caso 2: Desenvolvimento Part-Time (20h/semana)
Semanas: 24-36
Custo: (24-36) × 20 × R$ 150 = R$ 72.000 - R$ 108.000

Caso 3: Desenvolvimento On-Demand (pontos críticos)
Horas: 400-600 (depende do escopo)
Custo: 400-600 × R$ 150 = R$ 60.000 - R$ 90.000
```

### Agência/ Consultoria

```
Projeto custom pequeno: R$ 15.000 - R$ 25.000
Projeto custom médio: R$ 25.000 - R$ 50.000
Suporte + manutenção: R$ 2.000 - R$ 5.000/mês (1 ano)
```

---

## 🔍 COMO AVALIAR CANDIDATO

### Entrevista Técnica (45 min)

```
1. Django Questions (10min)
   - Como você estruturaria um modelo com relacionamento M2M?
   - Qual a diferença entre Serializer List e Detail?
   - Como lidar com filtros complexos?

2. React Questions (10min)
   - Quando usar Context API vs useState?
   - Como lidar com chamadas HTTP em useEffect?
   - Como estruturaria componentes reutilizáveis?

3. Database Questions (5min)
   - Como você faria migração de estrutura sem perder dados?

4. Project-Specific (10min)
   - Qual a dificuldade em vincular Case ↔ Contact (M2M)?
   - Como testaria busca de publicações em múltiplos tribunais?
   - Abordagem para acessibilidade?

5. Soft Skills (10min)
   - Como comunicaria delay ao cliente?
   - Experiência com cliente não-técnico?
```

### Teste Prático (2-3 horas, opcional)

```
Option 1: Code Review
- Dar um PR do projeto
- Pedir feedback técnico
- Ver qualidade de comentários

Option 2: Implementar Feature Pequena
- "Implemente validação de CPF no Contact"
- Avaliar código + testes

Option 3: Troubleshooting
- "O frontend não conecta no backend, o que faz?"
- Ver pensamento sistemático
```

---

## ✅ CHECKLIST PARA CONTRATAÇÃO

Antes de contratar, verifique:

- [ ] Portfolio com 2+ projetos Django
- [ ] Portfolio com 2+ projetos React
- [ ] Experiência com REST API
- [ ] Experiência com git/GitHub
- [ ] Disponibilidade (20h+ semana)
- [ ] Timezone compatível (se remoto)
- [ ] Fez entrevista técnica satisfatoriamente
- [ ] Está disposto a aprender sobre área jurídica
- [ ] Comunicação clara em português (para conversar com cliente)
- [ ] Preferência: Desenvolvedor que gosta de trabalhar sozinho/independente

---

## 🚀 ALTERNATIVAS CONSIDERADAS (E REJEITADAS)

### ❌ "Vou usar Agente Geral"

**Por quê não:**

- Não especializado em Django/React
- Precisaria fazer muitas perguntas básicas
- Configuração inicial levaria mais tempo
- Debugging mais lento

**Quando usar:**

- Tarefas menores (docs, scripts)
- Refatoração isolada

---

### ❌ "Dois Developers (Frontend + Backend)"

**Por quê não:**

- Overhead de comunicação maior
- Fases são sequenciais (não muito paralelização)
- Contrato API precisa ser bem definido antecipadamente
- Custa ~30% mais

**Quando usar:**

- Se timeline é crítica (need it yesterday)
- Projeto maior (10-15 features simultâneas)
- Team builder setup

---

### ❌ "Contratar 2-3 Developers Tempo Integral"

**Por quê não:**

- Overkill para projeto de escopo pequeno
- Projeto já começado (curva aprendizado longa)
- Só 1 cliente (feedback, não múltiplas iterações)

**Quando usar:**

- Projeto devient muito grande
- Precisa de 24/7 uptime
- Multiple features em paralelo sempre

---

## 🎯 CONCLUSÃO

### Recomendação Final

**Para este projeto específico:**

✅ **1 Developer Full-Stack Senior/Intermediate**

**Perfil:**

- 5+ anos de experiência (total)
- Domina Django + React
- Comunicador claro
- Gosta de ownership (responsável pelo sucesso)
- Pode trabalhar com autonomia

**Benefícios:**

- Visão estratégica completa
- Menos overhead
- Decisões rápidas
- Cliente satisfeito (menos meetings)
- Custo controlado

**Timeline esperado:**

- Setup + onboarding: 1 semana
- Desenvolvimento: 12-18 semanas
- Suporte + ajustes: ongoing

**Valor esperado:**

- R$ 60.000 - R$ 100.000 (projeto completo)
- Ou R$ 2.000-3.000/mês (retainer anual)

---

## 📞 PRÓXIMOS PASSOS

1. **Decida o modelo:** Full-time, freelancer, agência?
2. **Recrute candidato:** Use checklist acima
3. **Faça onboarding:** Siga roteiro de dias 1-7
4. **Inicie Fase 4:** Cases (próximo foco)
5. **Feedback com advogada:** Semanal ou bi-semanal
6. **Ajuste timeline:** Se necessário

---

**Documento preparado:** 24 de fevereiro de 2026  
**Validade:** 1 ano (revisar se projeto muda radicalmente)

# DIAGNÓSTICO E PLANO DE MODULARIZAÇÃO

## 🐛 Problema Identificado

**Sintoma:** Card da sidebar mostra "4 publicações" mas página exibe "0 resultados"

**Causa Provável:**

- Quando usuário já está em `/publications` e clica no card, `navigate()` não trigga `useEffect`
- A navegação para mesma rota não recarrega o estado

## ✅ Diagnóstico Banco de Dados

```
✅ 7 publicações no total
✅ 4 publicações de 10-12/02
✅ 3 publicações de 18/02
✅ Nenhuma duplicação
✅ Endpoint retorna corretamente
```

## 📋 Plano de Modularização

### 1. **Fase 1: Corrigir Bug Atual** ⏳

- Adicionar `key` ou forçar remontagem do componente
- Ou usar navegação programática diferente
- **Tempo estimado:** 15 min

### 2. **Fase 2: Separar Lógica de Negócio**

- Criar hook customizado `usePublications()`
- Extrair lógica de fetch para serviço
- **Tempo estimado:** 30 min

### 3. **Fase 3: Separar Componentes**

- `PublicationsList` (lista + empty state)
- `PublicationsFilters` (formulário de busca)
- `PublicationsStats` (resumo última busca)
- **Tempo estimado:** 45 min

### 4. **Fase 4: Adicionar Estado Global** (opcional)

- Context API ou Zustand
- Cache de publicações
- **Tempo estimado:** 1h

## 🎯 Abordagem Recomendada

**Opção A - Rápida:** Corrige bug + pequena refatoração (30 min)
**Opção B - Completa:** Modularização total (2h30)

Qual prefere?

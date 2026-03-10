# Analise Comparativa da Refatoracao de Movimentacoes (2026-03-10)

## Escopo e referencias

- Baseline pre-refatoracao: commit `a43ac40` (fim da Fase 1).
- Estado atual analisado: commit `a1e2ed7` (HEAD em `feature/cases`).
- Arquivos foco:
- `frontend/src/components/CaseTabs/MovimentacoesTab.jsx`
- `frontend/src/components/CaseTabs/MovimentacaoCard.jsx`
- `frontend/src/components/CaseTabs/MovimentacaoDisplay.jsx`
- `frontend/src/components/CaseTabs/MovimentacaoEditForm.jsx`
- `frontend/src/components/CaseTabs/TasksInlineList.jsx`
- `frontend/src/pages/CaseDetailPage.jsx`
- `frontend/src/pages/CaseDetailPage.css`

## Resumo executivo

A refatoracao trouxe ganho estrutural relevante (quebra de componente monolitico), mas houve regressao de UX/semantica em interacoes de destaque e em tipografia/espacamento visual. Ha tambem codigo legado de modal de movimentacao ainda ativo em `CaseDetailPage.jsx`, em paralelo ao fluxo inline atual, o que aumenta risco de inconsistencias.

Conclusao de viabilidade: e viavel corrigir incrementalmente sem rollback completo. O rollback integral so vale a pena se a prioridade absoluta for estabilizar em poucas horas sem preservar modularizacao.

## Delta tecnico (volume de mudancas)

Comparativo `a43ac40..a1e2ed7` em componentes de movimentacao:

- 6 arquivos alterados
- 1064 insercoes
- 1114 remocoes

Principais efeitos:

- `MovimentacoesTab.jsx` saiu de logica/renderizacao monolitica para orquestracao.
- Logica foi distribuida em subcomponentes reutilizaveis.

## Ganhos confirmados da refatoracao

- Separacao de responsabilidades:
- `MovimentacaoCard.jsx`: casca e composicao.
- `MovimentacaoDisplay.jsx`: visualizacao de movimento.
- `MovimentacaoEditForm.jsx`: edicao inline.
- `TasksInlineList.jsx`: tarefas vinculadas e formularios inline.
- Melhor testabilidade por unidade (componentes menores e mais previsiveis).
- Reuso de utilitarios (`movementUtils.js`).

## Regresssoes e riscos identificados

### 1) Selecao manual de tarefa foi enfraquecida (impacto alto)

No baseline havia clique na tarefa para alternar selecao e limpar destaque auxiliar (estado de leitura/identificacao manual):

- Evidencia antiga: `setSelectedTaskId(selectedTaskId === task.id ? null : task.id)` e `setAuxiliarHighlightedTaskId(null)` no bloco de tarefa em `a43ac40`.

No estado atual, `TasksInlineList.jsx` apenas usa `selectedTaskId` para estilo, mas nao dispara atualizacao desse estado ao clicar no card da tarefa.
Risco: perda da interacao esperada para "identificar qual tarefa foi lida dentro da movimentacao".

### 2) Tipografia e densidade visual mudaram (impacto medio)

No baseline havia texto mais proeminente em partes do card de movimentacao/tarefa. Na modularizacao atual, varios blocos adotaram fontes menores e espacamentos mais compactos.
Risco: perda de legibilidade e percepcao de hierarquia para uso juridico intensivo.

### 3) Fluxo de edicao duplicado (inline + modal legado) (impacto alto)

`CaseDetailPage.jsx` ainda mantem estado, handlers e renderizacao do modal legado:

- `showMovimentacaoModal`, `editingMovimentacaoId`, `movimentacaoFormData`.
- `handleOpenMovimentacaoModal`, `handleSaveMovimentacao`, `handleEditMovimentacao`, `handleCloseMovimentacaoModal`.
- renderizacao do modal em bloco condicional no fim da pagina.

Ao mesmo tempo, a aba atual usa edicao inline via `MovimentacoesTab`.
Risco: codigo obsoleto e caminhos funcionais concorrentes.

### 4) Prop legado potencialmente ociosa em `MovimentacoesTab` (impacto medio)

`onEdit` continua na assinatura de props de `MovimentacoesTab.jsx`, mas o fluxo inline usa `onEditStart` interno de card.
Risco: ambiguidade arquitetural e manutencao confusa.

## Analise de viabilidade: rollback vs correcao incremental

### Opcao A: rollback completo da Fase 2

Como seria:

- Reverter commits de modularizacao e voltar ao baseline monolitico.
- Reaplicar melhorias de forma controlada.

Prós:

- Retorno rapido ao comportamento historico conhecido.
- Menor incerteza imediata em UX.

Contras:

- Perda do ganho arquitetural ja conquistado.
- Retrabalho alto para modularizar novamente.
- Risco de reintroduzir duplicacoes antigas.

Estimativa: 4h a 8h para rollback funcional + nova rodada de ajustes.

### Opcao B: correcao incremental sobre base modular (recomendada)

Como seria:

- Restaurar interacao de selecao de tarefa no componente novo.
- Ajustar tipografia/espacamento para paridade com baseline.
- Desativar/remover fluxo legado de modal em `CaseDetailPage` apos validacao.

Pros:

- Preserva modularizacao (beneficio de medio/longo prazo).
- Escopo de correcoes e localizado (3 a 5 arquivos principais).
- Menor custo total que rollback + refatorar novamente.

Contras:

- Exige uma rodada disciplinada de QA funcional.

Estimativa: 3h a 6h para recuperar paridade funcional e visual com risco controlado.

## Recomendacao objetiva

Recomendo **nao fazer rollback completo agora**.

Melhor caminho:

1. Aplicar "paridade funcional" no codigo modular (selecao de tarefa + destaque persistente por leitura).
2. Aplicar "paridade visual" (tipografia, espacamentos e contraste) com base no baseline.
3. Marcar modal legado como obsoleto e remover fluxo duplicado em `CaseDetailPage.jsx` em etapa separada com commit proprio.

## Plano de execucao sugerido (com checkpoints)

1. Commit 1: restaurar clique de selecao de tarefa em `TasksInlineList.jsx` e integrar setter no `MovimentacoesTab.jsx`.
2. Commit 2: ajustar tipografia/espacamento para paridade com baseline em `MovimentacaoDisplay.jsx`, `TasksInlineList.jsx`, `MovimentacaoCard.jsx`.
3. Commit 3: remover prop/handler obsoletos e iniciar descomissionamento do modal legado em `CaseDetailPage.jsx`.
4. Commit 4: teste manual orientado (destaque 2 fases, selecao de tarefa, edicao inline, criacao de tarefa, navegacao entre abas).

## Criterio de reversao tardia (se necessario)

Se apos Commit 2 ainda houver regressao critica em fluxo de leitura/destaque, considerar rollback parcial apenas da UX de movimentacoes, mantendo utilitarios/hooks extraidos.

## Estado de decisao

A estrategia de documentar + comparar esta concluida e viavel. Com base nos achados atuais, a opcao de correcao incremental no codigo modular oferece melhor relacao risco/beneficio que restaurar tudo e refazer do zero.

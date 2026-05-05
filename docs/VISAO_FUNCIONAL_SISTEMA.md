# Visao Funcional do Sistema

## Objetivo

O Legal System foi desenhado para a operacao diaria de um escritorio de advocacia com varios advogados no mesmo ambiente. O foco e transformar publicacoes e eventos processuais em acompanhamento pratico, com rastreabilidade e organizacao operacional.

## Fluxos Principais

### 1) Publicacao para processo

1. O sistema consulta publicacoes (PJe Comunica e fontes associadas).
2. A publicacao e analisada e pode ser vinculada a um processo existente.
3. Quando vinculada, pode ser registrada como movimentacao processual.
4. A equipe cria as tarefas necessarias a partir da movimentacao.

### 2) Publicacao para novo processo

1. Se a publicacao nao tiver processo correspondente no sistema, o usuario pode criar o processo a partir da publicacao.
2. O processo nasce com dados iniciais relevantes.
3. A publicacao de origem fica rastreavel no historico.

### 3) Processo manual

1. O usuario pode abrir processo manualmente sem depender de publicacao.
2. Depois, pode vincular publicacoes futuras ao mesmo processo.

### 4) Movimentacoes e tarefas

1. O caso recebe movimentacoes processuais.
2. O advogado cria tarefas processuais e tarefas operacionais.
3. Cada tarefa pode ter prazo, urgencia e status.
4. O painel de prazos ajuda no acompanhamento do escritorio como um todo.

## Entidades de Negocio (alto nivel)

- Processo (Case): nucleo do acompanhamento juridico.
- Parte/Vinculo (CaseParty): relacao de pessoas e papeis no processo.
- Movimentacao (CaseMovement): historico do andamento.
- Prazo (CasePrazo): controle de prazos processuais vinculados a movimentacao.
- Tarefa (CaseTask): acao operacional do escritorio.
- Publicacao (Publication): insumo de acompanhamento e gatilho de movimentacao.
- Pagamento e Despesa: controle financeiro por processo.

## Perfis e Permissoes

### Administrador (perfil master)

- Cria e gerencia contas de advogados.
- Pode operar com escopo ampliado da equipe.
- Acompanha dados administrativos e financeiros.
- Mantem padroes e configuracoes do sistema.

### Advogado

- Opera seus processos, publicacoes, movimentacoes e tarefas.
- Gerencia partes, representacoes e pessoas vinculadas.
- Acompanha prazos e status dos casos.

## Decisoes Funcionais Importantes

- Tarefas nao sao criadas automaticamente a partir de publicacoes por seguranca juridica.
- A extracao de prazo serve como apoio, com validacao humana.
- O sistema suporta operacao multiusuario em escritorio unico.

## Referencias

- Resumo geral: [README.md](../README.md)
- Auditoria backend: [docs/AUDITORIA_BACKEND_CASES.md](AUDITORIA_BACKEND_CASES.md)
- Auditoria frontend: [docs/AUDITORIA_FRONTEND_CASES_FASE2.md](AUDITORIA_FRONTEND_CASES_FASE2.md)
- Historico de mudancas: [docs/CHANGELOG.md](CHANGELOG.md)

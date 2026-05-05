# Legal System

Sistema juridico multiusuario para escritorios de advocacia, com foco em acompanhamento de processos, publicacoes, movimentacoes, tarefas e gestao operacional do escritorio.

## Visao Geral

O sistema foi adaptado para a rotina real de um escritorio de advocacia. Ele permite centralizar o acompanhamento de processos, organizar pessoas relacionadas, registrar movimentacoes, controlar tarefas e apoiar a gestao interna por multiplos advogados no mesmo ambiente.

O fluxo principal parte das publicacoes: o sistema pode buscar e rastrear publicacoes, vincular uma publicacao a um processo existente e registrar essa publicacao como movimentacao do processo. Quando o processo ainda nao existe, tambem permite criar o processo a partir da propria publicacao. Alem disso, o cadastro manual de processos continua disponivel para casos que nao entram por publicacao.

## Principais Funcionalidades

- Busca e rastreamento de publicacoes juridicas.
- Vinculacao de publicacao a processo existente.
- Criacao de processo a partir de uma publicacao.
- Cadastro manual de processos.
- Registro de movimentacoes processuais.
- Criacao de tarefas processuais com diferentes prazos e niveis de urgencia.
- Criacao de tarefas internas relacionadas a pessoas ou rotinas do escritorio.
- Cadastro e vinculo de pessoas relacionadas ao processo.
- Controle de partes, inclusive parte representada e vinculos entre participantes.
- Definicao de processo principal em cenarios com relacionamento entre processos.
- Cadastro de contas de advogados pelo administrador.
- Visoes administrativas e informacoes financeiras.
- Uso por varios advogados no mesmo escritorio.

## Estrutura do Sistema

### Backend

- Django + Django REST Framework.
- Apps principais em [backend/apps](backend/apps):
  - `accounts`: contas, permissoes e escopo.
  - `cases`: processos, partes, movimentacoes, tarefas e dados relacionados.
  - `contacts`: pessoas e contatos usados no escritorio e nos processos.
  - `notifications`: notificacoes internas.
  - `publications`: fluxo de publicacoes e integracoes associadas.

### Frontend

- React + Vite.
- Interface voltada para operacao diaria do escritorio.

### Ferramentas auxiliares

- Utilitarios e integracoes em [tools](tools), incluindo apoio a coleta de publicacoes.

## Perfis de Uso

### Administrador

- Cadastra contas de advogados.
- Acompanha informacoes administrativas e financeiras.
- Mantem a base organizada para operacao do escritorio.
- Pode operar com visao de equipe quando aplicavel ao escopo master.

### Advogado

- Acompanha publicacoes e processos.
- Registra movimentacoes.
- Cria tarefas processuais e tarefas internas.
- Gerencia partes, representacoes e pessoas relacionadas.

## Permissoes Basicas

- O perfil administrador/master e responsavel por gestao de contas e visoes gerenciais.
- O perfil advogado atua na rotina juridica (processos, publicacoes, movimentacoes e tarefas).
- O escopo de dados segue regras de equipe para evitar vazamento entre usuarios sem permissao.

## Fluxo Resumido

1. O sistema busca ou recebe publicacoes.
2. A publicacao pode ser vinculada a um processo ja existente.
3. Se o processo ainda nao existir, ele pode ser criado a partir da publicacao.
4. A publicacao vira uma movimentacao do processo quando apropriado.
5. A equipe juridica acompanha o caso, registra novas movimentacoes e cria tarefas com prazo.
6. O escritorio tambem pode cadastrar processos manualmente e manter tarefas nao dependentes de publicacao.

## Execucao Local

### Pre-requisitos

- Python 3.12+
- Node.js 20+

### Workspace recomendado

Para este tipo de projeto, o recomendado e abrir o arquivo [legal-system.code-workspace](legal-system.code-workspace) no VS Code.

### Configuracao manual do ambiente

1. Copie o template [backend/.env.example](backend/.env.example) para `backend/.env`.
2. Preencha valores locais (sem dados reais de cliente/advogada no repositorio).
3. Em servidor, use credenciais exclusivas e `DEBUG=False`.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Enderecos padrao

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`
- Admin Django: `http://127.0.0.1:8000/admin`

## Observacoes

- O projeto possui separacao entre backend, frontend, documentacao e ferramentas auxiliares.
- O ambiente virtual Python grava caminho absoluto; se a pasta do projeto for movida, o `.venv` deve ser recriado.
- Em ambiente profissional, e recomendavel manter o projeto aberto via arquivo `.code-workspace`.

## Documentacao complementar

- Historico de mudancas: [docs/CHANGELOG.md](docs/CHANGELOG.md)
- Visao funcional detalhada: [docs/VISAO_FUNCIONAL_SISTEMA.md](docs/VISAO_FUNCIONAL_SISTEMA.md)
- Plano de infra e migracao: [docs/INFRA_E_MIGRACAO_PLANO.md](docs/INFRA_E_MIGRACAO_PLANO.md)
- Auditoria backend: [docs/AUDITORIA_BACKEND_CASES.md](docs/AUDITORIA_BACKEND_CASES.md)
- Auditoria frontend: [docs/AUDITORIA_FRONTEND_CASES_FASE2.md](docs/AUDITORIA_FRONTEND_CASES_FASE2.md)

# Infra e Migracao - Plano Pratico

## Objetivo

Organizar deploy remoto, endurecer seguranca operacional e preparar migracao SQLite para PostgreSQL de forma reproduzivel.

## 1. Revisao da pasta infra

Arquivos atuais em [infra](../infra):

- [infra/deploy.sh](../infra/deploy.sh): util para servidor Linux com systemd (manter).
- [infra/legal-system.service](../infra/legal-system.service): unidade systemd do backend (manter).
- [infra/backend_prod.cmd](../infra/backend_prod.cmd): util para Windows (avaliar uso real).
- [infra/frontend_prod.cmd](../infra/frontend_prod.cmd): util para Windows (avaliar uso real).
- [infra/reiniciar_sistema.bat](../infra/reiniciar_sistema.bat): util para Windows (avaliar uso real).

Recomendacao:

- Se o ambiente oficial for Linux remoto, manter Linux como caminho principal e mover scripts Windows para legado quando nao forem usados.
- Padronizar operacao principal em systemd + proxy reverso + TLS.

## 2. Servidor remoto - padrao recomendado

1. Backend Django via gunicorn + systemd.
2. PostgreSQL isolado na rede interna do servidor.
3. Frontend servido por nginx (build estatico).
4. HTTPS com certificado valido.
5. Backup diario de banco e storage.

## 3. PostgreSQL em container: vale a pena?

Sim, quando o objetivo e isolamento e previsibilidade.

Vantagens:

- Isolamento de versao e configuracao.
- Facil backup/restore com volume dedicado.
- Atualizacao controlada.
- Menor acoplamento com pacotes do sistema.

Cuidados:

- Nao expor porta do banco publicamente.
- Usar rede privada Docker e firewall.
- Persistir dados em volume nomeado.
- Guardar credenciais fora do repositorio.

## 4. Estrategia de migracao do zero (recomendada)

1. Preparar PostgreSQL no servidor (container ou servico gerenciado).
2. Criar banco e usuario com privilegios minimos.
3. Configurar [backend/.env](../backend/.env.example) com DATABASE_URL postgres.
4. Rodar migracoes do Django no destino.
5. Fazer export/import controlado do SQLite para o PostgreSQL.
6. Validar integridade (contagem de registros e amostragem funcional).
7. Virar trafego para novo banco.

## 5. Status do script atual de migracao

Arquivo analisado: [backend/migrate_sqlite_to_postgres.py](../backend/migrate_sqlite_to_postgres.py)

Resumo:

- E funcional para um caminho inicial de dumpdata/loaddata.
- Ainda mistura orientacao operacional com suposicoes de ambiente.
- Pode ser substituido por processo guiado e validacoes adicionais.

Decisao sugerida:

- Tratar o script atual como referencia historica.
- Implementar nova versao com:
  - dry-run,
  - logs detalhados,
  - validacao de contagem por modelo,
  - relatorio final de divergencias.

## 6. Checklist de seguranca de repositorio

- Nao versionar [backend/.env](../backend/.env.example).
- Manter apenas template [backend/.env.example](../backend/.env.example) com dados ficticios.
- Evitar nomes reais de clientes/advogados em docs e comentarios.
- Revisar anexos/arquivos legados antes de commit.

#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  deploy.sh — Script de instalação/atualização do backend no servidor Linux
#
#  PRIMEIRA VEZ:
#      chmod +x infra/deploy.sh
#      sudo infra/deploy.sh --install
#
#  ATUALIZAÇÕES:
#      sudo infra/deploy.sh
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ─── Configurações ───────────────────────────────────────────────────────────
APP_DIR="/opt/legal-system"
BACKEND_DIR="$APP_DIR/backend"
VENV_DIR="$APP_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"
PIP="$VENV_DIR/bin/pip"
MANAGE="$PYTHON $BACKEND_DIR/manage.py"
SERVICE_NAME="legal-system"
SYSTEMD_UNIT="/etc/systemd/system/$SERVICE_NAME.service"

# ─── Funções auxiliares ───────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
error() { echo -e "\033[1;31m[ERRO]\033[0m  $*"; exit 1; }

require_root() {
    [[ $EUID -eq 0 ]] || error "Execute como root: sudo $0 $*"
}

check_env() {
    [[ -f "$BACKEND_DIR/.env" ]] || error ".env não encontrado em $BACKEND_DIR/.env — copie o .env.example e configure."
    grep -q "^SECRET_KEY=django-insecure" "$BACKEND_DIR/.env" && \
        warn "SECRET_KEY ainda é o valor de exemplo. Gere uma chave segura!"
    grep -q "^DEBUG=True" "$BACKEND_DIR/.env" && \
        warn "DEBUG=True está ativo. Em produção, use DEBUG=False."
}

# ─── Instalação (primeira vez) ────────────────────────────────────────────────
install() {
    require_root

    info "Criando usuário e diretório da aplicação..."
    id legal &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin legal
    mkdir -p "$APP_DIR"
    chown -R legal:legal "$APP_DIR"

    info "Criando virtualenv..."
    python3 -m venv "$VENV_DIR"
    chown -R legal:legal "$VENV_DIR"

    info "Instalando dependências Python..."
    sudo -u legal "$PIP" install --upgrade pip --quiet
    sudo -u legal "$PIP" install -r "$BACKEND_DIR/requirements.txt" --quiet

    info "Verificando .env..."
    check_env

    info "Aplicando migrações..."
    sudo -u legal $MANAGE migrate --noinput

    info "Coletando arquivos estáticos..."
    sudo -u legal $MANAGE collectstatic --noinput

    info "Instalando serviço systemd..."
    cp "$(dirname "$0")/legal-system.service" "$SYSTEMD_UNIT"
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    systemctl start "$SERVICE_NAME"

    ok "Instalação concluída!"
    echo ""
    echo "  Próximos passos:"
    echo "  1. Crie o superusuário MASTER:"
    echo "       sudo -u legal $MANAGE createsuperuser"
    echo "  2. Verifique o status do serviço:"
    echo "       systemctl status $SERVICE_NAME"
    echo "  3. Veja os logs:"
    echo "       journalctl -u $SERVICE_NAME -f"
}

# ─── Atualização ─────────────────────────────────────────────────────────────
update() {
    require_root
    check_env

    info "Instalando/atualizando dependências..."
    sudo -u legal "$PIP" install -r "$BACKEND_DIR/requirements.txt" --quiet

    info "Aplicando migrações..."
    sudo -u legal $MANAGE migrate --noinput

    info "Coletando arquivos estáticos..."
    sudo -u legal $MANAGE collectstatic --noinput

    info "Reiniciando serviço..."
    systemctl restart "$SERVICE_NAME"
    sleep 2
    systemctl is-active --quiet "$SERVICE_NAME" && ok "Serviço ativo." || error "Serviço falhou ao iniciar. Veja: journalctl -u $SERVICE_NAME -n 50"

    ok "Atualização concluída!"
}

# ─── Status ───────────────────────────────────────────────────────────────────
status() {
    systemctl status "$SERVICE_NAME" --no-pager || true
    echo ""
    info "Últimas linhas de log:"
    journalctl -u "$SERVICE_NAME" -n 20 --no-pager || true
}

# ─── Entrypoint ───────────────────────────────────────────────────────────────
case "${1:-update}" in
    --install|-i) install ;;
    --status|-s)  status  ;;
    --update|-u|update|*) update ;;
esac

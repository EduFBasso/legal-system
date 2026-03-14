"""
gunicorn.conf.py — Configuração do servidor Gunicorn para produção

USO:
    gunicorn -c gunicorn.conf.py config.wsgi:application

Ajuste as variáveis abaixo conforme o servidor onde será instalado.
"""

import multiprocessing
import os

# ─── Rede ────────────────────────────────────────────────────────────────────
# Escuta em todas as interfaces na porta 8000
# Nginx (ou qualquer proxy) repassa o tráfego para cá
bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:8000')

# ─── Workers ─────────────────────────────────────────────────────────────────
# Regra clássica: 2 × núcleos + 1
# Para servidor pequeno (2 núcleos): 5 workers
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'          # sync é suficiente para WSGI Django puro
threads = 1                    # 1 thread por worker (padrão seguro)
timeout = 120                  # segundos — publicações PJe podem demorar

# ─── Logs ────────────────────────────────────────────────────────────────────
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')
accesslog = '-'    # stdout → capturado pelo systemd journal
errorlog  = '-'    # stderr → capturado pelo systemd journal
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(D)sµs'

# ─── Processo ────────────────────────────────────────────────────────────────
proc_name = 'legal-system-backend'
pidfile   = '/tmp/legal-system-gunicorn.pid'

# ─── Hooks de ciclo de vida ───────────────────────────────────────────────────
def on_starting(server):
    server.log.info("Legal System Backend iniciando...")

def worker_exit(server, worker):
    server.log.info(f"Worker {worker.pid} finalizado.")

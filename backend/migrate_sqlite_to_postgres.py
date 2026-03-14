"""
migrate_sqlite_to_postgres.py
═══════════════════════════════════════════════════════════════════
Migra dados do banco SQLite local para o PostgreSQL de produção.

USO:
    1. Configure DATABASE_URL no .env apontando para o PostgreSQL
    2. Certifique-se de que o PostgreSQL já rodou `migrate` (tabelas criadas)
    3. Execute:
           python scripts/migrate_sqlite_to_postgres.py

COMO FUNCIONA:
    - Usa `dumpdata` para exportar dados do SQLite
    - Usa `loaddata` para importar no PostgreSQL
    - Exclui tabelas de sessão e content types (recriados automaticamente)

PASSO A PASSO (no servidor):
    1. Copie db.sqlite3 para o servidor (opcional, se quiser preservar dados)
    2. Crie o banco PostgreSQL:
           createdb legal_system
           psql -c "CREATE USER legal_user WITH PASSWORD 'SenhaForte!23';"
           psql -c "GRANT ALL PRIVILEGES ON DATABASE legal_system TO legal_user;"
    3. Configure .env com DATABASE_URL=postgresql://...
    4. python manage.py migrate           # cria estrutura
    5. python scripts/migrate_sqlite_to_postgres.py  # migra dados
"""

import os
import sys
import subprocess
import tempfile
from pathlib import Path

# Garante que o Django está configurado
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from django.db import connections

SQLITE_PATH = BASE_DIR / 'db.sqlite3'

# Apps cujos dados devem ser migrados (ordem importa por FKs)
APPS_TO_DUMP = [
    'auth',                  # User, Group, Permission
    'apps.accounts',         # UserProfile
    'apps.contacts',         # Contact
    'apps.cases',            # Case, CaseParty, CaseMovement, etc
    'apps.publications',     # Publication, SearchHistory
    'apps.notifications',    # Notification
]

# Excluir modelos que causam conflito ou são recriados automaticamente
EXCLUDE_MODELS = [
    'contenttypes',
    'auth.permission',
    'sessions',
    'admin.logentry',
]


def check_postgres_connection():
    db_url = os.environ.get('DATABASE_URL', '')
    if not db_url.startswith('postgresql'):
        print("❌ DATABASE_URL não aponta para PostgreSQL.")
        print(f"   Atual: {db_url[:40]}...")
        print("   Configure .env com: DATABASE_URL=postgresql://user:pass@host:5432/dbname")
        sys.exit(1)
    try:
        conn = connections['default']
        conn.ensure_connection()
        print("✅ Conexão com PostgreSQL OK")
    except Exception as e:
        print(f"❌ Falha ao conectar ao PostgreSQL: {e}")
        sys.exit(1)


def check_sqlite_exists():
    if not SQLITE_PATH.exists():
        print(f"❌ SQLite não encontrado em: {SQLITE_PATH}")
        print("   Certifique-se de rodar este script na máquina com o banco local.")
        sys.exit(1)
    print(f"✅ SQLite encontrado: {SQLITE_PATH}")


def dump_sqlite(dump_file: str):
    """Exporta dados do SQLite para JSON usando Django dumpdata."""
    exclude_args = []
    for model in EXCLUDE_MODELS:
        exclude_args.extend(['--exclude', model])

    cmd = [
        sys.executable, str(BASE_DIR / 'manage.py'), 'dumpdata',
        '--database', 'sqlite_source',
        '--natural-foreign',
        '--natural-primary',
        '--indent', '2',
        '--output', dump_file,
        *exclude_args,
        *APPS_TO_DUMP,
    ]

    print(f"\n📤 Exportando dados do SQLite...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Erro no dumpdata:\n{result.stderr}")
        sys.exit(1)

    size = Path(dump_file).stat().st_size / 1024
    print(f"✅ Dados exportados ({size:.1f} KB) → {dump_file}")


def load_postgres(dump_file: str):
    """Importa dados para o PostgreSQL."""
    cmd = [
        sys.executable, str(BASE_DIR / 'manage.py'), 'loaddata',
        dump_file,
    ]

    print(f"\n📥 Importando dados no PostgreSQL...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Erro no loaddata:\n{result.stderr}")
        sys.exit(1)
    print(f"✅ Dados importados com sucesso!")
    if result.stdout:
        print(result.stdout)


def add_sqlite_alias():
    """Adiciona alias 'sqlite_source' apontando para o SQLite local."""
    settings.DATABASES['sqlite_source'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': str(SQLITE_PATH),
    }


def main():
    print("═" * 60)
    print("  MIGRAÇÃO SQLite → PostgreSQL")
    print("═" * 60)

    check_sqlite_exists()
    check_postgres_connection()
    add_sqlite_alias()

    with tempfile.NamedTemporaryFile(
        suffix='.json', prefix='legal_dump_', delete=False, mode='w'
    ) as f:
        dump_file = f.name

    try:
        dump_sqlite(dump_file)
        load_postgres(dump_file)

        print("\n" + "═" * 60)
        print("  ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO")
        print("═" * 60)
        print("\nPróximos passos:")
        print("  1. Verifique os dados no PostgreSQL via Django Admin")
        print("  2. Crie o superusuário MASTER se necessário:")
        print("       python manage.py createsuperuser")
        print("  3. Configure ALLOWED_HOSTS e CORS_ALLOWED_ORIGINS para o IP do servidor")
        print("  4. Inicie o servidor com gunicorn:")
        print("       gunicorn config.wsgi:application --bind 0.0.0.0:8000")

    finally:
        if Path(dump_file).exists():
            Path(dump_file).unlink()
            print(f"\n🗑️  Arquivo temporário removido: {dump_file}")


if __name__ == '__main__':
    main()

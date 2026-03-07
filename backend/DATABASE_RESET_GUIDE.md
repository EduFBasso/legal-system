# Database Reset Scripts

Scripts para limpar/resetar a base de dados SQLite do projeto.

## Opções Disponíveis

### 1️⃣ PowerShell (Recomendado)

```bash
cd backend
.\reset_database.ps1
```

**Vantagens:**

- Mais informações detalhadas
- Melhor feedback visual com cores
- Compatível com VS Code
- Se permissões negadas: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

### 2️⃣ Batch/CMD (Mais Simples)

```bash
cd backend
reset_database.bat
```

**Vantagens:**

- Funciona direto no CMD sem configs
- Clássico Windows batch
- Menos dependências

---

### 3️⃣ Manual via Terminal

Se preferir controle total:

```powershell
# Deletar banco
Remove-Item backend/db.sqlite3 -Force

# Ou deletar e recriar com migrations
cd backend
python manage.py migrate
```

---

## O que acontece?

✅ **Antes:**

- Seu arquivo `db.sqlite3` com todos os dados

❌ **Depois:**

- Arquivo deletado
- Novas migrações do Django aplicadas
- **Banco vazio e limpo**

---

## Quando usar?

| Situação                          | Comando                  |
| --------------------------------- | ------------------------ |
| Resetar completamente para testes | `.\reset_database.ps1`   |
| Deletar apenas um arquivo         | `Remove-Item db.sqlite3` |
| Carregar dados de exemplo         | Use scripts de fixtures  |
| Desenvolvimento fresh             | `.\reset_database.ps1`   |

---

## ⚠️ Aviso

- **Isto é destrutivo** - todos os dados serão perdidos permanently
- Use apenas em desenvolvimento
- Não execute em produção!
- Backup antes se crítico

---

## Troubleshooting

### PowerShell: "não é permitido executar scripts"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\reset_database.ps1
```

### Virtual environment não ativa

Scripts tentam ativar automaticamente da path `..\..\.venv\Scripts\Activate.ps1`
Se diferente, edite a variável `$venvPath` no script.

### Django.db.migrations.exceptions.MigrationConflict

Alguns modelos podem ter conflitos. Neste caso:

```bash
# Deletar manualmente migrations problem
# Rodar reset_database novamente
# Ou fazer makemigrations + migrate manual
```

---

## Scripts Customizados

Você pode criar variações:

**Apenas deletar (sem migrate):**

```powershell
Remove-Item "db.sqlite3" -Force
```

**Backup antes de deletar:**

```powershell
Copy-Item "db.sqlite3" "db.sqlite3.backup"
Remove-Item "db.sqlite3" -Force
python manage.py migrate
```

---

**Criado:** 2026-03-06  
**Projeto:** Legal System  
**Ambiente:** SQLite + Django

# 🚀 GUIA DE TRANSIÇÃO PARA CLOUD

**Quando a advogada pedir para colocar online**

---

## 📊 SITUAÇÃO ATUAL

```
Local-First (Agora)
├── Backend: Django local (SQLite3)
├── Frontend: Vite local
├── Acesso: Apenas rede local
└── Custo: R$ 0/mês
```

---

## ☁️ ARQUITETURA CLOUD (Futuro)

```
Cloud (Igual clinic-system)
├── Backend: Render.com (PostgreSQL)
├── Frontend: Vercel.com
├── Acesso: Internet (qualquer lugar)
└── Custo: R$ 50-100/mês
```

### Stack Comparativo

| Componente         | Local (Agora)    | Cloud (Futuro)      |
| ------------------ | ---------------- | ------------------- |
| **Backend**        | Django local     | Render.com          |
| **Database**       | SQLite3          | PostgreSQL          |
| **Frontend**       | Vite local       | Vercel              |
| **Autenticação**   | Nenhuma (1 user) | JWT + Sessions      |
| **HTTPS**          | HTTP local       | HTTPS automático    |
| **Backup**         | Manual (script)  | Automático (Render) |
| **Escalabilidade** | 1 usuário        | Ilimitado           |
| **Custo**          | R$ 0             | R$ 50-100/mês       |

---

## 📋 CHECKLIST DE MIGRAÇÃO

### Fase 1: Preparação (1-2 semanas)

#### Backend

- [ ] **Migrar SQLite → PostgreSQL**

  ```python
  # settings.py
  DATABASES = {
      'default': {
          'ENGINE': 'django.db.backends.postgresql',
          'NAME': os.getenv('DB_NAME'),
          'USER': os.getenv('DB_USER'),
          'PASSWORD': os.getenv('DB_PASSWORD'),
          'HOST': os.getenv('DB_HOST'),
          'PORT': os.getenv('DB_PORT', 5432),
      }
  }
  ```

- [ ] **Adicionar autenticação (JWT)**

  ```bash
  pip install djangorestframework-simplejwt
  pip install django-cors-headers
  ```

- [ ] **Configurar environment variables**

  ```bash
  # .env.production
  DEBUG=False
  SECRET_KEY=sua-chave-super-secreta-aqui
  ALLOWED_HOSTS=legal-system.onrender.com
  DATABASE_URL=postgresql://...
  ```

- [ ] **Adicionar Gunicorn**

  ```bash
  pip install gunicorn
  # requirements.txt
  gunicorn==21.2.0
  ```

- [ ] **Configurar arquivos estáticos**
  ```python
  # settings.py
  STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
  STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
  ```

#### Frontend

- [ ] **Configurar API URL dinâmica**

  ```javascript
  // src/services/api.js
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  ```

- [ ] **Build de produção**
  ```bash
  npm run build
  # Gera pasta dist/
  ```

---

### Fase 2: Deploy Backend (Render)

#### 2.1 Criar conta no Render

1. Acesse [render.com](https://render.com)
2. Conecte GitHub/GitLab
3. Escolha plano:
   - **Free:** 0 reais, dorme após inatividade
   - **Starter:** R$ 35/mês, sempre ativo ⭐
   - **Professional:** R$ 100+/mês, alta performance

#### 2.2 Configurar Web Service

```yaml
# render.yaml
services:
  - type: web
    name: legal-system-backend
    env: python
    buildCommand: "pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate"
    startCommand: "gunicorn config.wsgi:application"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        fromDatabase:
          name: legal-system-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: False
```

#### 2.3 Criar PostgreSQL Database

```
1. No Render dashboard
2. "New" → "PostgreSQL"
3. Nome: legal-system-db
4. Plano: Starter ($7/mês) ou Free
5. Conectar ao Web Service
```

#### 2.4 Migrar dados SQLite → PostgreSQL

```bash
# Local
python manage.py dumpdata --natural-foreign --natural-primary > data.json

# No Render (via shell)
python manage.py loaddata data.json
```

---

### Fase 3: Deploy Frontend (Vercel)

#### 3.1 Criar conta no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Conecte GitHub
3. Escolha plano:
   - **Hobby:** R$ 0/mês (suficiente) ⭐
   - **Pro:** R$ 100/mês (se precisar team)

#### 3.2 Importar projeto

```
1. "New Project"
2. Selecione repositório legal-system
3. Configure:
   - Framework Preset: Vite
   - Root Directory: frontend/
   - Build Command: npm run build
   - Output Directory: dist
```

#### 3.3 Configurar variáveis de ambiente

```
VITE_API_URL=https://legal-system-backend.onrender.com
VITE_API_TIMEOUT=30000
```

#### 3.4 Deploy

```
1. Clique "Deploy"
2. Aguarde build (~2 minutos)
3. Acesse URL: legal-system.vercel.app
```

---

### Fase 4: Autenticação (JWT)

Como agora pode ter acesso externo, precisa autenticação:

#### Backend

```python
# settings.py
INSTALLED_APPS += ['rest_framework_simplejwt']

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

# urls.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns += [
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
]
```

#### Frontend

```javascript
// src/services/auth.js
export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
};

// src/services/api.js
const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
```

---

## 💰 CUSTO ESTIMADO (CLOUD)

### Opção 1: Econômica (R$ 35-50/mês)

```
✅ Render Starter: R$ 35/mês
✅ Vercel Hobby: R$ 0/mês
✅ PostgreSQL (incluído no Render)
────────────────────────────
Total: R$ 35/mês
```

### Opção 2: Confortável (R$ 100/mês)

```
✅ Render Professional: R$ 70/mês
✅ Vercel Pro: R$ 30/mês
✅ PostgreSQL otimizado: Incluso
────────────────────────────
Total: R$ 100/mês
```

### Comparação com ERP/Odoo

```
Sistema Jurídico Genérico: R$ 300-800/mês
Seu sistema cloud custom:  R$ 35-100/mês
────────────────────────────────────────
Economia: R$ 200-700/mês! ✅
```

---

## 🚀 TIMELINE DE MIGRAÇÃO

```
Semana 1: Preparação
├── Configurar PostgreSQL local
├── Testar migrations
├── Adicionar JWT
└── Testar autenticação

Semana 2: Deploy
├── Deploy backend no Render
├── Migrar dados
├── Deploy frontend no Vercel
└── Conectar tudo

Semana 3: Testes
├── Testar todos os fluxos
├── Ajustar bugs
├── Validar com advogada
└── Go live! 🎉

Total: 2-3 semanas part-time
```

---

## 🔒 SEGURANÇA (CLOUD)

### A Adicionar

```
1. HTTPS automático (Render + Vercel)
2. JWT com refresh token
3. Rate limiting (django-ratelimit)
4. CORS restrito ao domínio
5. Secrets em environment variables
6. Backup automático diário
```

### Código exemplo

```python
# settings.py (production)
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

---

## 📊 COMPARATIVO: LOCAL vs CLOUD

| Feature               | Local (Agora)    | Cloud (Futuro)          |
| --------------------- | ---------------- | ----------------------- |
| **Acesso remoto**     | ❌ Não           | ✅ Sim (qualquer lugar) |
| **Backup automático** | ⚠️ Script manual | ✅ Automático           |
| **Escalabilidade**    | ❌ 1 usuário     | ✅ Múltiplos            |
| **Manutenção**        | 🛠️ Você          | ✅ Render/Vercel        |
| **HTTPS**             | ❌ HTTP          | ✅ HTTPS                |
| **Mobile**            | ⚠️ Rede local    | ✅ App-like             |
| **Custo**             | R$ 0             | R$ 35-100/mês           |
| **Setup**             | ✅ Simples       | ⚠️ Intermediário        |

---

## 📝 PRÓXIMOS PASSOS (QUANDO ELA PEDIR)

1. **Me avise** - Vou ajudar na migração
2. **Crie contas** - Render + Vercel (pode ser free no início)
3. **Teste local com PostgreSQL** - Antes de fazer deploy
4. **Migre dados** - Usar dumpdata/loaddata
5. **Deploy gradual** - Backend primeiro, depois frontend
6. **Validar com ela** - Antes de desligar local

---

## 🎯 POR QUE RENDER + VERCEL? (Igual clinic-system)

✅ **Você já conhece** (usou no clinic)  
✅ **Deploy automático** (push → deploy)  
✅ **Free tier generoso** (pode começar grátis)  
✅ **HTTPS automático**  
✅ **Escalabilidade** (cresce conforme precisar)  
✅ **Zero config** (quase tudo automático)  
✅ **Boa documentação**

---

## 🛡️ BACKUP NA CLOUD

Render faz backup automático do PostgreSQL:

- Diário (últimos 7 dias)
- Semanal (últimos 4 semanas)
- Mensal (últimos 3 meses)

Mas recomendo também:

```python
# Script de backup para S3/Dropbox
python manage.py dumpdata > backup_$(date +%Y%m%d).json
# Upload para cloud storage
```

---

**Conclusão:** Quando ela pedir, a migração é tranquila (2-3 semanas) e você já tem experiência com clinic-system! 🚀

---

**Documento criado:** 24/02/2026  
**Autor:** [Seu nome]  
**Baseado em:** Experiência com clinic-system (Render + Vercel)

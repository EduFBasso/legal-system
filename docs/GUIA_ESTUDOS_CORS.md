# 🎓 Guia de Estudos: CORS, APIs e Deploy

## 📚 Recursos Recomendados

### 🎥 Vídeos em Português

1. **CORS Explicado (Básico)**
   - Código Fonte TV - "O que é CORS? Cross-Origin Resource Sharing"
   - https://www.youtube.com/watch?v=GZV-FUdeVwE
   - Duração: ~10 min
   - ⭐ Essencial para entender o conceito

2. **APIs REST (Fundamentos)**
   - Filipe Deschamps - "O que é API? REST e RESTful?"
   - https://www.youtube.com/watch?v=ghTrp1x_1As
   - Duração: ~20 min
   - Explica GET, POST, PUT, DELETE

3. **Django REST Framework (Tutorial Completo)**
   - Hashtag Programação - "API REST com Django"
   - https://www.youtube.com/results?search_query=django+rest+framework+tutorial+português
   - Duração: ~1h
   - Você vai reconhecer muito do nosso código!

4. **React + Backend (Integração)**
   - DevSoutinho - "Como conectar React com Backend"
   - https://www.youtube.com/results?search_query=react+backend+api+fetch
   - Duração: ~30 min

### 📖 Artigos e Documentação

1. **MDN Web Docs - CORS (Português)**
   - https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS
   - Documentação oficial, super completa
   - ⭐ Referência definitiva

2. **Django CORS Headers (Oficial)**
   - https://github.com/adamchainz/django-cors-headers
   - README explica todas as configurações
   - É o pacote que instalamos!

3. **Vite - Proxy para Dev (Alternativa ao CORS)**
   - https://vitejs.dev/config/server-options.html#server-proxy
   - Como fazer proxy local (evita CORS em dev)

### 🛠️ Tutoriais Práticos

1. **Deploy Django + React (Render + Vercel)**
   - https://testdriven.io/blog/django-react/
   - Passo a passo completo
   - Mesma stack que usamos

2. **Configurar .env no Render**
   - https://render.com/docs/environment-variables
   - Como adicionar SECRET_KEY, DEBUG, etc

---

## 🎯 Ordem de Estudo Recomendada

### Dia 1: Fundamentos (1-2h)

1. ✅ Assistir vídeo CORS (10 min)
2. ✅ Ler MDN CORS (30 min)
3. ✅ Experimentar no nosso projeto (mudar portas, testar)

### Dia 2: APIs REST (2h)

1. ✅ Assistir vídeo APIs REST (20 min)
2. ✅ Testar nossos endpoints no Postman
3. ✅ Criar novo endpoint customizado (prática)

### Dia 3: Integração (2h)

1. ✅ Assistir vídeo React + Backend (30 min)
2. ✅ Analisar nosso `api.js` (service)
3. ✅ Adicionar tratamento de erro melhorado

### Dia 4: Deploy (3h)

1. ✅ Ler tutorial Deploy
2. ✅ Fazer deploy de teste no Render
3. ✅ Configurar variáveis de ambiente

---

## 🔬 Experimentos Práticos

### Experimento 1: Testar CORS Quebrado

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:9999',  # Porta errada de propósito
]
```

- Reinicie backend
- Tente acessar frontend (vai dar erro CORS)
- Veja erro no console do navegador
- Corrija e veja funcionar ✅

### Experimento 2: Testar API com curl

```bash
# Terminal
curl http://127.0.0.1:8000/api/contacts/
curl http://127.0.0.1:8000/api/contacts/1/
curl http://127.0.0.1:8000/api/contacts/?search=maria
```

### Experimento 3: Criar Endpoint Novo

```python
# views.py
@action(detail=False, methods=['get'])
def meu_teste(self, request):
    return Response({'mensagem': 'Funcionou!'})
```

- Acesse: http://127.0.0.1:8000/api/contacts/meu-teste/
- Chame do frontend

---

## 💡 Conceitos-Chave para Fixar

### 1. Origin = Protocolo + Host + Porta

```
http://localhost:5173  ← Frontend (QUEM pede)
http://127.0.0.1:8000  ← Backend (PARA ONDE vai)
```

### 2. Request Flow

```
Frontend → OPTIONS (preflight) → Backend verifica CORS
        ← 200 OK (autorizado)    ←
        → GET/POST (real request) →
        ← 200 + JSON data         ←
```

### 3. CORS Headers

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Credentials: true
```

---

## 🎓 Perguntas para Testar seu Conhecimento

Depois de estudar, tente responder:

1. ❓ Por que `localhost:5173` e `127.0.0.1:5173` são origins diferentes?
2. ❓ O que é preflight request (OPTIONS)?
3. ❓ Por que CORS existe? (segurança contra o quê?)
4. ❓ Posso desabilitar CORS no navegador? (e por que não devo?)
5. ❓ Em produção, devo usar `CORS_ALLOW_ALL_ORIGINS = True`? Por quê não?

---

## 🚀 Próximos Passos no Projeto

Quando voltar, vamos:

1. ✅ **Testar frontend visualmente** (já está pronto)
   - Verificar 3 colunas (Menu | Cards | Sidebar)
   - Ver 6 contatos carregados
   - Testar busca em tempo real

2. ✅ **Criar Modal de Detalhes**
   - Clicar no 👁️ abre modal
   - Mostra foto grande (200x200px)
   - Todos os campos do contato

3. ✅ **Form de Novo Contato**
   - Botão "+ Novo Contato"
   - Form com validação
   - Upload de foto

4. ✅ **Editar e Deletar**
   - Botão editar no modal
   - Confirmação antes de deletar

---

## 🎯 Filosofia do Projeto

### ✅ Nossa Abordagem: "Roupa Sob Medida"

```
❌ ERPs Genéricos (EASYJUR):
- 50+ campos por formulário
- Features que ninguém usa
- Interface confusa
- "Tamanho único" não serve ninguém bem

✅ Nosso Sistema:
- 17 campos essenciais (apenas o que a advogada usa)
- Acessibilidade em primeiro lugar (fontes grandes, contraste)
- Interface limpa e direta
- "Feito para UM usuário específico" = perfeito para ela
```

### 🎨 Design Principles

1. **Simplicidade** - Menos é mais
2. **Acessibilidade** - Fontes 14px+, contraste WCAG AAA
3. **Praticidade** - Só features que serão usadas
4. **Performance** - Carrega tudo, sem paginação (banco pequeno)
5. **Local-first** - Privacidade, fotos locais, SQLite

---

## 📊 Status do Projeto

**✅ Completo:**

- Backend API REST (CRUD + filtros + busca)
- Frontend estrutura (Header, Menu, Main, Sidebar)
- CORS configurado
- Node.js instalado
- 8 commits na branch feature/contacts

**🔄 Em Progresso:**

- Teste visual da integração

**📋 Próximos:**

- Modal de detalhes
- Form criar/editar
- Upload de foto
- Testes de usabilidade com advogada

---

## 🏆 Lema do Projeto

> "Meses para fazer certo, anos para usar feliz"  
> "Qualidade > Quantidade"  
> "Roupa sob medida, não tamanho único"

---

Bons estudos! 📚 Quando voltar, continuamos testando visualmente! 🚀

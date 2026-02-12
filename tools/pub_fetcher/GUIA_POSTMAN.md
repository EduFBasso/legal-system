# 🚀 Guia Completo - Testando API PJe Comunica com Postman

## 📥 1. Instalação do Postman

### Opção 1: Desktop App (Recomendado)
1. Acesse: https://www.postman.com/downloads/
2. Baixe a versão Windows (64-bit)
3. Execute o instalador
4. Criar conta é **opcional** (pode usar sem login)

### Opção 2: Web Version
- Acesse: https://web.postman.co/
- Requer login (gratuito)

---

## 🎯 2. Primeiro Request - Busca Básica

### Passo 1: Criar Nova Request
1. Abra Postman
2. Clique em **"New"** (canto superior esquerdo)
3. Selecione **"HTTP Request"**
4. Ou use atalho: `Ctrl + N`

### Passo 2: Configurar Request

#### 2.1. Método e URL
```
Método: GET
URL: https://comunicaapi.pje.jus.br/api/v1/comunicacao
```

**No Postman:**
- Dropdown à esquerda: selecione `GET`
- Campo de URL: cole `https://comunicaapi.pje.jus.br/api/v1/comunicacao`

#### 2.2. Adicionar Parâmetros (Query Params)
Clique na aba **"Params"** abaixo da URL

| KEY | VALUE | DESCRIPTION |
|-----|-------|-------------|
| `siglaTribunal` | `TJSP` | Tribunal de São Paulo |
| `numeroOab` | `507553` | Número OAB da advogada |
| `dataDisponibilizacaoInicio` | `2026-02-11` | Data início |
| `dataDisponibilizacaoFinal` | `2026-02-11` | Data fim |

**Dica:** Ao adicionar os params, o Postman monta a URL automaticamente:
```
https://comunicaapi.pje.jus.br/api/v1/comunicacao?siglaTribunal=TJSP&numeroOab=507553&dataDisponibilizacaoInicio=2026-02-11&dataDisponibilizacaoFinal=2026-02-11
```

### Passo 3: Enviar Request
1. Clique no botão azul **"Send"**
2. Aguarde resposta (aparece na parte inferior)

### Passo 4: Analisar Resposta

#### Status Code (verde ou vermelho)
```
200 OK       → Sucesso! ✅
400 Bad Request → Parâmetros inválidos ❌
500 Internal Server Error → Erro no servidor ❌
```

#### Corpo da Resposta (JSON)
Clique na aba **"Body"** para ver:
```json
{
  "status": "success",
  "message": "Publicações encontradas com sucesso",
  "count": 3,
  "items": [
    {
      "id": 123456,
      "siglaTribunal": "TJSP",
      "nomeOrgao": "Foro Central - 1ª Vara Cível",
      "tipoComunicacao": "Intimação",
      "nomeAdvogado": "Nome da Advogada",
      "numeroOab": "507553",
      "data_disponibilizacao": "2026-02-11",
      "texto": "Intimação processo 1234567-12.2021.8.26.0100..."
    }
  ]
}
```

#### Abas Úteis:
- **Pretty**: JSON formatado e colorido
- **Raw**: JSON bruto
- **Preview**: Visualização HTML (se aplicável)
- **Headers**: Cabeçalhos da resposta

---

## 🔬 3. Testando Diferentes Cenários

### Cenário 1: Busca por Nome do Advogado
```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao

Params:
- siglaTribunal: TJSP
- nomeAdvogado: Maria Silva Santos
- dataDisponibilizacaoInicio: 2026-02-01
- dataDisponibilizacaoFinal: 2026-02-11
```

**Importante:** Nomes com espaços são codificados automaticamente pelo Postman
- `Maria Silva Santos` → `Maria%20Silva%20Santos`

### Cenário 2: Busca por OAB + Nome (Ambos)
```
Params:
- siglaTribunal: TJSP
- numeroOab: 507553
- nomeAdvogado: Maria Silva Santos
- dataDisponibilizacaoInicio: 2026-02-11
- dataDisponibilizacaoFinal: 2026-02-11
```

### Cenário 3: Outros Tribunais
```
Tribunais Estaduais:
- TJSP (São Paulo)
- TJRJ (Rio de Janeiro)
- TJMG (Minas Gerais)
- TJPR (Paraná)
- TJRS (Rio Grande do Sul)
- TJSC (Santa Catarina)

Tribunais Federais:
- TRF1 (Região 1)
- TRF2 (Região 2)
- TRF3 (Região 3)
- TRF4 (Região 4)
- TRF5 (Região 5)
- TRF6 (Região 6)
```

### Cenário 4: Período Maior
```
Params:
- siglaTribunal: TJSP
- numeroOab: 507553
- dataDisponibilizacaoInicio: 2026-02-01
- dataDisponibilizacaoFinal: 2026-02-28
```

**Atenção:** Períodos grandes podem retornar muitos resultados e demorar!

---

## 📁 4. Organizando Requests - Collections

### Criar Collection
1. Clique em **"Collections"** (barra lateral esquerda)
2. Clique em **"+"** ou **"New Collection"**
3. Nome: `PJe Comunica API`
4. Descrição: `Testes da API de Publicações Jurídicas`

### Adicionar Requests à Collection
1. Clique no request que criou
2. Clique em **"Save"** (canto superior direito)
3. Escolha a collection `PJe Comunica API`
4. Nome do request: `Busca por OAB - TJSP`
5. Clique **"Save"**

### Estrutura Sugerida
```
📁 PJe Comunica API
  ├── 📄 Busca por OAB - TJSP
  ├── 📄 Busca por Nome - TJSP
  ├── 📄 Busca Combinada (OAB + Nome)
  ├── 📄 Período Mensal
  └── 📁 Outros Tribunais
      ├── 📄 Busca - TJRJ
      └── 📄 Busca - TRF3
```

---

## 🎨 5. Recursos Avançados do Postman

### 5.1. Variables (Variáveis)

#### Criar Environment
1. Clique no ícone de **engrenagem** (canto superior direito)
2. Clique em **"Add"** (New Environment)
3. Nome: `PJe - Produção`

#### Adicionar Variáveis
| VARIABLE | TYPE | INITIAL VALUE | CURRENT VALUE |
|----------|------|---------------|---------------|
| `base_url` | default | `https://comunicaapi.pje.jus.br/api/v1` | (mesmo) |
| `tribunal` | default | `TJSP` | (mesmo) |
| `oab` | default | `507553` | (mesmo) |
| `data_hoje` | default | `2026-02-11` | (mesmo) |

#### Usar Variáveis na Request
```
URL: {{base_url}}/comunicacao

Params:
- siglaTribunal: {{tribunal}}
- numeroOab: {{oab}}
- dataDisponibilizacaoInicio: {{data_hoje}}
- dataDisponibilizacaoFinal: {{data_hoje}}
```

**Vantagem:** Mudar OAB ou data em um lugar só!

### 5.2. Tests (Scripts de Teste)

Clique na aba **"Tests"** dentro da request:

```javascript
// Verificar status code
pm.test("Status code é 200", function () {
    pm.response.to.have.status(200);
});

// Verificar estrutura da resposta
pm.test("Resposta tem status success", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("success");
});

// Verificar se retornou items
pm.test("Retornou publicações", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.items).to.be.an('array');
    pm.expect(jsonData.count).to.be.at.least(0);
});

// Log de informações
console.log("Total de publicações:", pm.response.json().count);
```

**Rodar e Ver Resultados:**
1. Clique **"Send"**
2. Veja aba **"Test Results"** na resposta
3. Veja **"Console"** (parte inferior) para logs

### 5.3. Pre-request Script (Automatizar Datas)

Clique na aba **"Pre-request Script"**:

```javascript
// Gerar data de hoje automaticamente
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const dataHoje = `${yyyy}-${mm}-${dd}`;

// Setar variável
pm.environment.set("data_hoje", dataHoje);

console.log("Data de hoje:", dataHoje);

// Gerar data de 7 dias atrás
const semanaPassada = new Date();
semanaPassada.setDate(semanaPassada.getDate() - 7);
const dataSemanaPassada = semanaPassada.toISOString().split('T')[0];

pm.environment.set("data_inicio", dataSemanaPassada);

console.log("Início (7 dias atrás):", dataSemanaPassada);
```

**Resultado:** Não precisa mudar data manualmente todos os dias!

### 5.4. Salvar Resposta como Exemplo

Após receber uma resposta bem-sucedida:
1. Clique em **"Save Response"**
2. Clique em **"Save as Example"**
3. Nome: `Resposta com 3 publicações - 11 fev 2026`

**Vantagem:** Documentação viva da API!

---

## 📊 6. Analisando Respostas JSON

### Filtrar Campos com JSON Path
Na aba **"Body"** da resposta, clique em **"JSON"** e use filtros:

```javascript
// Ver apenas contagem
jsonData.count

// Ver IDs de todas publicações
jsonData.items[*].id

// Ver primeira publicação
jsonData.items[0]

// Ver texto da primeira intimação
jsonData.items[0].texto
```

### Copiar Campos Específicos
1. Navegue no JSON expandindo os nós
2. Clique com botão direito em um campo
3. **"Copy value"** ou **"Copy path"**

---

## 🔄 7. Runner - Execução em Lote

### Testar Múltiplos Cenários Automaticamente

#### Passo 1: Criar Arquivo CSV
Crie `testes_publicacoes.csv`:

```csv
tribunal,oab,data_inicio,data_fim
TJSP,507553,2026-02-11,2026-02-11
TJRJ,123456,2026-02-10,2026-02-11
TRF3,789012,2026-02-09,2026-02-11
```

#### Passo 2: Configurar Runner
1. Clique na Collection `PJe Comunica API`
2. Clique em **"Run"** (botão azul)
3. Selecione requests para executar
4. Clique em **"Select File"** e escolha o CSV
5. Configure **Iterations** (número de linhas do CSV)
6. Clique **"Run PJe Comunica API"**

#### Passo 3: Ver Relatório
- Total de requests
- Passed tests / Failed tests
- Tempo de execução
- Detalhes por iteração

---

## 🐛 8. Debugging - Resolvendo Problemas

### Problema 1: Erro 400 (Bad Request)
**Causa:** Parâmetros inválidos ou faltando

**Solução:**
- Verifique ortografia dos parâmetros (`siglaTribunal` não `tribunal`)
- Verifique formato de data (`YYYY-MM-DD`)
- Veja Response Body para mensagem de erro específica

### Problema 2: Erro 500 (Internal Server Error)
**Causa:** Problema no servidor da API

**Solução:**
- Aguarde alguns minutos
- Tente outro tribunal
- Verifique se API está online: https://comunicaapi.pje.jus.br/

### Problema 3: Timeout
**Causa:** Requisição muito pesada ou internet lenta

**Solução:**
1. Settings → Request timeout → Aumentar para 30000ms (30s)
2. Reduza período de busca
3. Verifique conexão de internet

### Problema 4: Sem Resultados (count: 0)
**Causa:** Parâmetros não correspondem a publicações reais

**Solução:**
- Verifique OAB existe no tribunal
- Amplie período de busca
- Teste só com tribunal e data (sem filtros)

---

## 📤 9. Exportar e Compartilhar

### Exportar Collection
1. Clique com direito na Collection
2. **"Export"**
3. Escolha formato (v2.1 recomendado)
4. Salve arquivo JSON

### Importar Collection
1. **"Import"** (canto superior esquerdo)
2. Arraste o arquivo JSON
3. Clique **"Import"**

### Compartilhar via Link (requer conta)
1. Clique na Collection
2. **"Share"** → **"Via API"** ou **"Via Run in Postman"**
3. Gera link público

---

## 🎓 10. Dicas Profissionais

### 10.1. Atalhos de Teclado
```
Ctrl + N       → Nova Request
Ctrl + S       → Salvar Request
Ctrl + Enter   → Enviar Request
Ctrl + /       → Pesquisar
```

### 10.2. Snippets Úteis (Pre-request / Tests)
No editor de Scripts, clique em **"Snippets"** (lado direito):
- Status code tests
- Response time test
- Parse JSON body
- Set environment variable

### 10.3. Postman Console (Debug Avançado)
1. Menu: **View** → **Show Postman Console** (ou `Ctrl + Alt + C`)
2. Veja **todos** os requests/responses
3. Logs do `console.log()` aparecem aqui

### 10.4. Documentação Automática
1. Clique na Collection
2. **"View Documentation"**
3. Postman gera docs lindas com seus examples!
4. Pode publicar online (gratuito)

---

## 🚀 11. Workflow Completo - Do Zero ao Teste

### Checklist Rápido:
```
☐ 1. Abrir Postman
☐ 2. New Request → GET
☐ 3. URL: https://comunicaapi.pje.jus.br/api/v1/comunicacao
☐ 4. Params:
     - siglaTribunal: TJSP
     - numeroOab: 507553
     - dataDisponibilizacaoInicio: 2026-02-11
     - dataDisponibilizacaoFinal: 2026-02-11
☐ 5. Send
☐ 6. Verificar Status 200
☐ 7. Analisar JSON (count, items)
☐ 8. Save Request → Collection "PJe Comunica API"
☐ 9. Save Response as Example
☐ 10. Adicionar Tests (opcional)
```

### Tempo estimado:
- Primeira vez: **10 minutos**
- Depois: **2 minutos** por teste

---

## 📚 12. Recursos Extras

### Documentação Oficial:
- **Postman Learning Center**: https://learning.postman.com/
- **API Docs**: https://www.postman.com/collection/

### Tutoriais em Vídeo:
- YouTube: "Postman Tutorial for Beginners"
- Postman Academy (gratuito): https://academy.postman.com/

### Comunidade:
- Postman Community: https://community.postman.com/
- Stack Overflow: Tag [postman]

---

## 🎯 13. Próximos Passos

Quando voltar, podemos:

1. ✅ **Criar collection completa** com todos cenários
2. ✅ **Configurar environment** com variáveis
3. ✅ **Adicionar tests** para validação automática
4. ✅ **Gerar documentação** da API
5. ✅ **Integrar com CI/CD** (Newman - CLI do Postman)

---

## 💡 Exemplo Prático - Copiar e Colar

### Request Completo (JSON do Postman):

```json
{
  "name": "Busca Publicações - TJSP",
  "request": {
    "method": "GET",
    "header": [],
    "url": {
      "raw": "https://comunicaapi.pje.jus.br/api/v1/comunicacao?siglaTribunal=TJSP&numeroOab=507553&dataDisponibilizacaoInicio=2026-02-11&dataDisponibilizacaoFinal=2026-02-11",
      "protocol": "https",
      "host": [
        "comunicaapi",
        "pje",
        "jus",
        "br"
      ],
      "path": [
        "api",
        "v1",
        "comunicacao"
      ],
      "query": [
        {
          "key": "siglaTribunal",
          "value": "TJSP"
        },
        {
          "key": "numeroOab",
          "value": "507553"
        },
        {
          "key": "dataDisponibilizacaoInicio",
          "value": "2026-02-11"
        },
        {
          "key": "dataDisponibilizacaoFinal",
          "value": "2026-02-11"
        }
      ]
    }
  }
}
```

**Para importar:**
1. Postman → Import → Raw Text → Colar JSON acima → Import

---

## 🎉 Conclusão

O Postman é **essencial** para:
- ✅ Testar APIs sem escrever código
- ✅ Documentar endpoints
- ✅ Debugar problemas
- ✅ Automatizar testes
- ✅ Compartilhar com equipe

**Comece simples (seção 2), depois avance (seções 5-7)!**

---

**Boa viagem para buscar sua família! 👨‍👩‍👧‍👦**
**Quando voltar, seguimos com as melhorias! 🚀**

# 📋 Sistema Jurídico - Guia de Instalação para Cliente

## 🎯 Pré-requisitos (Instalar ANTES)

### 1. Python 3.8+

- **Download**: https://www.python.org/downloads/
- ⚠️ **IMPORTANTE**: Marcar opção "Add Python to PATH" durante instalação
- Testar: Abrir cmd e digitar `python --version`

### 2. Node.js 16+

- **Download**: https://nodejs.org/ (versão LTS recomendada)
- Instalação padrão (Next → Next → Install)
- Testar: Abrir cmd e digitar `node --version`

---

## 🚀 Instalação do Sistema (3 Passos)

### Passo 1: Copiar Pasta

1. Copie a pasta `legal-system` para um local seguro
2. Exemplo: `C:\Programas\legal-system`
3. **NÃO use OneDrive, Dropbox ou pasta sincronizada**

### Passo 2: Executar Instalação

1. Abra a pasta `legal-system`
2. **Clique duplo** em `INSTALAR.bat`
3. Aguarde 10-15 minutos (vai instalar tudo automaticamente)
4. Quando aparecer "INSTALACAO CONCLUIDA!", pressione qualquer tecla

### Passo 3: Criar Atalhos (Opcional)

1. Clique direito em `INICIAR SISTEMA.bat`
2. Selecione "Criar atalho"
3. Arraste o atalho para a Área de Trabalho
4. Renomeie para "Sistema Jurídico"

---

## 💻 Uso Diário

### Iniciar o Sistema

1. **Clique duplo** em `INICIAR SISTEMA.bat` (ou no atalho)
2. Aguarde ~10 segundos
3. O navegador abrirá automaticamente
4. **NÃO FECHE a janela preta que aparece!**

### Parar o Sistema

**Opção 1 (Recomendada)**:

- Clique duplo em `PARAR SISTEMA.bat`

**Opção 2**:

- Feche a janela preta do "INICIAR SISTEMA"

---

## 🔧 Solução de Problemas

### ❌ "Python não encontrado"

→ Reinstale Python com opção "Add to PATH" marcada

### ❌ "Node.js não encontrado"

→ Reinstale Node.js (instalação padrão)

### ❌ Sistema não abre no navegador

→ Abra manualmente: http://localhost:5173

### ❌ Página em branco

→ Aguarde mais 10 segundos, depois F5 (atualizar)

### ❌ Erro "porta em uso"

→ Execute `PARAR SISTEMA.bat` e depois `INICIAR SISTEMA.bat`

---

## 📁 Estrutura de Arquivos

```
legal-system/
│
├── INSTALAR.bat              ← Usar 1 vez (instalação)
├── INICIAR SISTEMA.bat       ← Usar todo dia (abrir)
├── PARAR SISTEMA.bat         ← Fechar sistema
├── VERIFICAR STATUS.bat      ← Ver se está rodando
├── LEIA-ME.txt              ← Manual rápido
│
├── backend/                  ← Servidor (não mexer)
├── frontend/                 ← Interface (não mexer)
└── data/                     ← Dados do sistema
```

---

## ⚠️ IMPORTANTE - NÃO FAZER

- ❌ NÃO apague arquivos da pasta `backend` ou `frontend`
- ❌ NÃO mova a pasta após instalação
- ❌ NÃO feche a janela preta enquanto usa o sistema
- ❌ NÃO instale em pasta do OneDrive/Dropbox

---

## 🆘 Suporte

Se algo não funcionar:

1. Execute `PARAR SISTEMA.bat`
2. Execute `VERIFICAR STATUS.bat` (anote o que aparecer)
3. Tire print da tela com erro
4. Entre em contato com desenvolvedor

---

## 📊 Especificações Técnicas

- **Espaço em disco**: ~500MB
- **Memória RAM**: 2GB mínimo
- **Processador**: Qualquer dual-core
- **Internet**: Necessária apenas para buscar publicações
- **Sistema**: Windows 10 ou superior

---

## ✅ Checklist de Instalação

- [ ] Python instalado e testado
- [ ] Node.js instalado e testado
- [ ] Pasta copiada para local seguro
- [ ] INSTALAR.bat executado com sucesso
- [ ] INICIAR SISTEMA.bat testado
- [ ] Sistema abriu no navegador
- [ ] Atalho criado na área de trabalho (opcional)
- [ ] PARAR SISTEMA.bat testado

---

**Versão**: 1.0  
**Data**: Fevereiro 2026  
**Desenvolvedor**: [Seu Nome]

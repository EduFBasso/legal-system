"""
Teste de diferentes formatos de URL para o ESAJ TJSP
"""

numero_processo = "0000623-69.2026.8.26.0320"

print("=== FORMATOS DE URL PARA TESTE ===\n")

# Formato 1: Apenas número do processo
url1 = f"https://esaj.tjsp.jus.br/cpopg/show.do?processo.numero={numero_processo}"
print(f"1. Apenas número:\n{url1}\n")

# Formato 2: Com cbPesquisa=NUMPROC
url2 = f"https://esaj.tjsp.jus.br/cpopg/show.do?cbPesquisa=NUMPROC&processo.numero={numero_processo}"
print(f"2. Com cbPesquisa:\n{url2}\n")

# Formato 3: Com foro=all
url3 = f"https://esaj.tjsp.jus.br/cpopg/show.do?processo.numero={numero_processo}&foro=all"
print(f"3. Com foro=all:\n{url3}\n")

# Formato 4: Página de busca com parâmetros
url4 = f"https://esaj.tjsp.jus.br/cpopg/search.do?conversationId=&paginaConsulta=1&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=&foroNumeroUnificado=&dePesquisaNuUnificado={numero_processo}"
print(f"4. Search.do com parâmetros:\n{url4}\n")

# Formato 5: Open.do (página inicial)
url5 = f"https://esaj.tjsp.jus.br/cpopg/open.do"
print(f"5. Open.do (página inicial):\n{url5}\n")

print("\n=== INSTRUÇÕES PARA TESTE ===")
print("1. Abra cada URL no navegador")
print("2. Verifique qual preenche automaticamente o campo de busca")
print("3. Teste qual abre o processo diretamente")
print("\nProcesso para teste: 0000623-69.2026.8.26.0320")

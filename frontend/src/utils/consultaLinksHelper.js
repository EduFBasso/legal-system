/**
 * Utilitário para gerar links de consulta processual em diferentes sistemas
 * Complementa o link_oficial do ESAJ com links alternativos
 */

/**
 * Gera link para eProc TJSP (sistema novo)
 * @param {string} numeroProcesso - Número CNJ do processo
 * @returns {string|null} URL do eProc ou null se não aplicável
 */
export function generateEProcLink(numeroProcesso) {
  if (!numeroProcesso) return null;
  
  // eProc é específico do TJSP
  // Formato: https://eproc-consulta.tjsp.jus.br/consulta_1g/externo_controlador.php?acao=tjsp@consulta_unificada_publica/consultar
  // A busca é feita na página, então apenas abrimos e o número já está copiado
  return 'https://eproc-consulta.tjsp.jus.br/consulta_1g/externo_controlador.php?acao=tjsp@consulta_unificada_publica/consultar';
}

/**
 * Gera link para consulta PJe TRF3 (1º Grau)
 * @param {string} numeroProcesso - Número CNJ do processo
 * @returns {string|null} URL da consulta PJe TRF3 ou null se não aplicável
 */
export function generateTRF3Link(numeroProcesso) {
  if (!numeroProcesso) return null;
  
  // TRF3 1ª Instância - Juizado Especial Federal (JEF)
  // Página oficial de consulta processual
  // Base: http://www.jfsp.jus.br/jef/
  return 'http://www.jfsp.jus.br/jef/';
}

/**
 * Gera link para consulta PJe TRT15 (Justiça do Trabalho)
 * @param {string} numeroProcesso - Número CNJ do processo
 * @returns {string|null} URL da consulta PJe TRT15 ou null se não aplicável
 */
export function generateTRT15Link(numeroProcesso) {
  if (!numeroProcesso) return null;
  
  // PJe TRT15 - Consulta Pública
  // Base: https://pje.trt15.jus.br/consultaprocessual
  return 'https://pje.trt15.jus.br/consultaprocessual';
}

/**
 * Gera link para consulta PJe TRT2 (Justiça do Trabalho - São Paulo)
 * @param {string} numeroProcesso - Número CNJ do processo
 * @returns {string|null} URL da consulta PJe TRT2 ou null se não aplicável
 */
export function generateTRT2Link(numeroProcesso) {
  if (!numeroProcesso) return null;
  
  // PJe TRT2 - Consulta Pública
  // Base: https://pje.trt2.jus.br/consultaprocessual
  return 'https://pje.trt2.jus.br/consultaprocessual';
}

/**
 * Determina quais sistemas de consulta são aplicáveis para um tribunal
 * @param {string} tribunal - Código do tribunal (ex: 'TJSP', 'TRF3', 'TRT15')
 * @returns {Array<Object>} Lista de sistemas disponíveis
 */
export function getAvailableConsultaSystems(tribunal) {
  const systems = [];
  
  switch (tribunal) {
    case 'TJSP':
      // TJSP tem ESAJ (link_oficial) + eProc
      systems.push({
        name: 'eProc TJSP',
        shortName: 'eProc',
        icon: '📄',
        getLinkFn: generateEProcLink,
        description: 'Sistema digital moderno do TJSP'
      });
      break;
      
    case 'TRF3':
      // TRF3 tem consulta JEF/Fórum própria
      systems.push({
        name: 'Consulta JEF/Fórum TRF3',
        shortName: 'JEF TRF3',
        icon: '⚖️',
        getLinkFn: generateTRF3Link,
        description: 'Consulta processual JEF e Fóruns Federais TRF3'
      });
      break;
      
    case 'TRT15':
      // TRT15 tem consulta PJe Trabalhista
      systems.push({
        name: 'Consulta PJe TRT15',
        shortName: 'PJe TRT15',
        icon: '👔',
        getLinkFn: generateTRT15Link,
        description: 'Consulta processual Justiça do Trabalho'
      });
      break;
      
    case 'TRT2':
      // TRT2 tem consulta PJe Trabalhista (São Paulo)
      systems.push({
        name: 'Consulta PJe TRT2',
        shortName: 'PJe TRT2',
        icon: '👔',
        getLinkFn: generateTRT2Link,
        description: 'Consulta processual Justiça do Trabalho - SP'
      });
      break;
      
    default:
      // Outros tribunais: apenas o link_oficial por enquanto
      break;
  }
  
  return systems;
}

/**
 * Gera todos os links de consulta disponíveis para uma publicação
 * @param {Object} publication - Objeto da publicação
 * @returns {Object} Objeto com link_oficial e links alternativos
 */
export function generateAllConsultaLinks(publication) {
  const { tribunal, numero_processo, link_oficial } = publication;
  
  const result = {
    linkOficial: link_oficial, // ESAJ ou link principal
    linksAlternativos: []
  };
  
  if (!numero_processo) return result;
  
  const systems = getAvailableConsultaSystems(tribunal);
  
  systems.forEach(system => {
    const link = system.getLinkFn(numero_processo);
    if (link) {
      result.linksAlternativos.push({
        ...system,
        url: link
      });
    }
  });
  
  return result;
}

function copyTextFallback(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);

  // iOS Safari precisa de seleção explícita.
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (error) {
    console.error('Erro no fallback de cópia:', error);
  }

  document.body.removeChild(textarea);
  return copied;
}

async function copyTextWithBestEffort(text) {
  if (!text) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Erro ao copiar com Clipboard API, tentando fallback:', error);
    }
  }

  return copyTextFallback(text);
}

/**
 * Abre link e copia número do processo automaticamente
 * @param {string} url - URL a abrir
 * @param {string} numeroProcesso - Número do processo para copiar
 * @param {HTMLElement} buttonElement - Elemento do botão (para feedback visual)
 */
export function openConsultaWithCopy(url, numeroProcesso, buttonElement) {
  if (!url) return;

  // Pré-abre uma aba no gesto do usuário para evitar bloqueio de popup no iPad/Safari.
  // Não usar noopener/noreferrer aqui: alguns navegadores retornam null e a aba fica em branco.
  const popup = window.open('about:blank', '_blank');

  if (popup) {
    try {
      popup.opener = null;
    } catch (error) {
      console.error('Não foi possível limpar opener da janela de consulta:', error);
    }
  }

  const navigateToUrl = () => {
    if (popup && !popup.closed) {
      try {
        popup.location.replace(url);
      } catch (error) {
        console.error('Falha ao navegar na aba pré-aberta, tentando fallback:', error);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const originalHTML = buttonElement?.innerHTML;
  if (buttonElement && document.contains(buttonElement)) {
    buttonElement.innerHTML = numeroProcesso ? '⏳ Copiando...' : '↗ Abrindo...';
    buttonElement.disabled = true;
  }

  Promise.resolve()
    .then(async () => {
      const copied = numeroProcesso ? await copyTextWithBestEffort(numeroProcesso) : false;
      navigateToUrl();

      if (buttonElement && document.contains(buttonElement)) {
        buttonElement.innerHTML = copied ? '✅ Copiado!' : '↗ Aberto';
      }
    })
    .catch((error) => {
      console.error('Erro ao abrir consulta processual:', error);
      navigateToUrl();

      if (buttonElement && document.contains(buttonElement)) {
        buttonElement.innerHTML = '↗ Aberto';
      }
    })
    .finally(() => {
      if (!buttonElement || !document.contains(buttonElement)) return;

      setTimeout(() => {
        if (!buttonElement || !document.contains(buttonElement)) return;
        buttonElement.innerHTML = originalHTML;
        buttonElement.disabled = false;
      }, 2000);
    });
}

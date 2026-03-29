"""
Service para integração com API PJe Comunica.
Busca publicações jurídicas em múltiplos tribunais.
"""
import re
import time
import unicodedata
from datetime import datetime, date
from typing import List, Dict, Optional

import requests
from django.conf import settings


# Defaults mantidos no módulo como fallback, mas configuráveis via settings/env.
# (Em produção, prefira configurar via .env e/ou perfil do usuário.)
DEFAULT_PJE_COMUNICA_API_URL = "https://comunicaapi.pje.jus.br/api/v1/comunicacao"
DEFAULT_PJE_COMUNICA_TIMEOUT_SECONDS = 15
DEFAULT_PJE_COMUNICA_MAX_RETRIES = 2
DEFAULT_PJE_COMUNICA_RETRY_BACKOFF_SECONDS = (0.75, 2.0)

DEFAULT_TRIBUNAIS = [
    'TJSP',
    'TRF3',
    'TRT2',
    'TRT15',
]

def _sanitize_str_list(values) -> list[str]:
    if not values:
        return []
    sanitized: list[str] = []
    for item in values:
        if item is None:
            continue
        text = str(item).strip()
        if not text:
            continue
        sanitized.append(text)
    return sanitized


def _resolve_exclusion_rules(excluded_oabs=None, excluded_keywords=None) -> tuple[list[str], list[str]]:
    """Resolve regras de exclusão priorizando parâmetros e caindo para settings."""
    if excluded_oabs is None:
        excluded_oabs = _get_setting('PJE_COMUNICA_EXCLUDED_LAWYERS_OABS', [])
    if excluded_keywords is None:
        excluded_keywords = _get_setting('PJE_COMUNICA_EXCLUDED_LAWYERS_KEYWORDS', [])
    return _sanitize_str_list(excluded_oabs), _sanitize_str_list(excluded_keywords)


def _normalize_for_match(value: str) -> str:
    """Normaliza para matching: remove acentos, transforma em UPPER e colapsa espaços."""
    if not value:
        return ''
    value = unicodedata.normalize('NFD', value)
    value = ''.join(char for char in value if unicodedata.category(char) != 'Mn')
    value = re.sub(r'\s+', ' ', value).strip()
    return value.upper()


def _get_setting(name: str, default):
    try:
        return getattr(settings, name)
    except Exception:
        return default


class PJeComunicaService:
    """Service para buscar publicações da API PJe Comunica."""
    
    @staticmethod
    def fetch_publications_from_tribunal(
        tribunal: str,
        oab: Optional[str] = None,
        nome_advogado: Optional[str] = None,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None
    ) -> Dict:
        """
        Busca publicações de um tribunal específico.
        
        Args:
            tribunal: Sigla do tribunal (ex: TJSP)
            oab: Número da OAB (sem formatação)
            nome_advogado: Nome completo do advogado
            data_inicio: Data inicial (YYYY-MM-DD)
            data_fim: Data final (YYYY-MM-DD)
            
        Returns:
            Dict com status e items ou erro
        """
        params = {
            "siglaTribunal": tribunal,
        }
        
        if oab:
            params["numeroOab"] = oab
        if nome_advogado:
            params["nomeAdvogado"] = nome_advogado
        if data_inicio:
            params["dataDisponibilizacaoInicio"] = data_inicio
        if data_fim:
            params["dataDisponibilizacaoFim"] = data_fim
        
        try:
            last_error = None
            api_url = _get_setting('PJE_COMUNICA_API_URL', DEFAULT_PJE_COMUNICA_API_URL)
            api_timeout = _get_setting('PJE_COMUNICA_TIMEOUT_SECONDS', DEFAULT_PJE_COMUNICA_TIMEOUT_SECONDS)
            api_max_retries = _get_setting('PJE_COMUNICA_MAX_RETRIES', DEFAULT_PJE_COMUNICA_MAX_RETRIES)
            api_backoff = _get_setting('PJE_COMUNICA_RETRY_BACKOFF_SECONDS', DEFAULT_PJE_COMUNICA_RETRY_BACKOFF_SECONDS)
            if isinstance(api_backoff, list):
                api_backoff = tuple(float(x) for x in api_backoff)

            for attempt in range(max(0, int(api_max_retries)) + 1):
                try:
                    response = requests.get(api_url, params=params, timeout=api_timeout)
                    response.raise_for_status()
                    data = response.json()

                    if data.get('status') != 'success':
                        return {
                            'tribunal': tribunal,
                            'success': False,
                            'error': data.get('message', 'Erro desconhecido'),
                            'items': []
                        }

                    return {
                        'tribunal': tribunal,
                        'success': True,
                        'count': data.get('count', 0),
                        'items': data.get('items', [])
                    }
                except requests.exceptions.RequestException as e:
                    last_error = e
                    if attempt >= api_max_retries:
                        break

                    # Backoff simples para reduzir falhas intermitentes da API
                    if api_backoff:
                        backoff = api_backoff[min(attempt, len(api_backoff) - 1)]
                        time.sleep(backoff)

            return {
                'tribunal': tribunal,
                'success': False,
                'error': str(last_error) if last_error else 'Erro de conexão (sem detalhes)',
                'items': []
            }
        except Exception as e:
            return {
                'tribunal': tribunal,
                'success': False,
                'error': f'Erro inesperado: {str(e)}',
                'items': []
            }
    
    @staticmethod
    def normalize_publication(item: Dict, tribunal: str) -> Dict:
        """
        Normaliza dados de uma publicação.
        
        Args:
            item: Item da API PJe
            tribunal: Sigla do tribunal
            
        Returns:
            Dict normalizado
        """
        # Extrai número do processo do texto usando regex
        texto = item.get('texto', '')
        pattern = r'(\d{7})-(\d{2})\.(\d{4})\.(\d{1})\.(\d{2})\.(\d{4})(?:\.(\d{5}))?'
        matches = re.findall(pattern, texto)
        
        numero_processo = None
        if matches:
            m = matches[0]
            # Formato: 1003498-11.2021.8.26.0533
            numero_processo = f"{m[0]}-{m[1]}.{m[2]}.{m[3]}.{m[4]}.{m[5]}"
            if m[6]:  # Se tiver último grupo
                numero_processo += f".{m[6]}"
        
        # Limita resumo a 500 caracteres
        texto_resumo = texto[:500] + "..." if len(texto) > 500 else texto
        
        # Link oficial da publicação
        link_base = item.get('link', '')
        hash_pub = item.get('hash', '')
        
        # Remover www. para evitar erro de certificado SSL wildcard
        if link_base:
            link_base = link_base.replace('://www.', '://')
        
        # Construir URL de consulta pública quando possível
        link_oficial = None
        
        # TJSP: Tentar preenchimento automático com parâmetros
        # Se não funcionar, o frontend copia o número automaticamente
        if tribunal == 'TJSP' and numero_processo:
            # Extrair código do foro (últimos 4 dígitos do número CNJ)
            foro = numero_processo[-4:] if len(numero_processo) >= 4 else None
            
            if foro and foro.isdigit():
                # Remover zeros à esquerda (0533 → 533)
                codigo_foro = str(int(foro))
                
                # Tenta preencher automaticamente
                # Funciona em alguns foros (ex: 533), em outros não preenche mas abre o ESAJ
                # Frontend copia número automaticamente como fallback
                link_oficial = f"https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo={codigo_foro}&processo.numero={numero_processo}"
            else:
                # Fallback: página de busca manual
                link_oficial = "https://esaj.tjsp.jus.br/cpopg/open.do"
        elif tribunal == 'TJSP':
            # Se não tiver número de processo, usar página inicial
            link_oficial = "https://esaj.tjsp.jus.br/cpopg/open.do"
        
        # TRF3: Padrão similar (aguardando publicações para testar)
        elif tribunal == 'TRF3' and 'trf3.jus.br' in link_base and hash_pub:
            link_oficial = f"{link_base}/Visualizar?hash={hash_pub}"
        
        # TRT2: Tribunal Regional do Trabalho 2ª Região - SP
        # TODO: Implementar quando houver publicações da advogada
        # elif tribunal == 'TRT2' and numero_processo:
        #     link_oficial = f"https://pje.trt2.jus.br/consultaprocessual/pages/consultas/ConsultaProcessual.seam"
        
        # TRT15: Tribunal Regional do Trabalho 15ª Região - Campinas
        # TODO: Implementar quando houver publicações da advogada  
        # elif tribunal == 'TRT15' and numero_processo:
        #     link_oficial = f"https://pje.trt15.jus.br/consultaprocessual/pages/consultas/ConsultaProcessual.seam"
        
        # Fallback: link base da API (se existir)
        elif link_base:
            link_oficial = link_base
        
        raw_id = item.get('id')
        if raw_id is None:
            raw_id = item.get('idComunicacao')
        if raw_id is None:
            raw_id = item.get('id_api')

        try:
            id_api = int(raw_id) if raw_id is not None and str(raw_id).strip() != '' else None
        except (TypeError, ValueError):
            id_api = None

        return {
            "id_api": id_api,
            "numero_processo": numero_processo,
            "tribunal": tribunal,  # Usa tribunal passado como parâmetro
            "data_disponibilizacao": item.get('data_disponibilizacao'),
            "tipo_comunicacao": item.get('tipoComunicacao'),
            "orgao": item.get('nomeOrgao', ''),
            "meio": item.get('meio', ''),
            "texto_resumo": texto_resumo,
            "texto_completo": texto,
            "link_oficial": link_oficial,  # Link para acessar no site oficial
            "hash": hash_pub,  # Hash da publicação
        }
    
    @staticmethod
    def should_exclude_publication(
        pub: Dict,
        excluded_oabs: Optional[list[str]] = None,
        excluded_keywords: Optional[list[str]] = None,
    ) -> bool:
        """
        Verifica se uma publicação deve ser EXCLUÍDA por pertencer a outra advogada.
        
        Critérios de exclusão (caso mencione):
        - OABs de outras advogadas (ex: 407729 - LÚCIA VITÓRIA)
        - Keywords de outras advogadas (LUCIA, LÚCIA, etc.)
        
        Args:
            pub: Publicação normalizada
            
        Returns:
            True se deve EXCLUIR, False se deve INCLUIR
        """
        # Concatenar todos os textos da publicação para análise
        text_fields = [
            pub.get('texto_completo', ''),
            pub.get('texto_resumo', ''),
            pub.get('orgao', ''),
        ]
        full_text = _normalize_for_match(' '.join(text_fields))
        
        excluded_oabs, excluded_keywords = _resolve_exclusion_rules(excluded_oabs, excluded_keywords)

        # Verificar OABs excluídas
        for excluded_oab in excluded_oabs:
            if excluded_oab and str(excluded_oab) in full_text:
                return True  # EXCLUIR
        
        # Verificar keywords excluídas
        for keyword in excluded_keywords:
            if keyword and _normalize_for_match(keyword) in full_text:
                return True  # EXCLUIR
        
        # Passou por todos os filtros - INCLUIR publicação
        return False
    
    @staticmethod
    def should_include_publication(pub: Dict, oab: str, nome_advogado: str) -> bool:
        """
        Verifica se uma publicação REALMENTE menciona a advogada desejada.
        
        FILTRO POSITIVO: Garante que há menção à OAB ou nome no texto.
        Evita falsos positivos da API.
        
        Args:
            pub: Publicação normalizada
            oab: OAB da advogada (ex: "507553")
            nome_advogado: Nome completo (ex: "Vitoria Rocha de Morais")
            
        Returns:
            True se menciona a advogada, False caso contrário
        """
        # Concatenar todos os textos para busca
        text_fields = [
            pub.get('texto_completo', ''),
            pub.get('texto_resumo', ''),
            pub.get('orgao', ''),
        ]
        full_text = _normalize_for_match(' '.join(text_fields))
        
        # Verificar se menciona o número da OAB
        if oab and str(oab).strip() and str(oab).strip() in full_text:
            return True  # INCLUIR - menciona OAB
        
        # Verificar se menciona partes do nome da advogada
        # Dividir nome em partes significativas (ignorar preposições)
        if nome_advogado:
            nome_norm = _normalize_for_match(nome_advogado)
            # Remover preposições comuns (após normalizar)
            nome_norm = (
                f' {nome_norm} '
                .replace(' DE ', ' ')
                .replace(' DA ', ' ')
                .replace(' DO ', ' ')
                .replace(' DAS ', ' ')
                .replace(' DOS ', ' ')
            ).strip()

            nome_parts = [p.strip() for p in nome_norm.split() if len(p.strip()) > 2]
            
            # Procurar pelo menos 2 partes do nome (ex: VITORIA + ROCHA)
            matches = sum(1 for part in nome_parts if part in full_text)
            
            if matches >= 2:
                return True  # INCLUIR - menciona partes do nome
        
        # NÃO encontrou menção à advogada - EXCLUIR
        return False
    
    @classmethod
    def fetch_publications(
        cls,
        oab: str,
        nome_advogado: str,
        data_inicio: str,
        data_fim: str,
        tribunais: Optional[List[str]] = None,
        excluded_oabs: Optional[list[str]] = None,
        excluded_keywords: Optional[list[str]] = None,
    ) -> Dict:
        """
        Busca publicações com filtros personalizados.
        
        Faz DUAS buscas por tribunal:
        1. Busca por número OAB
        2. Busca por nome do advogado
        
        Args:
            oab: Número da OAB (ex: "507553")
            nome_advogado: Nome completo (ex: "Vitoria Rocha de Morais")
            data_inicio: Data inicial (YYYY-MM-DD)
            data_fim: Data final (YYYY-MM-DD)
            tribunais: Lista de tribunais (default: TRIBUNAIS constante)
            
        Returns:
            Dict com publicações normalizadas e estatísticas
        """
        oab_clean = (oab or '').strip()
        nome_clean = (nome_advogado or '').strip()
        if not oab_clean and not nome_clean:
            raise ValueError('Consulta de publicações requer OAB e/ou nome do advogado')

        if tribunais is None:
            tribunais = list(_get_setting('PJE_COMUNICA_DEFAULT_TRIBUNAIS', DEFAULT_TRIBUNAIS))
        
        results = []
        errors = []
        seen_ids = set()  # Para evitar duplicatas

        excluded_total = 0
        excluded_by_oab = 0
        excluded_by_keyword = 0

        resolved_excluded_oabs, resolved_excluded_keywords = _resolve_exclusion_rules(excluded_oabs, excluded_keywords)
        
        # Busca em cada tribunal
        for tribunal in tribunais:
            # BUSCA 1: Por número OAB
            result_oab = cls.fetch_publications_from_tribunal(
                tribunal=tribunal,
                oab=oab_clean,
                nome_advogado=None,  # Apenas OAB
                data_inicio=data_inicio,
                data_fim=data_fim
            )
            
            if result_oab['success']:
                for item in result_oab['items']:
                    item_id = item.get('id')  # API retorna 'id' não 'idComunicacao'
                    if item_id and item_id not in seen_ids:
                        seen_ids.add(item_id)
                        normalized = cls.normalize_publication(item, tribunal)
                        
                        # Busca por OAB é precisa: a API já garante vínculo com este OAB.
                        # Só aplica filtro NEGATIVO (excluir outras advogadas com OAB/nome similar).
                        # NÃO aplica filtro positivo aqui, pois algumas publicações (ex: TRT15
                        # distribuições) não mencionam OAB/nome no texto.
                        if cls.should_exclude_publication(
                            normalized,
                            excluded_oabs=resolved_excluded_oabs,
                            excluded_keywords=resolved_excluded_keywords,
                        ):
                            excluded_total += 1
                            # Heurística: contabiliza por presença no texto normalizado.
                            full_text = _normalize_for_match(' '.join([
                                normalized.get('texto_completo', ''),
                                normalized.get('texto_resumo', ''),
                                normalized.get('orgao', ''),
                            ]))
                            if any(oab in full_text for oab in resolved_excluded_oabs if oab):
                                excluded_by_oab += 1
                            if any(_normalize_for_match(k) in full_text for k in resolved_excluded_keywords if k):
                                excluded_by_keyword += 1
                        else:
                            results.append(normalized)
            else:
                errors.append({
                    'tribunal': tribunal,
                    'tipo_busca': 'OAB',
                    'error': result_oab.get('error', 'Erro desconhecido')
                })
            
            # BUSCA 2: Por nome do advogado
            result_nome = cls.fetch_publications_from_tribunal(
                tribunal=tribunal,
                oab=None,  # Apenas Nome
                nome_advogado=nome_clean,
                data_inicio=data_inicio,
                data_fim=data_fim
            )
            
            if result_nome['success']:
                for item in result_nome['items']:
                    item_id = item.get('id')  # API retorna 'id' não 'idComunicacao'
                    # Só adiciona se não foi adicionado pela busca por OAB
                    if item_id and item_id not in seen_ids:
                        seen_ids.add(item_id)
                        normalized = cls.normalize_publication(item, tribunal)
                        
                        # Aplicar FILTRO POSITIVO: deve mencionar a advogada
                        if cls.should_include_publication(normalized, oab_clean, nome_clean):
                            # Aplicar FILTRO NEGATIVO: não pode ser outra advogada
                            if cls.should_exclude_publication(
                                normalized,
                                excluded_oabs=resolved_excluded_oabs,
                                excluded_keywords=resolved_excluded_keywords,
                            ):
                                excluded_total += 1
                                full_text = _normalize_for_match(' '.join([
                                    normalized.get('texto_completo', ''),
                                    normalized.get('texto_resumo', ''),
                                    normalized.get('orgao', ''),
                                ]))
                                if any(oab in full_text for oab in resolved_excluded_oabs if oab):
                                    excluded_by_oab += 1
                                if any(_normalize_for_match(k) in full_text for k in resolved_excluded_keywords if k):
                                    excluded_by_keyword += 1
                            else:
                                results.append(normalized)
            else:
                errors.append({
                    'tribunal': tribunal,
                    'tipo_busca': 'Nome',
                    'error': result_nome.get('error', 'Erro desconhecido')
                })
        
        return {
            'success': True,
            'data_inicio': data_inicio,
            'data_fim': data_fim,
            'total_publicacoes': len(results),
            'total_publicacoes_descartadas': excluded_total,
            'descartadas_por_oab': excluded_by_oab,
            'descartadas_por_palavra_chave': excluded_by_keyword,
            'total_tribunais_consultados': len(tribunais),
            'buscas_por_tribunal': 2,  # OAB + Nome
            'publicacoes': results,
            'erros': errors if errors else None
        }

    @classmethod
    def fetch_today_publications(
        cls,
        oab: str,
        nome_advogado: str,
        tribunais: Optional[List[str]] = None
    ) -> Dict:
        """
        Busca publicações de hoje em múltiplos tribunais.
        
        Atalho para fetch_publications com data_inicio e data_fim = hoje.
        
        Args:
            oab: Número da OAB (ex: "507553")
            nome_advogado: Nome completo (ex: "Vitoria Rocha de Morais")
            tribunais: Lista de tribunais (default: TRIBUNAIS constante)
            
        Returns:
            Dict com publicações normalizadas e estatísticas
        """
        hoje = date.today().isoformat()  # YYYY-MM-DD
        return cls.fetch_publications(
            oab=oab,
            nome_advogado=nome_advogado,
            data_inicio=hoje,
            data_fim=hoje,
            tribunais=tribunais
        )

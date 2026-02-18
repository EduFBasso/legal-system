"""
Service para integração com API PJe Comunica.
Busca publicações jurídicas em múltiplos tribunais.
"""
import re
from datetime import datetime, date
from typing import List, Dict, Optional

import requests


# API Configuration
API_URL = "https://comunicaapi.pje.jus.br/api/v1/comunicacao"
API_TIMEOUT = 15  # seconds

# Tribunais suportados (principais)
TRIBUNAIS = [
    'TJSP',   # Tribunal de Justiça de São Paulo
    'TRF3',   # Tribunal Regional Federal da 3ª Região
    'TRT2',   # Tribunal Regional do Trabalho da 2ª Região (SP)
    'TRT15',  # Tribunal Regional do Trabalho da 15ª Região (Campinas)
]


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
            response = requests.get(API_URL, params=params, timeout=API_TIMEOUT)
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
            return {
                'tribunal': tribunal,
                'success': False,
                'error': str(e),
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
        
        return {
            "id_api": item.get('id'),
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
    
    @classmethod
    def fetch_publications(
        cls,
        oab: str,
        nome_advogado: str,
        data_inicio: str,
        data_fim: str,
        tribunais: Optional[List[str]] = None
    ) -> Dict:
        """
        Busca publicações com filtros personalizados.
        
        Faz DUAS buscas por tribunal:
        1. Busca por número OAB
        2. Busca por nome do advogado
        
        Args:
            oab: Número da OAB (ex: "507553")
            nome_advogado: Nome completo (ex: "Vitoria Rocha")
            data_inicio: Data inicial (YYYY-MM-DD)
            data_fim: Data final (YYYY-MM-DD)
            tribunais: Lista de tribunais (default: TRIBUNAIS constante)
            
        Returns:
            Dict com publicações normalizadas e estatísticas
        """
        if tribunais is None:
            tribunais = TRIBUNAIS
        
        results = []
        errors = []
        seen_ids = set()  # Para evitar duplicatas
        
        # Busca em cada tribunal
        for tribunal in tribunais:
            # BUSCA 1: Por número OAB
            result_oab = cls.fetch_publications_from_tribunal(
                tribunal=tribunal,
                oab=oab,
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
                nome_advogado=nome_advogado,
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
            nome_advogado: Nome completo (ex: "Vitoria Rocha")
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

# Plano: Página de Histórico de Publicações

**Data:** 18/02/2026  
**Objetivo:** Criar página para visualizar histórico completo de buscas de publicações realizadas  
**Complexidade:** Média (2-3 horas)  
**Abordagem:** Arquitetura modular já estabelecida (Service → Hook → Context → Components)

---

## 1. Visão Geral

### Funcionalidades Principais

1. **Listagem de Histórico de Buscas**
   - Todas as buscas realizadas, ordenadas por data (mais recente primeiro)
   - Informações: data, período consultado, tribunais, total de publicações, novas publicações
   - Duração da execução

2. **Filtros e Ordenação**
   - Filtrar por tribunal (TJSP, TRF3, TRT2, TRT15, Todos)
   - Filtrar por período (hoje, últimos 7 dias, últimos 30 dias, personalizado)
   - Ordenar por data (mais recente/mais antiga)

3. **Ações por Busca**
   - Visualizar detalhes completos da busca
   - Recuperar publicações daquela busca específica (reload)
   - Ver estatísticas (gráfico de distribuição por tribunal)

4. **Estatísticas Gerais**
   - Total de buscas realizadas
   - Total de publicações encontradas (soma)
   - Média de publicações por busca
   - Tribunal mais consultado
   - Período com mais atividade

---

## 2. Backend - API Endpoints

### 2.1. Endpoint: Listar Histórico de Buscas

**URL:** `GET /api/publications/history`

**Query Parameters:**

```
?tribunal=TJSP          # Filtrar por tribunal (opcional)
?data_inicio=2026-02-01 # Filtrar por data início (opcional)
?data_fim=2026-02-18    # Filtrar por data fim (opcional)
?page=1                 # Paginação (opcional)
&limit=20               # Itens por página (opcional)
```

**Response:**

```json
{
  "success": true,
  "count": 45,
  "page": 1,
  "total_pages": 3,
  "results": [
    {
      "id": 12,
      "data_inicio": "2026-02-10",
      "data_fim": "2026-02-12",
      "tribunais": ["TJSP", "TRF3", "TRT2", "TRT15"],
      "total_publicacoes": 10,
      "total_novas": 8,
      "duration_seconds": 4.52,
      "executed_at": "2026-02-18T10:45:23.123456Z",
      "search_params": {
        "retroactive_days": 2,
        "oab": "507553",
        "nome_advogado": "Vitoria Rocha"
      }
    }
  ],
  "statistics": {
    "total_buscas": 45,
    "total_publicacoes_encontradas": 523,
    "media_publicacoes_por_busca": 11.6,
    "tribunais_count": {
      "TJSP": 12,
      "TRF3": 8,
      "TRT2": 18,
      "TRT15": 7
    }
  }
}
```

### 2.2. Endpoint: Detalhes de uma Busca Específica

**URL:** `GET /api/publications/history/<id>`

**Response:**

```json
{
  "success": true,
  "search": {
    "id": 12,
    "data_inicio": "2026-02-10",
    "data_fim": "2026-02-12",
    "tribunais": ["TJSP", "TRF3", "TRT2", "TRT15"],
    "total_publicacoes": 10,
    "total_novas": 8,
    "duration_seconds": 4.52,
    "executed_at": "2026-02-18T10:45:23.123456Z",
    "search_params": {
      "retroactive_days": 2,
      "oab": "507553",
      "nome_advogado": "Vitoria Rocha"
    }
  },
  "publications": [
    {
      "id": 1,
      "id_api": 516309493,
      "numero_processo": "1003498-11.2021.8.26.0533",
      "tribunal": "TJSP",
      "tipo_comunicacao": "Intimação",
      "data_disponibilizacao": "2026-02-10",
      "texto_resumo": "DESPACHO..."
    }
  ]
}
```

### 2.3. Implementação Backend

**Arquivo:** `backend/apps/publications/views.py`

```python
@api_view(['GET'])
def get_search_history(request):
    """
    Lista histórico de buscas com filtros e paginação.
    GET /api/publications/history
    """
    try:
        # Filtros
        tribunal = request.GET.get('tribunal')
        data_inicio = request.GET.get('data_inicio')
        data_fim = request.GET.get('data_fim')
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))

        # Query base
        queryset = SearchHistory.objects.all()

        # Aplicar filtros
        if tribunal and tribunal != 'todos':
            queryset = queryset.filter(tribunais__contains=[tribunal])

        if data_inicio:
            queryset = queryset.filter(executed_at__gte=data_inicio)

        if data_fim:
            queryset = queryset.filter(executed_at__lte=data_fim)

        # Paginação
        total_count = queryset.count()
        start = (page - 1) * limit
        end = start + limit
        results = queryset[start:end]

        # Serializar resultados
        serialized = [
            {
                'id': search.id,
                'data_inicio': search.data_inicio.isoformat(),
                'data_fim': search.data_fim.isoformat(),
                'tribunais': search.tribunais,
                'total_publicacoes': search.total_publicacoes,
                'total_novas': search.total_novas,
                'duration_seconds': search.duration_seconds,
                'executed_at': search.executed_at.isoformat(),
                'search_params': search.search_params
            }
            for search in results
        ]

        # Estatísticas gerais
        all_searches = SearchHistory.objects.all()
        total_buscas = all_searches.count()
        total_pubs = sum(s.total_publicacoes for s in all_searches)

        # Contagem por tribunal
        from collections import Counter
        tribunal_counts = Counter()
        for search in all_searches:
            for trib in search.tribunais:
                tribunal_counts[trib] += 1

        return Response({
            'success': True,
            'count': total_count,
            'page': page,
            'total_pages': (total_count + limit - 1) // limit,
            'results': serialized,
            'statistics': {
                'total_buscas': total_buscas,
                'total_publicacoes_encontradas': total_pubs,
                'media_publicacoes_por_busca': round(total_pubs / total_buscas, 1) if total_buscas > 0 else 0,
                'tribunais_count': dict(tribunal_counts)
            }
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_search_history_detail(request, search_id):
    """
    Detalhes de uma busca específica com suas publicações.
    GET /api/publications/history/<id>
    """
    try:
        search = SearchHistory.objects.get(id=search_id)

        # Buscar publicações dessa busca pelo período e tribunais
        publications = Publication.objects.filter(
            data_disponibilizacao__gte=search.data_inicio,
            data_disponibilizacao__lte=search.data_fim,
            tribunal__in=search.tribunais
        ).order_by('-data_disponibilizacao')[:100]  # Limitar a 100

        return Response({
            'success': True,
            'search': {
                'id': search.id,
                'data_inicio': search.data_inicio.isoformat(),
                'data_fim': search.data_fim.isoformat(),
                'tribunais': search.tribunais,
                'total_publicacoes': search.total_publicacoes,
                'total_novas': search.total_novas,
                'duration_seconds': search.duration_seconds,
                'executed_at': search.executed_at.isoformat(),
                'search_params': search.search_params
            },
            'publications': [
                {
                    'id': pub.id,
                    'id_api': pub.id_api,
                    'numero_processo': pub.numero_processo,
                    'tribunal': pub.tribunal,
                    'tipo_comunicacao': pub.tipo_comunicacao,
                    'data_disponibilizacao': pub.data_disponibilizacao.isoformat(),
                    'texto_resumo': pub.texto_resumo,
                    'link_oficial': pub.link_oficial
                }
                for pub in publications
            ]
        })

    except SearchHistory.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Busca não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

**Arquivo:** `backend/apps/publications/urls.py`

```python
urlpatterns = [
    # ... rotas existentes ...
    path('history', views.get_search_history, name='search_history'),
    path('history/<int:search_id>', views.get_search_history_detail, name='search_history_detail'),
]
```

---

## 3. Frontend - Arquitetura Modular

### 3.1. Service Layer

**Arquivo:** `frontend/src/services/publicationsService.js`

**Adicionar métodos:**

```javascript
// Listar histórico de buscas
async getSearchHistory(filters = {}) {
  const params = new URLSearchParams();

  if (filters.tribunal && filters.tribunal !== 'todos') {
    params.append('tribunal', filters.tribunal);
  }
  if (filters.dataInicio) {
    params.append('data_inicio', filters.dataInicio);
  }
  if (filters.dataFim) {
    params.append('data_fim', filters.dataFim);
  }
  if (filters.page) {
    params.append('page', filters.page);
  }
  if (filters.limit) {
    params.append('limit', filters.limit);
  }

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE_URL}/history?${queryString}`
    : `${API_BASE_URL}/history`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Erro ao buscar histórico');
  }

  return data;
},

// Buscar detalhes de uma busca específica
async getSearchHistoryDetail(searchId) {
  const response = await fetch(`${API_BASE_URL}/history/${searchId}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Erro ao buscar detalhes da busca');
  }

  return data;
}
```

### 3.2. Custom Hook

**Arquivo:** `frontend/src/hooks/useSearchHistory.js` (NOVO)

```javascript
import { useState, useCallback } from "react";
import publicationsService from "../services/publicationsService";

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    count: 0,
  });
  const [filters, setFilters] = useState({
    tribunal: "todos",
    dataInicio: null,
    dataFim: null,
  });

  // Carregar histórico de buscas
  const loadSearchHistory = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const data = await publicationsService.getSearchHistory({
          ...filters,
          page,
          limit: 20,
        });

        setSearchHistory(data.results);
        setStatistics(data.statistics);
        setPagination({
          page: data.page,
          totalPages: data.total_pages,
          count: data.count,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // Atualizar filtros e recarregar
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Ir para próxima página
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      loadSearchHistory(pagination.page + 1);
    }
  }, [pagination, loadSearchHistory]);

  // Ir para página anterior
  const previousPage = useCallback(() => {
    if (pagination.page > 1) {
      loadSearchHistory(pagination.page - 1);
    }
  }, [pagination, loadSearchHistory]);

  return {
    searchHistory,
    statistics,
    loading,
    error,
    pagination,
    filters,
    loadSearchHistory,
    updateFilters,
    nextPage,
    previousPage,
  };
}
```

### 3.3. Componentes

#### 3.3.1. Página Principal

**Arquivo:** `frontend/src/pages/SearchHistoryPage.jsx` (NOVO)

```jsx
import { useEffect } from "react";
import { useSearchHistory } from "../hooks/useSearchHistory";
import SearchHistoryList from "../components/SearchHistoryList";
import SearchHistoryFilters from "../components/SearchHistoryFilters";
import SearchHistoryStats from "../components/SearchHistoryStats";
import "./SearchHistoryPage.css";

export default function SearchHistoryPage() {
  const {
    searchHistory,
    statistics,
    loading,
    error,
    pagination,
    filters,
    loadSearchHistory,
    updateFilters,
    nextPage,
    previousPage,
  } = useSearchHistory();

  // Carregar dados ao montar
  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Recarregar ao mudar filtros
  useEffect(() => {
    loadSearchHistory(1);
  }, [filters]);

  return (
    <div className="search-history-page">
      <header className="page-header">
        <h1>📊 Histórico de Buscas</h1>
        <p>Todas as buscas de publicações realizadas no sistema</p>
      </header>

      {statistics && <SearchHistoryStats statistics={statistics} />}

      <SearchHistoryFilters filters={filters} onFiltersChange={updateFilters} />

      {error && <div className="error-message">❌ {error}</div>}

      <SearchHistoryList
        searchHistory={searchHistory}
        loading={loading}
        pagination={pagination}
        onNextPage={nextPage}
        onPreviousPage={previousPage}
      />
    </div>
  );
}
```

#### 3.3.2. Lista de Histórico

**Arquivo:** `frontend/src/components/SearchHistoryList.jsx` (NOVO)

```jsx
import PropTypes from "prop-types";
import SearchHistoryCard from "./SearchHistoryCard";
import "./SearchHistoryList.css";

export default function SearchHistoryList({
  searchHistory,
  loading,
  pagination,
  onNextPage,
  onPreviousPage,
}) {
  if (loading) {
    return (
      <div className="search-history-loading">
        <div className="spinner"></div>
        <p>Carregando histórico...</p>
      </div>
    );
  }

  if (searchHistory.length === 0) {
    return (
      <div className="search-history-empty">
        <p>📭 Nenhuma busca encontrada</p>
        <small>
          Realize uma busca de publicações para ver o histórico aqui
        </small>
      </div>
    );
  }

  return (
    <div className="search-history-list">
      <div className="history-cards">
        {searchHistory.map((search) => (
          <SearchHistoryCard key={search.id} search={search} />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button onClick={onPreviousPage} disabled={pagination.page === 1}>
            ← Anterior
          </button>

          <span>
            Página {pagination.page} de {pagination.totalPages}
          </span>

          <button
            onClick={onNextPage}
            disabled={pagination.page === pagination.totalPages}
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}

SearchHistoryList.propTypes = {
  searchHistory: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
  }).isRequired,
  onNextPage: PropTypes.func.isRequired,
  onPreviousPage: PropTypes.func.isRequired,
};
```

#### 3.3.3. Card de Busca

**Arquivo:** `frontend/src/components/SearchHistoryCard.jsx` (NOVO)

```jsx
import { useState } from "react";
import PropTypes from "prop-types";
import SearchHistoryDetailModal from "./SearchHistoryDetailModal";
import "./SearchHistoryCard.css";

export default function SearchHistoryCard({ search }) {
  const [showModal, setShowModal] = useState(false);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("pt-BR");
  };

  const formatDuration = (seconds) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(1)}s`;
  };

  return (
    <>
      <div className="search-history-card" onClick={() => setShowModal(true)}>
        <div className="card-header">
          <div className="date-range">
            <span className="date-label">📅 Período:</span>
            <strong>
              {formatDate(search.data_inicio)} até {formatDate(search.data_fim)}
            </strong>
          </div>
          <div className="executed-at">
            <small>Executada em {formatDateTime(search.executed_at)}</small>
          </div>
        </div>

        <div className="card-body">
          <div className="tribunais">
            {search.tribunais.map((trib) => (
              <span key={trib} className={`badge badge-${trib.toLowerCase()}`}>
                {trib}
              </span>
            ))}
          </div>

          <div className="results">
            <div className="result-item">
              <span className="result-label">📋 Total:</span>
              <strong>{search.total_publicacoes}</strong>
            </div>
            <div className="result-item success">
              <span className="result-label">✨ Novas:</span>
              <strong>{search.total_novas}</strong>
            </div>
            <div className="result-item">
              <span className="result-label">⏱️ Duração:</span>
              <strong>{formatDuration(search.duration_seconds)}</strong>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <button className="btn-details">Ver Detalhes →</button>
        </div>
      </div>

      {showModal && (
        <SearchHistoryDetailModal
          searchId={search.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

SearchHistoryCard.propTypes = {
  search: PropTypes.shape({
    id: PropTypes.number.isRequired,
    data_inicio: PropTypes.string.isRequired,
    data_fim: PropTypes.string.isRequired,
    tribunais: PropTypes.arrayOf(PropTypes.string).isRequired,
    total_publicacoes: PropTypes.number.isRequired,
    total_novas: PropTypes.number.isRequired,
    duration_seconds: PropTypes.number,
    executed_at: PropTypes.string.isRequired,
  }).isRequired,
};
```

#### 3.3.4. Filtros

**Arquivo:** `frontend/src/components/SearchHistoryFilters.jsx` (NOVO)

```jsx
import PropTypes from "prop-types";
import "./SearchHistoryFilters.css";

export default function SearchHistoryFilters({ filters, onFiltersChange }) {
  return (
    <div className="search-history-filters">
      <div className="filter-group">
        <label htmlFor="tribunal-filter">Tribunal:</label>
        <select
          id="tribunal-filter"
          value={filters.tribunal}
          onChange={(e) => onFiltersChange({ tribunal: e.target.value })}
        >
          <option value="todos">Todos</option>
          <option value="TJSP">TJSP</option>
          <option value="TRF3">TRF3</option>
          <option value="TRT2">TRT2</option>
          <option value="TRT15">TRT15</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="date-start">Data Início:</label>
        <input
          id="date-start"
          type="date"
          value={filters.dataInicio || ""}
          onChange={(e) => onFiltersChange({ dataInicio: e.target.value })}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="date-end">Data Fim:</label>
        <input
          id="date-end"
          type="date"
          value={filters.dataFim || ""}
          onChange={(e) => onFiltersChange({ dataFim: e.target.value })}
        />
      </div>

      <button
        className="btn-clear-filters"
        onClick={() =>
          onFiltersChange({
            tribunal: "todos",
            dataInicio: null,
            dataFim: null,
          })
        }
      >
        🔄 Limpar Filtros
      </button>
    </div>
  );
}

SearchHistoryFilters.propTypes = {
  filters: PropTypes.shape({
    tribunal: PropTypes.string.isRequired,
    dataInicio: PropTypes.string,
    dataFim: PropTypes.string,
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
};
```

#### 3.3.5. Estatísticas

**Arquivo:** `frontend/src/components/SearchHistoryStats.jsx` (NOVO)

```jsx
import PropTypes from "prop-types";
import "./SearchHistoryStats.css";

export default function SearchHistoryStats({ statistics }) {
  const mostConsultedTribunal = Object.entries(statistics.tribunais_count).sort(
    ([, a], [, b]) => b - a,
  )[0];

  return (
    <div className="search-history-stats">
      <div className="stat-card">
        <div className="stat-icon">🔍</div>
        <div className="stat-content">
          <div className="stat-value">{statistics.total_buscas}</div>
          <div className="stat-label">Buscas Realizadas</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📚</div>
        <div className="stat-content">
          <div className="stat-value">
            {statistics.total_publicacoes_encontradas}
          </div>
          <div className="stat-label">Publicações Encontradas</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-content">
          <div className="stat-value">
            {statistics.media_publicacoes_por_busca}
          </div>
          <div className="stat-label">Média por Busca</div>
        </div>
      </div>

      {mostConsultedTribunal && (
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{mostConsultedTribunal[0]}</div>
            <div className="stat-label">
              Mais Consultado ({mostConsultedTribunal[1]}x)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

SearchHistoryStats.propTypes = {
  statistics: PropTypes.shape({
    total_buscas: PropTypes.number.isRequired,
    total_publicacoes_encontradas: PropTypes.number.isRequired,
    media_publicacoes_por_busca: PropTypes.number.isRequired,
    tribunais_count: PropTypes.object.isRequired,
  }).isRequired,
};
```

#### 3.3.6. Modal de Detalhes

**Arquivo:** `frontend/src/components/SearchHistoryDetailModal.jsx` (NOVO)

```jsx
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import publicationsService from "../services/publicationsService";
import Modal from "./Modal";
import "./SearchHistoryDetailModal.css";

export default function SearchHistoryDetailModal({ searchId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const result =
          await publicationsService.getSearchHistoryDetail(searchId);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [searchId]);

  return (
    <Modal onClose={onClose} size="large">
      <div className="search-history-detail-modal">
        <h2>Detalhes da Busca #{searchId}</h2>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Carregando detalhes...</p>
          </div>
        )}

        {error && <div className="error">❌ {error}</div>}

        {data && (
          <>
            <div className="search-info">
              <div className="info-group">
                <strong>Período:</strong>
                <span>
                  {new Date(data.search.data_inicio).toLocaleDateString(
                    "pt-BR",
                  )}
                  {" até "}
                  {new Date(data.search.data_fim).toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="info-group">
                <strong>Tribunais:</strong>
                <div className="tribunais">
                  {data.search.tribunais.map((trib) => (
                    <span key={trib} className="badge">
                      {trib}
                    </span>
                  ))}
                </div>
              </div>

              <div className="info-group">
                <strong>Resultados:</strong>
                <span>
                  {data.search.total_publicacoes} total (
                  {data.search.total_novas} novas)
                </span>
              </div>

              <div className="info-group">
                <strong>Executada em:</strong>
                <span>
                  {new Date(data.search.executed_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="publications-list">
              <h3>Publicações ({data.publications.length})</h3>
              <div className="publications-grid">
                {data.publications.map((pub) => (
                  <div key={pub.id} className="publication-mini-card">
                    <div className="mini-card-header">
                      <span
                        className={`badge badge-${pub.tribunal.toLowerCase()}`}
                      >
                        {pub.tribunal}
                      </span>
                      <span className="tipo">{pub.tipo_comunicacao}</span>
                    </div>
                    <div className="processo">
                      {pub.numero_processo || "Sem número"}
                    </div>
                    <div className="data">
                      {new Date(pub.data_disponibilizacao).toLocaleDateString(
                        "pt-BR",
                      )}
                    </div>
                    <div className="resumo">
                      {pub.texto_resumo.substring(0, 100)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn-primary">
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}

SearchHistoryDetailModal.propTypes = {
  searchId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};
```

---

## 4. Navegação e Rotas

### 4.1. Adicionar Rota no App.jsx

```jsx
import SearchHistoryPage from "./pages/SearchHistoryPage";

// Dentro de <Routes>:
<Route path="/search-history" element={<SearchHistoryPage />} />;
```

### 4.2. Adicionar Link no Menu

**Arquivo:** `frontend/src/components/Menu.jsx`

Adicionar item de menu:

```jsx
<Link
  to="/search-history"
  className={location.pathname === "/search-history" ? "active" : ""}
>
  <span className="icon">📊</span>
  <span className="label">Histórico</span>
</Link>
```

---

## 5. Estimativa de Tempo

### Backend (1h - 1h15)

- ✅ 20min: Implementar endpoint `get_search_history`
- ✅ 15min: Implementar endpoint `get_search_history_detail`
- ✅ 10min: Adicionar rotas no urls.py
- ✅ 15min: Testar endpoints com dados reais
- ✅ 10min: Ajustes e correções

### Frontend (1h30 - 2h)

- ✅ 15min: Adicionar métodos no publicationsService.js
- ✅ 20min: Criar hook useSearchHistory.js
- ✅ 25min: Criar SearchHistoryPage.jsx
- ✅ 20min: Criar SearchHistoryList.jsx e SearchHistoryCard.jsx
- ✅ 15min: Criar SearchHistoryFilters.jsx
- ✅ 15min: Criar SearchHistoryStats.jsx
- ✅ 20min: Criar SearchHistoryDetailModal.jsx
- ✅ 15min: Estilização CSS dos componentes
- ✅ 15min: Adicionar rota e link no menu
- ✅ 10min: Testes finais

**Total:** 2h30 - 3h15

---

## 6. Fases de Implementação

### Fase 1: Backend - API Endpoints (1h)

1. Implementar `get_search_history` view
2. Implementar `get_search_history_detail` view
3. Adicionar rotas no urls.py
4. Testar no Postman/browser

### Fase 2: Frontend - Service e Hook (35min)

1. Adicionar métodos no publicationsService.js
2. Criar hook useSearchHistory.js
3. Testar chamadas da API

### Fase 3: Frontend - Componentes Principais (1h)

1. Criar SearchHistoryPage.jsx
2. Criar SearchHistoryList.jsx
3. Criar SearchHistoryCard.jsx
4. CSS básico

### Fase 4: Frontend - Componentes Auxiliares (50min)

1. Criar SearchHistoryFilters.jsx
2. Criar SearchHistoryStats.jsx
3. Criar SearchHistoryDetailModal.jsx
4. CSS completo

### Fase 5: Integração e Testes (20min)

1. Adicionar rota no App.jsx
2. Adicionar link no Menu.jsx
3. Testar navegação
4. Testar filtros e paginação
5. Validar PropTypes

---

## 7. Melhorias Futuras (Opcional)

1. **Gráficos**
   - Gráfico de linha: quantidade de buscas por dia
   - Gráfico de pizza: distribuição por tribunal
   - Gráfico de barra: publicações por tipo

2. **Exportação**
   - Exportar histórico para CSV
   - Exportar estatísticas para PDF

3. **Comparação**
   - Comparar duas buscas lado a lado
   - Ver diferenças entre buscas

4. **Pesquisa**
   - Buscar em histórico por número de processo
   - Filtrar por tipo de comunicação

5. **Ações em Lote**
   - Deletar múltiplas buscas antigas
   - Reexecutar busca selecionada

---

## 8. Checklist de Implementação

### Backend

- [ ] Implementar view `get_search_history`
- [ ] Implementar view `get_search_history_detail`
- [ ] Adicionar rotas no `urls.py`
- [ ] Testar endpoints com Postman
- [ ] Validar resposta JSON

### Frontend - Service/Hook

- [ ] Adicionar `getSearchHistory()` no service
- [ ] Adicionar `getSearchHistoryDetail()` no service
- [ ] Criar hook `useSearchHistory`
- [ ] Testar chamadas da API no console

### Frontend - Componentes

- [ ] Criar `SearchHistoryPage.jsx`
- [ ] Criar `SearchHistoryList.jsx`
- [ ] Criar `SearchHistoryCard.jsx`
- [ ] Criar `SearchHistoryFilters.jsx`
- [ ] Criar `SearchHistoryStats.jsx`
- [ ] Criar `SearchHistoryDetailModal.jsx`
- [ ] Criar arquivos CSS para cada componente

### Integração

- [ ] Adicionar rota no `App.jsx`
- [ ] Adicionar link no `Menu.jsx`
- [ ] Testar navegação completa
- [ ] Validar PropTypes
- [ ] Verificar erros no console

### Testes

- [ ] Testar com banco vazio
- [ ] Testar com poucos registros
- [ ] Testar com muitos registros
- [ ] Testar filtros
- [ ] Testar paginação
- [ ] Testar modal de detalhes
- [ ] Testar responsividade

### Finalização

- [ ] Commit das mudanças
- [ ] Push para feature/publications
- [ ] Atualizar documentação
- [ ] Screenshots para documentação

---

## 9. Observações Técnicas

1. **Paginação:** Implementar paginação desde o início para lidar com grandes volumes de histórico

2. **Performance:** Limitar publicações do detail a 100 para não sobrecarregar o modal

3. **Cache:** Considerar cache local do histórico para evitar requisições repetidas

4. **Filtros:** Manter filtros no estado global para persistir entre navegações

5. **Ordenação:** Sempre ordenar por data de execução (mais recente primeiro)

6. **Responsividade:** Garantir que cards e tabelas funcionem bem em mobile

7. **Acessibilidade:** Adicionar labels adequadas e navegação por teclado

8. **Tratamento de Erros:** Exibir mensagens claras quando não houver dados ou ocorrer erro

---

**Pronto para começar a implementação?** 🚀

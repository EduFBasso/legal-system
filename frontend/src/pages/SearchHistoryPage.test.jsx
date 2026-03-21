import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useMemo, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SearchHistoryPage from './SearchHistoryPage';

// Mock SearchHistoryControls to avoid dealing with inputs/ordering
vi.mock('../components/SearchHistoryControls', () => ({
  default: () => <div data-testid="search-history-controls" />
}));

// Mock SearchHistoryList to render a clickable list of searches
vi.mock('../components/SearchHistoryList', () => ({
  default: ({ searches, onSearchClick }) => (
    <div data-testid="search-history-list">
      {searches.map((s) => (
        <button key={s.id} onClick={() => onSearchClick(s)}>
          Open search {s.id}
        </button>
      ))}
    </div>
  )
}));

// Mock PublicationCard and PublicationDetailModal used by the detail panel
vi.mock('../components/PublicationCard', () => ({
  default: ({ publication, onClick }) => (
    <div data-testid={`pub-card-${publication.id_api}`} onClick={onClick}>
      Pub {publication.id_api}
    </div>
  )
}));

vi.mock('../components/PublicationDetailModal', () => ({
  default: () => <div data-testid="publication-detail-modal" />
}));

// Mock notification read hook
vi.mock('../hooks/usePublicationNotificationRead', () => ({
  usePublicationNotificationRead: () => vi.fn(),
}));

// Mock publicationsService used in SearchHistoryPage (backend-only search branch)
vi.mock('../services/publicationsService', () => ({
  default: {
    getSearchHistory: vi.fn(),
    getSearchHistoryDetail: vi.fn(),
    deleteSearchHistory: vi.fn(),
    formatDateBR: (s) => s,
  }
}));

// Stateful mock for useSearchHistory so SearchHistoryPage can "open" a search
const mockLoadSearchDetail = vi.fn();
const mockClearSelectedSearch = vi.fn();

vi.mock('../hooks/useSearchHistory', () => ({
  useSearchHistory: () => {
    // Searches are already ordered (-executed_at) in real hook
    const initialSearches = useMemo(() => ([
      {
        id: 10,
        executed_at: '2026-03-21T10:00:00Z',
        data_inicio: '2026-03-20',
        data_fim: '2026-03-21',
        tribunais: ['TJSP'],
        total_publicacoes: 2,
        total_novas: 2,
        duration_seconds: 1,
      },
      {
        id: 9,
        executed_at: '2026-03-21T09:00:00Z',
        data_inicio: '2026-03-19',
        data_fim: '2026-03-20',
        tribunais: ['TRF3'],
        total_publicacoes: 1,
        total_novas: 0,
        duration_seconds: 1,
      },
    ]), []);

    const [selectedSearch, setSelectedSearch] = useState(null);
    const [selectedPublications, setSelectedPublications] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const loadSearchDetail = async (searchId) => {
      mockLoadSearchDetail(searchId);
      setDetailLoading(true);
      // Simulate immediate load
      const found = initialSearches.find((s) => s.id === searchId);
      setSelectedSearch(found || null);
      setSelectedPublications([
        {
          id_api: 533000001,
          numero_processo: '0000000-00.2026.8.26.0000',
          tribunal: 'TJSP',
          tipo_comunicacao: 'Intimação',
          data_disponibilizacao: '2026-03-21',
          orgao: 'Órgão',
          meio: 'D',
          texto_resumo: 'Resumo',
          texto_completo: 'Completo',
        },
      ]);
      setDetailLoading(false);
    };

    const clearSelectedSearch = () => {
      mockClearSelectedSearch();
      setSelectedSearch(null);
      setSelectedPublications([]);
    };

    return {
      searches: initialSearches,
      loading: false,
      error: null,
      pagination: { count: 2, limit: 20, offset: 0, hasNext: false, hasPrevious: false },
      ordering: '-executed_at',
      selectedSearch,
      selectedPublications,
      detailLoading,
      isClearing: false,
      loadSearchDetail,
      nextPage: vi.fn(),
      previousPage: vi.fn(),
      changeOrdering: vi.fn(),
      clearSelectedSearch,
      clearHistory: vi.fn(),
      formatDate: (s) => s,
      formatDateTime: (s) => s,
    };
  }
}));

function renderAt(pathname, state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname, state }]}>
      <Routes>
        <Route path="/search-history" element={<SearchHistoryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SearchHistoryPage (inline details)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens selected search details inline on click', async () => {
    const user = userEvent.setup();
    renderAt('/search-history');

    expect(screen.getByTestId('search-history-list')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Open search 10/i }));

    await waitFor(() => {
      expect(mockLoadSearchDetail).toHaveBeenCalledWith(10);
    });

    // Inline panel title
    expect(screen.getByText('Publicações')).toBeInTheDocument();
    // Publications card rendered inline
    expect(screen.getByTestId('pub-card-533000001')).toBeInTheDocument();
  });

  it('auto-opens most recent search when coming from publications search', async () => {
    renderAt('/search-history', { fromPublicationsSearch: true });

    await waitFor(() => {
      expect(mockLoadSearchDetail).toHaveBeenCalledWith(10);
    });

    expect(screen.getByText('Publicações')).toBeInTheDocument();
  });
});

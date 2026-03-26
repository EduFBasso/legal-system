/**
 * Tests for MasterDashboardPage (contacts filtering)
 *
 * Goal: ensure contacts list is fetched scoped to selected lawyer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MasterDashboardPage from './MasterDashboardPage';

const getAllTasksMock = vi.fn();
const patchTaskMock = vi.fn();

vi.mock('../services/caseTasksService', () => ({
  default: {
    getAllTasks: (...args) => getAllTasksMock(...args),
    patchTask: (...args) => patchTaskMock(...args),
  },
}));

const openCaseDetailWindowMock = vi.fn();
vi.mock('../utils/publicationNavigation', () => ({
  openCaseDetailWindow: (...args) => openCaseDetailWindowMock(...args),
}));

vi.mock('../components/MasterContactDetailsModal', () => ({
  default: ({ isOpen, contactId, teamMemberId }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="contact-detail-modal">
        open:{String(contactId || '')};scope:{String(teamMemberId || '')}
      </div>
    );
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      role: 'MASTER',
      username: 'master.user',
      first_name: 'Master',
      full_name_oab: 'Master',
      oab_number: '',
    },
    updateAuthUser: vi.fn(),
    fetchLawyers: vi.fn(),
  }),
}));

const getAllMock = vi.fn();
vi.mock('../services/api', () => ({
  default: {
    getAll: (...args) => getAllMock(...args),
  },
}));

const getTeamMembersMock = vi.fn();
vi.mock('../services/teamService', () => ({
  createTeamMember: vi.fn(),
  deactivateTeamMember: vi.fn(),
  updateMasterSelfAccount: vi.fn(),
  updateTeamMember: vi.fn(),
  getTeamMembers: (...args) => getTeamMembersMock(...args),
}));

vi.mock('../services/casesService', () => ({
  default: {
    getStats: vi.fn().mockResolvedValue({ total: 0 }),
  },
}));

vi.mock('../utils/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../utils/apiFetch';

describe('MasterDashboardPage', () => {
  beforeEach(() => {
    getAllMock.mockResolvedValue([]);
    openCaseDetailWindowMock.mockReset();
    getAllTasksMock.mockResolvedValue([]);
    patchTaskMock.mockResolvedValue({});
    apiFetch.mockImplementation(async (endpoint) => {
      if (String(endpoint).startsWith('/cases/')) {
        return [
          {
            id: 99,
            numero_processo_formatted: '0000000-00.0000.0.00.0000',
            numero_processo: '0000000-00.0000.0.00.0000',
            titulo: 'Processo X',
            tribunal: 'TJSP',
            status: 'ATIVO',
          },
        ];
      }

      // tasks/payments/expenses used by KPIs
      return [];
    });
    getTeamMembersMock.mockResolvedValue([
      {
        id: 1,
        username: 'adv1',
        email: 'adv1@test.com',
        first_name: 'Adv',
        full_name_oab: 'Adv Um',
        role: 'ADVOGADO',
        is_active: true,
        profile_is_active: true,
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches contacts scoped to selected lawyer', async () => {
    render(
      <MemoryRouter>
        <MasterDashboardPage />
      </MemoryRouter>
    );


    // Wait team members load and option is available
    expect(await screen.findByRole('option', { name: 'Adv' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Advogado(a)'), {
        target: { value: '1' },
      });
    });

    // Debounced contacts fetch (300ms)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    const calls = getAllMock.mock.calls.map((call) => call[0]);
    expect(calls.some((params) => params && params.team_member_id === '1')).toBe(true);
    expect(calls.some((params) => params && params.team_scope === 'all')).toBe(false);
  });

  it('opens contact details modal in read-only when view icon is clicked', async () => {
    getAllMock.mockImplementation(async (params) => {
      if (params && params.team_member_id === '1') {
        return [
          {
            id: 10,
            name: 'Contato A',
            person_type: 'PF',
            document_formatted: '000.000.000-00',
            primary_contact: null,
            photo_thumbnail: null,
            is_client_anywhere: false,
            linked_cases: [],
          },
        ];
      }
      return [];
    });

    render(
      <MemoryRouter>
        <MasterDashboardPage />
      </MemoryRouter>
    );


    expect(await screen.findByRole('option', { name: 'Adv' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Advogado(a)'), {
        target: { value: '1' },
      });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(await screen.findByText('Contato A')).toBeInTheDocument();

    await act(async () => {
      screen.getByTitle('Visualizar contato').click();
    });

    const modal = await screen.findByTestId('contact-detail-modal');
    expect(modal).toHaveTextContent('open:10');
    expect(modal).toHaveTextContent('scope:1');
  });

  it('opens case detail window scoped to selected lawyer (readonly)', async () => {
    render(
      <MemoryRouter>
        <MasterDashboardPage />
      </MemoryRouter>
    );


    expect(await screen.findByRole('option', { name: 'Adv' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Advogado(a)'), {
        target: { value: '1' },
      });
    });

    await act(async () => {
      screen.getByText('Processos').closest('button').click();
    });

    // Debounced cases fetch (300ms)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(await screen.findByText('Processo X')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('Processo X').closest('tr').click();
    });

    expect(openCaseDetailWindowMock).toHaveBeenCalledWith(99, { teamMemberId: '1', readOnly: true });
  });

  it('opens case detail window focused on Financeiro when clicking the money icon', async () => {
    render(
      <MemoryRouter>
        <MasterDashboardPage />
      </MemoryRouter>
    );


    expect(await screen.findByRole('option', { name: 'Adv' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Advogado(a)'), {
        target: { value: '1' },
      });
    });

    await act(async () => {
      screen.getByText('Processos').closest('button').click();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(await screen.findByText('Processo X')).toBeInTheDocument();

    await act(async () => {
      screen.getByTitle('Abrir aba Financeiro (somente leitura)').click();
    });

    expect(openCaseDetailWindowMock).toHaveBeenCalledWith(99, {
      teamMemberId: '1',
      readOnly: true,
      tab: 'financeiro',
    });
  });

  it('renders scheduled tasks inside master page (readonly, scoped)', async () => {
    getAllTasksMock.mockResolvedValue([
      {
        id: 501,
        status: 'PENDENTE',
        titulo: 'Tarefa A',
        descricao: 'Desc A',
        data_vencimento: '2030-01-01',
        case: 99,
        case_numero: '0000000-00.0000.0.00.0000',
        movimentacao: 777,
        movimentacao_titulo: 'Mov 1',
      },
    ]);

    render(
      <MemoryRouter>
        <MasterDashboardPage />
      </MemoryRouter>
    );


    expect(await screen.findByRole('option', { name: 'Adv' })).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Advogado(a)'), {
        target: { value: '1' },
      });
    });

    await act(async () => {
      screen.getByRole('button', { name: /Tarefas/i }).click();
    });

    expect(screen.queryByText('Abrir Tarefas Agendadas em nova aba')).not.toBeInTheDocument();
    expect(await screen.findByText('Tarefa A')).toBeInTheDocument();
    expect(getAllTasksMock).toHaveBeenCalledWith({ team_member_id: '1' });

    const caseLink = screen.getByText('0000000-00.0000.0.00.0000');
    expect(caseLink).toHaveAttribute('aria-disabled', 'true');

    const movementLink = screen.getByText(/📋\s*Mov 1/i);
    expect(movementLink).toHaveAttribute('aria-disabled', 'true');
  });
});

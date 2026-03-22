import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MasterContactDetailsModal from './MasterContactDetailsModal';

const mockGetById = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    getById: (...args) => mockGetById(...args),
  },
}));

function renderModal(props) {
  return render(
    <BrowserRouter>
      <MasterContactDetailsModal {...props} />
    </BrowserRouter>
  );
}

describe('MasterContactDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads full contact details scoped to team_member_id and renders address fields', async () => {
    mockGetById.mockResolvedValueOnce({
      id: 10,
      name: 'Contato A',
      person_type: 'PF',
      person_type_display: 'Pessoa Física',
      document_formatted: '000.000.000-00',
      email: 'contato@test.com',
      phone_formatted: '(11) 1111-1111',
      mobile_formatted: '(11) 99999-9999',
      zip_code_formatted: '01000-000',
      street: 'Rua X',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      address_oneline: 'Rua X, 123 - Centro, São Paulo/SP - 01000-000',
      notes: 'Alguma observação',
      linked_cases: [],
    });

    renderModal({
      isOpen: true,
      onClose: vi.fn(),
      contactId: 10,
      teamMemberId: '1',
    });

    await waitFor(() => {
      expect(mockGetById).toHaveBeenCalledWith(10, { team_member_id: '1' });
    });

    expect(await screen.findByText('Contato A')).toBeInTheDocument();
    expect(screen.getByText('01000-000')).toBeInTheDocument();
    expect(screen.getByText('Rua X')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('Centro')).toBeInTheDocument();
    expect(screen.getByText('São Paulo/SP')).toBeInTheDocument();
  });
});

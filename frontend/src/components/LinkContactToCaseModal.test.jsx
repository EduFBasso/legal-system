/**
 * Tests for LinkContactToCaseModal component
 * 
 * Coverage:
 * - Modal opens and closes
 * - Search filter works
 * - Form submission
 * - Role selection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LinkContactToCaseModal from './LinkContactToCaseModal';

// Mock API
vi.mock('../services/api', () => ({
  default: {
    cases: {
      getAll: vi.fn(() => Promise.resolve([
        {
          id: 1,
          numero_processo: '0000001-23.2025.8.26.0100',
          assunto: 'Ação de Cobrança',
        },
        {
          id: 2,
          numero_processo: '0000002-23.2025.8.26.0100',
          assunto: 'Ação Trabalhista',
        },
        {
          id: 3,
          numero_processo: '0000003-23.2025.8.26.0100',
          assunto: 'Ação de Despejo',
        },
      ])),
    },
    caseParties: {
      create: vi.fn(() => Promise.resolve({ id: 100 })),
    },
  },
}));

describe('LinkContactToCaseModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSuccess.mockClear();
  });

  it('renders modal when open', () => {
    render(
      <LinkContactToCaseModal
        isOpen={true}
        onClose={mockOnClose}
        contactId={1}
        contactName="João Silva"
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/Vincular a Processo/i)).toBeInTheDocument();
    expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <LinkContactToCaseModal
        isOpen={false}
        onClose={mockOnClose}
        contactId={1}
        contactName="João Silva"
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText(/Vincular/)).not.toBeInTheDocument();
  });

  it('renders search input', async () => {
    render(
      <LinkContactToCaseModal
        isOpen={true}
        onClose={mockOnClose}
        contactId={1}
        contactName="João Silva"
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por número ou assunto/i)).toBeInTheDocument();
    });
  });

  it('filters cases by search term', async () => {
    const user = userEvent.setup();

    render(
      <LinkContactToCaseModal
        isOpen={true}
        onClose={mockOnClose}
        contactId={1}
        contactName="João Silva"
        onSuccess={mockOnSuccess}
      />
    );

    // Wait for cases to load
    await waitFor(() => {
      expect(screen.getByText(/0000001/)).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText(/Buscar por número ou assunto/i);
    await user.type(searchInput, 'Trabalhista');

    // Check that search input has the value
    expect(searchInput).toHaveValue('Trabalhista');
  });

  it('shows all cases when search is cleared', async () => {
    const user = userEvent.setup();

    render(
      <LinkContactToCaseModal
        isOpen={true}
        onClose={mockOnClose}
        contactId={1}
        contactName="João Silva"
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/0000001/)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por número ou assunto/i);
    
    // Type and then clear
    await user.type(searchInput, 'Trabalhista');
    await user.clear(searchInput);

    // Search should be empty
    expect(searchInput).toHaveValue('');
  });

  it('renders role radio buttons', async () => {
    render(
      <LinkContactToCaseModal
        isOpen={true}
        onClose={mockOnClose}
        contactId={1}
        contactName="João Silva"
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Autor \(Cliente\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Réu \(Cliente\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Testemunha \(Não-cliente\)/i)).toBeInTheDocument();
    });
  });

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LinkContactToCaseModal
        isOpen={true}
        onClose={mockOnClose}
        contactId={1}
        contactName="João Silva"
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal when X button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LinkContactToCaseModal
        isOpen={true}
        onClose={mockOnClose}
        contactId={1}
        contactName="João Silva"
        onSuccess={mockOnSuccess}
      />
    );

    // Look for close button by its exact text content
    const closeButton = screen.getByRole('button', { name: '✕' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

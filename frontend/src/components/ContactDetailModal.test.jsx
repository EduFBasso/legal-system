// src/components/ContactDetailModal.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ContactDetailModal from './ContactDetailModal';

// Mock API
const mockGetById = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    getById: (...args) => mockGetById(...args),
    create: (...args) => mockCreate(...args),
    update: (...args) => mockUpdate(...args),
    delete: (...args) => mockDelete(...args),
  }
}));

// Mock deleteParty
const mockDeleteParty = vi.fn();
vi.mock('../services/casePartiesService', () => ({
  deleteParty: (...args) => mockDeleteParty(...args)
}));

// Mock Settings Context
const mockSettings = {
  showEmptyFields: false,
  deletePassword: ''
};

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: mockSettings })
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ContactDetailModal', () => {
  const mockContact = {
    id: 1,
    name: 'João Silva',
    trading_name: '',
    person_type: 'PF',
    person_type_display: 'Pessoa Física',
    document_number: '12345678900',
    document_formatted: '123.456.789-00',
    email: 'joao@email.com',
    phone: '1133334444',
    phone_formatted: '(11) 3333-4444',
    mobile: '11987654321',
    mobile_formatted: '(11) 98765-4321',
    street: 'Rua Principal',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234567',
    notes: 'Cliente importante',
    photo_large: null,
    has_contact_info: true,
    has_complete_address: true,
    address_oneline: 'Rua Principal, 123, Apto 45 - Centro, São Paulo/SP - 01234-567',
    linked_cases: [
      {
        id: 10,
        case_id: 1,
        numero_processo: '0000001-23.2024.8.26.0100',
        role: 'AUTOR',
        role_display: 'Autor',
        is_client: true
      }
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-02-20T14:30:00Z'
  };

  const mockOnClose = vi.fn();
  const mockOnContactUpdated = vi.fn();
  const mockOnLinkToCase = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue(mockContact);
    mockSettings.showEmptyFields = false;
    mockSettings.deletePassword = '';
  });

  describe('CREATE Mode', () => {
    it('renders create form when no contactId is provided', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={null}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Novo Contato/i)).toBeInTheDocument();
      });
    });

    it('starts in edit mode when creating', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={null}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        // First input should be the name field and should be editable
        expect(inputs[0]).not.toHaveAttribute('readonly');
      });
    });

    it('shows required field indicator on name', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={null}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        // Check for required asterisk or similar
        expect(screen.getByText(/Nome/i).parentElement).toBeTruthy();
      });
    });

    it('validates name is required on save', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={null}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Novo Contato/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Criar Contato/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('creates contact successfully with valid data', async () => {
      const user = userEvent.setup();
      const newContact = { ...mockContact, id: 999, name: 'Novo Contato' };
      mockCreate.mockResolvedValueOnce(newContact);
      
      renderWithRouter(
        <ContactDetailModal
          contactId={null}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Novo Contato/i)).toBeInTheDocument();
      });

      // Use first textbox as name input
      const inputs = screen.getAllByRole('textbox');
      const nameInput = inputs[0];
      await user.clear(nameInput);
      await user.type(nameInput, 'Novo Contato');

      const saveButton = screen.getByRole('button', { name: /Criar Contato/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Novo Contato'
          })
        );
        expect(mockOnContactUpdated).toHaveBeenCalledWith(newContact, true);
      });
    });

    it('calls onClose when cancel is clicked in create mode', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={null}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Novo Contato/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('VIEW Mode', () => {
    it('loads and displays contact details', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(mockGetById).toHaveBeenCalledWith(1);
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      mockGetById.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
    });

    it('displays error message when API fails', async () => {
      mockGetById.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar detalhes/i)).toBeInTheDocument();
      });
    });

    it('retries loading when retry button is clicked', async () => {
      mockGetById.mockRejectedValueOnce(new Error('Network error'));
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar detalhes/i)).toBeInTheDocument();
      });

      mockGetById.mockResolvedValueOnce(mockContact);
      const retryButton = screen.getByRole('button', { name: /Tentar Novamente/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockGetById).toHaveBeenCalledTimes(2);
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });

    it('displays linked cases', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        // Process number is split across elements, use partial text match
        expect(screen.getByText((content, element) => {
          return element?.className === 'linked-case-number' && content.includes('0000001-23');
        })).toBeInTheDocument();
        expect(screen.getByText(/autor/i)).toBeInTheDocument();
        // Check for client badge specifically
        const clientBadges = screen.queryAllByText(/CLIENTE/i);
        expect(clientBadges.length).toBeGreaterThan(0);
      });
    });

    it('shows message when no linked cases exist', async () => {
      mockGetById.mockResolvedValueOnce({ ...mockContact, linked_cases: [] });
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Nenhum processo vinculado ainda/i)).toBeInTheDocument();
      });
    });

    it('renders edit button in view mode', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
      });
    });

    it('renders delete button in view mode', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Excluir/i })).toBeInTheDocument();
      });
    });
  });

  describe('EDIT Mode', () => {
    it('switches to edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Editar/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText(/Editar Contato/i)).toBeInTheDocument();
        const nameInput = screen.getByDisplayValue('João Silva');
        expect(nameInput).not.toHaveAttribute('readonly');
      });
    });

    it('updates contact successfully', async () => {
      const user = userEvent.setup();
      const updatedContact = { ...mockContact, name: 'João Silva Updated' };
      mockUpdate.mockResolvedValueOnce(updatedContact);
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Editar/i });
      await user.click(editButton);

      const nameInput = screen.getByDisplayValue('João Silva');
      await user.clear(nameInput);
      await user.type(nameInput, 'João Silva Updated');

      const saveButton = screen.getByRole('button', { name: /Atualizar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: 'João Silva Updated'
          })
        );
        expect(mockOnContactUpdated).toHaveBeenCalledWith(updatedContact, false);
      });
    });

    it('cancels edit and reverts to view mode', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Editar/i });
      await user.click(editButton);

      const nameInput = screen.getByDisplayValue('João Silva');
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText(/Detalhes do Contato/i)).toBeInTheDocument();
        // Name should be reverted
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });

    it('validates name is required when updating', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Editar/i });
      await user.click(editButton);

      const nameInput = screen.getByDisplayValue('João Silva');
      await user.clear(nameInput);

      const saveButton = screen.getByRole('button', { name: /Atualizar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      });

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('shows error message when update fails', async () => {
      const user = userEvent.setup();
      mockUpdate.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Editar/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /Atualizar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao salvar alterações/i)).toBeInTheDocument();
      });
    });
  });

  describe('DELETE Functionality', () => {
    it('opens delete confirmation dialog', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Excluir/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirmar Exclusão/i)).toBeInTheDocument();
        expect(screen.getByText(/Tem certeza que deseja excluir João Silva/i)).toBeInTheDocument();
      });
    });

    it('deletes contact successfully', async () => {
      const user = userEvent.setup();
      mockDelete.mockResolvedValueOnce({});
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Excluir/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirmar Exclusão/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Sim, excluir/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(1);
        expect(mockOnContactUpdated).toHaveBeenCalledWith(null, false, true);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('cancels delete operation', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Excluir/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirmar Exclusão/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Não, manter/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/Confirmar Exclusão/i)).not.toBeInTheDocument();
      });

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe('Linked Cases Management', () => {
    it('renders link to case button when onLinkToCase is provided', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
          onLinkToCase={mockOnLinkToCase}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Vincular Processo/i })).toBeInTheDocument();
      });
    });

    it('calls onLinkToCase when link button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
          onLinkToCase={mockOnLinkToCase}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const linkButton = screen.getByRole('button', { name: /Vincular Processo/i });
      await user.click(linkButton);

      expect(mockOnLinkToCase).toHaveBeenCalledWith(mockContact);
    });

    it('unlinks case when unlink button is clicked and confirmed', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);
      
      const user = userEvent.setup();
      mockDeleteParty.mockResolvedValueOnce({});
      mockGetById.mockResolvedValue(mockContact); // For reload
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/0000001-23.2024.8.26.0100/)).toBeInTheDocument();
      });

      const unlinkButtons = screen.getAllByRole('button', { name: /🗑️/i });
      const unlinkButton = unlinkButtons.find(btn => btn.title === 'Desvincular deste processo');
      
      await user.click(unlinkButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(mockDeleteParty).toHaveBeenCalledWith(10);
      });

      // Restore
      window.confirm = originalConfirm;
    });

    it('does not unlink case when confirmation is cancelled', async () => {
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => false);
      
      const user = userEvent.setup();
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/0000001-23.2024.8.26.0100/)).toBeInTheDocument();
      });

      const unlinkButtons = screen.getAllByRole('button', { name: /🗑️/i });
      const unlinkButton = unlinkButtons.find(btn => btn.title === 'Desvincular deste processo');
      
      await user.click(unlinkButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockDeleteParty).not.toHaveBeenCalled();

      window.confirm = originalConfirm;
    });
  });

  describe('allowModification Prop', () => {
    it('shows read-only notice when allowModification is false', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
          allowModification={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Apenas Visualização/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Excluir/i })).not.toBeInTheDocument();
      });
    });

    it('shows edit and delete buttons when allowModification is true', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
          allowModification={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Excluir/i })).toBeInTheDocument();
      });
    });
  });

  describe('Modal Visibility', () => {
    it('does not render when isOpen is false', () => {
      const { container } = renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={false}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders when isOpen is true', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });
  });

  describe('Person Type Handling', () => {
    it('shows trading name field for PJ (Pessoa Jurídica)', async () => {
      const pjContact = { 
        ...mockContact, 
        person_type: 'PJ',
        trading_name: 'Empresa XYZ Ltda',
        person_type_display: 'Pessoa Jurídica'
      };
      mockGetById.mockResolvedValueOnce(pjContact);
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Nome Fantasia/i)).toBeInTheDocument();
        expect(screen.getByText('Empresa XYZ Ltda')).toBeInTheDocument();
      });
    });

    it('hides trading name field for PF (Pessoa Física)', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Nome Fantasia/i)).not.toBeInTheDocument();
    });

    it('shows CPF label for PF', async () => {
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('CPF')).toBeInTheDocument();
      });
    });

    it('shows CNPJ label for PJ', async () => {
      const pjContact = { 
        ...mockContact, 
        person_type: 'PJ',
        person_type_display: 'Pessoa Jurídica',
        document_formatted: '12.345.678/0001-90'
      };
      mockGetById.mockResolvedValueOnce(pjContact);
      
      renderWithRouter(
        <ContactDetailModal
          contactId={1}
          isOpen={true}
          onClose={mockOnClose}
          onContactUpdated={mockOnContactUpdated}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('CNPJ')).toBeInTheDocument();
      });
    });
  });
});

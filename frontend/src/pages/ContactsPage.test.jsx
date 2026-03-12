// src/pages/ContactsPage.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ContactsPage from './ContactsPage';

// Mock the API module
const mockGetAll = vi.fn();
const mockWindowOpen = vi.fn();
vi.mock('../services/api', () => ({
  default: {
    getAll: (...args) => mockGetAll(...args)
  }
}));

// Mock child components to isolate ContactsPage logic
vi.mock('../components/ContactCard', () => ({
  default: ({ contact, isSelected, onSelect, onView, onLinkToCase }) => (
    <div data-testid={`contact-card-${contact.id}`} className={isSelected ? 'selected' : ''}>
      <span>{contact.name}</span>
      <button onClick={onSelect}>Select</button>
      <button onClick={onView}>View</button>
      <button onClick={onLinkToCase}>Link</button>
    </div>
  )
}));

vi.mock('../components/ContactDetailModal', () => ({
  default: ({ isOpen, contactId, onClose, onContactUpdated, onLinkToCase }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="contact-detail-modal">
        <span>Modal for contact {contactId || 'new'}</span>
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onContactUpdated({ id: 1, name: 'Updated' }, false, false)}>
          Update
        </button>
        <button onClick={() => onContactUpdated({ id: 999, name: 'New Contact' }, true, false)}>
          Create
        </button>
        <button onClick={() => onContactUpdated(null, false, true)}>Delete</button>
        <button onClick={() => onLinkToCase({ id: 1, name: 'João' })}>
          Open Link Modal
        </button>
      </div>
    );
  }
}));

vi.mock('../components/common/Toast', () => ({
  default: ({ isOpen, message, type, onClose }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="toast" data-type={type}>
        <span>{message}</span>
        <button onClick={onClose}>Close Toast</button>
      </div>
    );
  }
}));

// Helper to render with Router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ContactsPage', () => {
  const mockContacts = [
    {
      id: 1,
      name: 'João Silva',
      person_type: 'PESSOA_FISICA',
      document: '123.456.789-00',
      phone: '19990198519',
      is_client_anywhere: true,
      linked_cases: [{ id: 1, process_number: '0000001-23' }]
    },
    {
      id: 2,
      name: 'Maria Santos',
      person_type: 'PESSOA_FISICA',
      document: '987.654.321-00',
      phone: '19991234567',
      is_client_anywhere: false,
      linked_cases: []
    },
    {
      id: 3,
      name: 'Empresa XYZ Ltda',
      person_type: 'PESSOA_JURIDICA',
      document: '12.345.678/0001-90',
      phone: null,
      is_client_anywhere: true,
      linked_cases: [{ id: 2, process_number: '0000002-24' }]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue(mockContacts);
    vi.spyOn(window, 'open').mockImplementation(mockWindowOpen);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders search input', async () => {
      renderWithRouter(<ContactsPage />);
      
      const searchInput = screen.getByPlaceholderText(/Buscar por nome/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('renders new contact button', async () => {
      renderWithRouter(<ContactsPage />);
      
      const newButton = screen.getByRole('button', { name: /Novo Contato/i });
      expect(newButton).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderWithRouter(<ContactsPage />);
      
      expect(screen.getByText(/Carregando contatos/i)).toBeInTheDocument();
    });

    it('loads and displays contacts on mount', async () => {
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalledWith({});
      });

      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Empresa XYZ Ltda')).toBeInTheDocument();
    });

    it('displays error message when API fails', async () => {
      mockGetAll.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar contatos/i)).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockGetAll.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tentar Novamente/i })).toBeInTheDocument();
      });
    });

    it('retries loading when retry button is clicked', async () => {
      mockGetAll.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar contatos/i)).toBeInTheDocument();
      });

      mockGetAll.mockResolvedValueOnce(mockContacts);
      const retryButton = screen.getByRole('button', { name: /Tentar Novamente/i });
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no contacts exist', async () => {
      mockGetAll.mockResolvedValueOnce([]);
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Nenhum contato cadastrado ainda/i)).toBeInTheDocument();
      });
    });

    it('shows no results state when search returns empty', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Type search term
      const searchInput = screen.getByPlaceholderText(/Buscar por nome/i);
      
      // Mock empty response for search
      mockGetAll.mockResolvedValueOnce([]);
      
      await user.type(searchInput, 'NonExistent');

      // Wait for debounce (300ms) + API call + re-render
      await waitFor(() => {
        expect(screen.getByText(/Nenhum resultado para "NonExistent"/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Search Functionality', () => {
    it('debounces search input (300ms)', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nome/i);
      
      // Type characters
      await user.type(searchInput, 'João');

      // Right after typing, API should only have been called once (initial load)
      expect(mockGetAll).toHaveBeenCalledTimes(1);

      // Wait for debounce to complete (300ms) and API to be called
      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalledTimes(2);
        expect(mockGetAll).toHaveBeenLastCalledWith({ search: 'João' });
      }, { timeout: 1000 });
    });

    it('passes search term to API', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nome/i);
      
      mockGetAll.mockResolvedValueOnce([mockContacts[1]]);
      
      await user.type(searchInput, 'Maria');

      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalledWith({ search: 'Maria' });
      }, { timeout: 1000 });
    });

    it('displays filtered results after search', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nome/i);
      
      mockGetAll.mockResolvedValueOnce([mockContacts[1]]);
      
      await user.type(searchInput, 'Maria');

      await waitFor(() => {
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Contact Selection', () => {
    it('selects contact when select button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const contactCard = screen.getByTestId('contact-card-1');
      expect(contactCard).not.toHaveClass('selected');

      const selectButton = contactCard.querySelector('button');
      await user.click(selectButton);

      await waitFor(() => {
        expect(contactCard).toHaveClass('selected');
      });
    });

    it('can select different contacts', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('contact-card-1');
      const card2 = screen.getByTestId('contact-card-2');

      // Select first contact
      await user.click(card1.querySelector('button'));
      expect(card1).toHaveClass('selected');
      expect(card2).not.toHaveClass('selected');

      // Select second contact
      await user.click(card2.querySelector('button'));
      expect(card1).not.toHaveClass('selected');
      expect(card2).toHaveClass('selected');
    });
  });

  describe('Modal Interactions', () => {
    it('opens detail modal when New Contact button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const newButton = screen.getByRole('button', { name: /Novo Contato/i });
      await user.click(newButton);

      expect(screen.getByTestId('contact-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('Modal for contact new')).toBeInTheDocument();
    });

    it('opens detail modal when View button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('contact-card-1');
      const viewButton = card1.querySelectorAll('button')[1]; // View is 2nd button
      await user.click(viewButton);

      expect(screen.getByTestId('contact-detail-modal')).toBeInTheDocument();
      expect(screen.getByText('Modal for contact 1')).toBeInTheDocument();
    });

    it('closes detail modal when close button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('contact-card-1');
      const viewButton = card1.querySelectorAll('button')[1];
      await user.click(viewButton);

      expect(screen.getByTestId('contact-detail-modal')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /Close Modal/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('contact-detail-modal')).not.toBeInTheDocument();
      });
    });

    it('opens cases page in link mode when Link button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('contact-card-1');
      const linkButton = card1.querySelectorAll('button')[2]; // Link is 3rd button
      await user.click(linkButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/cases?action=link&contactId=1',
        '_blank',
        'width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes'
      );
    });

    it('opens cases page in link mode from detail modal', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('contact-card-1');
      const viewButton = card1.querySelectorAll('button')[1];
      await user.click(viewButton);

      expect(screen.getByTestId('contact-detail-modal')).toBeInTheDocument();

      const openLinkButton = screen.getByRole('button', { name: /Open Link Modal/i });
      await user.click(openLinkButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/cases?action=link&contactId=1',
        '_blank',
        'width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes'
      );
    });
  });

  describe('Contact CRUD Operations', () => {
    it('adds new contact to list after creation', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Open new contact modal
      const newButton = screen.getByRole('button', { name: /Novo Contato/i });
      await user.click(newButton);

      // Simulate creation
      const createButton = screen.getByRole('button', { name: /Create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('New Contact')).toBeInTheDocument();
      });
    });

    it('updates contact in list after edit', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Open detail modal
      const card1 = screen.getByTestId('contact-card-1');
      const viewButton = card1.querySelectorAll('button')[1];
      await user.click(viewButton);

      // Simulate update - need to modify mock to update specific contact
      mockGetAll.mockResolvedValueOnce([
        { ...mockContacts[0], name: 'Updated' },
        mockContacts[1],
        mockContacts[2]
      ]);

      const updateButton = screen.getByRole('button', { name: /Update/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
    });

    it('removes contact from list after deletion', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Open detail modal
      const card1 = screen.getByTestId('contact-card-1');
      const viewButton = card1.querySelectorAll('button')[1];
      await user.click(viewButton);

      // Simulate deletion
      mockGetAll.mockResolvedValueOnce([mockContacts[1], mockContacts[2]]);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      });
    });
  });

  describe('Toast Notifications', () => {
    it('shows success toast after creating contact', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const newButton = screen.getByRole('button', { name: /Novo Contato/i });
      await user.click(newButton);

      const createButton = screen.getByRole('button', { name: /Create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument();
        expect(screen.getByText(/Contato criado com sucesso/i)).toBeInTheDocument();
      });
    });

    it('shows success toast after updating contact', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('contact-card-1');
      const viewButton = card1.querySelectorAll('button')[1];
      await user.click(viewButton);

      const updateButton = screen.getByRole('button', { name: /Update/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument();
        expect(screen.getByText(/Alterações salvas/i)).toBeInTheDocument();
      });
    });

    it('shows success toast after deleting contact', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('contact-card-1');
      const viewButton = card1.querySelectorAll('button')[1];
      await user.click(viewButton);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument();
        expect(screen.getByText(/Contato excluído com sucesso/i)).toBeInTheDocument();
      });
    });

    it('shows info toast after opening process to link contact', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const card1 = screen.getByTestId('contact-card-1');
      const linkButton = card1.querySelectorAll('button')[2];
      await user.click(linkButton);

      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument();
        expect(screen.getByText(/Selecione o processo na lista para concluir o vínculo/i)).toBeInTheDocument();
      });
    });

    it('closes toast when close button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Trigger a toast
      const newButton = screen.getByRole('button', { name: /Novo Contato/i });
      await user.click(newButton);
      const createButton = screen.getByRole('button', { name: /Create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument();
      });

      const closeToastButton = screen.getByRole('button', { name: /Close Toast/i });
      await user.click(closeToastButton);

      await waitFor(() => {
        expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
      });
    });
  });

  describe('Link Success Handler', () => {
    it('does not reload contacts after opening process for linking', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<ContactsPage />);
      
      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalledTimes(1);
      });

      const card1 = screen.getByTestId('contact-card-1');
      const linkButton = card1.querySelectorAll('button')[2];
      await user.click(linkButton);

      await waitFor(() => {
        expect(mockGetAll).toHaveBeenCalledTimes(1); // Only initial load
      });
    });
  });
});

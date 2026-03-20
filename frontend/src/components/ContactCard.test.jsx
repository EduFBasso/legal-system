/**
 * Tests for ContactCard component
 * 
 * Coverage:
 * - Renders with all data present
 * - Renders with missing optional data
 * - Badge rendering (Cliente, Testemunha, etc)
 * - Links open correctly
 * - Click handlers work
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContactCard from './ContactCard';

// Mock contact data
const mockContactFull = {
  id: 1,
  name: 'João Silva',
  person_type: 'PF',
  document_formatted: '170.140.798-16',
  primary_contact: '(19) 99019-8519',
  photo_thumbnail: null,
  is_client_anywhere: true,
  linked_cases: [
    {
      id: 1,
      numero_processo: '0000004-23.2025.8.26.0100',
      case_id: 4,
      role: 'AUTOR',
      role_display: 'Autor',
      is_client: true,
    },
  ],
};

const mockContactMinimal = {
  id: 2,
  name: 'Maria Costa',
  person_type: 'PJ',
  document_formatted: null,
  primary_contact: null,
  photo_thumbnail: null,
  is_client_anywhere: false,
  linked_cases: [],
};

const mockContactWithMultipleRoles = {
  id: 3,
  name: 'Pedro Santos',
  person_type: 'PF',
  document_formatted: '123.456.789-00',
  primary_contact: '(11) 98765-4321',
  photo_thumbnail: null,
  is_client_anywhere: true,
  linked_cases: [
    {
      id: 2,
      numero_processo: '0000001-23.2025.8.26.0100',
      case_id: 1,
      role: 'CLIENTE',
      role_display: 'Cliente/Representado',
      is_client: true,
    },
    {
      id: 3,
      numero_processo: '0000002-23.2025.8.26.0100',
      case_id: 2,
      role: 'TESTEMUNHA',
      role_display: 'Testemunha',
      is_client: false,
    },
  ],
};

// Wrapper for Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ContactCard', () => {
  it('renders contact name', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('renders person type badge', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText('Pessoa Física')).toBeInTheDocument();
  });

  it('renders "Cliente" badge when is_client_anywhere is true', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText(/cliente/i)).toBeInTheDocument();
  });

  it('does not render "Cliente" badge when is_client_anywhere is false', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactMinimal}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.queryByText(/cliente/i)).not.toBeInTheDocument();
  });

  it('renders role badges for non-client roles', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactWithMultipleRoles}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText(/testemunha/i)).toBeInTheDocument();
  });

  it('renders default icon for PF when no photo', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('renders default icon for PJ when no photo', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactMinimal}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText('🏢')).toBeInTheDocument();
  });

  it('renders CPF when available', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText(/170\.140\.798-16/)).toBeInTheDocument();
  });

  it('renders linked process numbers', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText(/0000004/)).toBeInTheDocument();
  });

  it('renders phone number when available', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    expect(screen.getByText(/99019-8519/)).toBeInTheDocument();
  });

  it('applies selected class when isSelected is true', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    const { container } = renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={true}
      />
    );

    const card = container.querySelector('.contact-card');
    expect(card).toHaveClass('selected');
  });

  it('calls onView when view button is clicked', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    const viewButton = screen.getByTitle('Visualizar contato');
    viewButton.click();

    expect(onView).toHaveBeenCalledTimes(1);
  });

  it('calls onLinkToCase when link button is clicked', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    const linkButton = screen.getByTitle('Vincular a processo');
    linkButton.click();

    expect(onLinkToCase).toHaveBeenCalledTimes(1);
  });

  it('renders process links with target="_blank"', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    const processLink = screen.getByRole('link', { name: /0000004/ });
    expect(processLink).toHaveAttribute('target', '_blank');
    expect(processLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders WhatsApp link correctly', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    const whatsappButton = screen.getByTitle('WhatsApp');
    expect(whatsappButton).toHaveAttribute('href', 'https://wa.me/5519990198519');
    expect(whatsappButton).toHaveAttribute('target', '_blank');
  });

  it('renders phone link correctly', () => {
    const onView = vi.fn();
    const onSelect = vi.fn();
    const onLinkToCase = vi.fn();

    renderWithRouter(
      <ContactCard
        contact={mockContactFull}
        onView={onView}
        onSelect={onSelect}
        onLinkToCase={onLinkToCase}
        isSelected={false}
      />
    );

    const phoneButton = screen.getByTitle('Ligar');
    expect(phoneButton).toHaveAttribute('href', 'tel:+5519990198519');
  });
});

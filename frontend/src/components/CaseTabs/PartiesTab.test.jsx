/**
 * Tests for PartiesTab
 *
 * Coverage:
 * - Read-only mode disables mutation actions (add/edit/delete)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PartiesTab from './PartiesTab';

describe('PartiesTab', () => {
  it('disables add/edit/delete buttons when readOnly=true', () => {
    const onAddPartyClick = vi.fn();
    const onEditParty = vi.fn();
    const onRemoveParty = vi.fn();

    render(
      <PartiesTab
        readOnly={true}
        parties={[
          {
            id: 10,
            contact_person_type: 'PF',
            contact_name: 'João Silva',
            role: 'AUTOR',
            role_display: 'Autor',
            is_client: false,
            observacoes: '',
            contact_document: '12345678901',
            contact_phone: '11999999999',
            contact_email: 'joao@example.com',
          },
        ]}
        loadingParties={false}
        onAddPartyClick={onAddPartyClick}
        onEditParty={onEditParty}
        onRemoveParty={onRemoveParty}
      />
    );

    expect(screen.getByRole('button', { name: /Adicionar Parte/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Editar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Excluir/i })).toBeDisabled();
  });

  it('renders a representative card below the client when representation exists', () => {
    render(
      <PartiesTab
        readOnly={true}
        parties={[
          {
            id: 10,
            contact: 111,
            contact_person_type: 'PF',
            contact_name: 'Cliente Representado',
            role: 'CLIENTE',
            role_display: 'Cliente/Representado',
            is_client: true,
          },
        ]}
        loadingParties={false}
        caseData={{
          representations: [
            {
              id: 1,
              represented_contact: 111,
              represented_contact_name: 'Cliente Representado',
              representative_contact: 222,
              representative_contact_name: 'Advogado Representante',
              representation_type: 'Representação Legal',
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Cliente Representado')).toBeInTheDocument();
    expect(screen.getByText('Advogado Representante')).toBeInTheDocument();
    expect(screen.getByText(/representação legal/i)).toBeInTheDocument();
    expect(screen.getByText(/^representante$/i)).toBeInTheDocument();
  });
});

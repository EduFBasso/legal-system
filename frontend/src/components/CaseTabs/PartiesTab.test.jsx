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
});

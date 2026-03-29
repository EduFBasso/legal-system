/**
 * Tests for PublicationCard
 *
 * Coverage:
 * - Delete button is hidden when publication is integrated (linked to a case)
 * - Delete button is shown for pending publications when action buttons are enabled
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicationCard from './PublicationCard';

const basePublication = {
  id_api: 999,
  id: 1,
  tribunal: 'TJSP',
  tipo_comunicacao: 'Intimação',
  numero_processo: '0000000-00.0000.0.00.0000',
  orgao: '1ª Vara',
  texto_resumo: 'Resumo',
  integration_status: 'PENDING',
  case_id: null,
};

describe('PublicationCard', () => {
  it('shows delete button for pending publications when action buttons are enabled', () => {
    render(
      <PublicationCard
        publication={{ ...basePublication, integration_status: 'PENDING', case_id: null }}
        onClick={vi.fn()}
        onMarkAsRead={vi.fn()}
        showActionButtons={true}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTitle('Apagar esta publicação')).toBeInTheDocument();
  });

  it('hides delete button for integrated publications', () => {
    render(
      <PublicationCard
        publication={{ ...basePublication, integration_status: 'INTEGRATED', case_id: 123 }}
        onClick={vi.fn()}
        onMarkAsRead={vi.fn()}
        showActionButtons={true}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Apagar esta publicação')).not.toBeInTheDocument();
  });

  it('hides delete button when publication has integrated movement', () => {
    render(
      <PublicationCard
        publication={{ ...basePublication, integration_status: 'PENDING', case_id: null, has_integrated_movement: true }}
        onClick={vi.fn()}
        onMarkAsRead={vi.fn()}
        showActionButtons={true}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Apagar esta publicação')).not.toBeInTheDocument();
  });
});

/**
 * Tests for InformacaoTab
 *
 * Coverage:
 * - Renders publication origin box when origin fields exist
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InformacaoTab from './InformacaoTab';

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('InformacaoTab', () => {
  it('renders publication origin box when origin fields are present', () => {
    renderWithRouter(
      <InformacaoTab
        id={123}
        isEditing={false}
        formData={{
          numero_processo: '0000000-00.0000.0.00.0000',
          tribunal: 'TJSP',
          publicacao_origem: 10,
          publicacao_origem_tipo: 'Intimação',
          publicacao_origem_data: '2026-03-10',
        }}
      />
    );

    expect(screen.getByText(/🔗\s*Origem:/i)).toBeInTheDocument();
    expect(screen.getByText(/Intimação/i)).toBeInTheDocument();
    expect(screen.getByText(/10\/03\/2026/)).toBeInTheDocument();
  });

  it('does not render publication origin box when origin id is missing', () => {
    renderWithRouter(
      <InformacaoTab
        id={123}
        isEditing={false}
        formData={{
          numero_processo: '0000000-00.0000.0.00.0000',
          tribunal: 'TJSP',
          publicacao_origem_tipo: 'Intimação',
          publicacao_origem_data: '2026-03-10',
        }}
      />
    );

    expect(screen.queryByText(/🔗\s*Origem:/i)).not.toBeInTheDocument();
  });

  it('renders represented name + representative + representation type badge in Partes e Financeiro', () => {
    renderWithRouter(
      <InformacaoTab
        id={123}
        isEditing={false}
        parties={[
          {
            id: 1,
            contact: 111,
            contact_name: 'Cliente Representado',
            is_client: true,
            role: 'CLIENTE',
          },
        ]}
        formData={{
          numero_processo: '0000000-00.0000.0.00.0000',
          tribunal: 'TJSP',
          representations: [
            {
              id: 10,
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
    expect(screen.getByText(/✓\s*CLIENTE/i)).toBeInTheDocument();
      expect(screen.getByText(/representado por/i)).toBeInTheDocument();
  });
});

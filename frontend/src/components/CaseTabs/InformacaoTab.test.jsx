/**
 * Tests for InformacaoTab
 *
 * Coverage:
 * - Renders publication origin box when origin fields exist
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import InformacaoTab from './InformacaoTab';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('InformacaoTab', () => {
  it('shows vínculo badge NEUTRO and does not render vínculos list when neutral', () => {
    renderWithRouter(
      <InformacaoTab
        id={123}
        isEditing={false}
        readOnly={false}
        formData={{
          numero_processo: '0000000-00.0000.0.00.0000',
          tribunal: 'TJSP',
          classificacao: 'NEUTRO',
          case_principal: null,
        }}
      />
    );

    expect(screen.getByText(/Vínculo/i)).toBeInTheDocument();
    expect(screen.getByText('NEUTRO')).toBeInTheDocument();
    expect(screen.queryByText(/VÍNCULOS/i)).not.toBeInTheDocument();

    // Ações no estado NEUTRO
    expect(screen.getByText(/Tornar principal/i)).toBeInTheDocument();
    expect(screen.getByText(/Vincular como derivado/i)).toBeInTheDocument();
    expect(screen.queryByText(/Vincular a principal/i)).not.toBeInTheDocument();
  });

  it('shows vínculos list when derived and displays vinculo tipo only for derived rows', () => {
    renderWithRouter(
      <InformacaoTab
        id={10}
        isEditing={false}
        formData={{
          numero_processo: '0000000-00.0000.0.00.0000',
          numero_processo_formatted: '0000000-00.0000.0.00.0000',
          tribunal: 'TJSP',
          titulo: 'Processo derivado atual',
          classificacao: 'NEUTRO',
          case_principal: 1,
          vinculo_tipo: 'APENSO',
          vinculo_tipo_display: 'Apenso',
          parties_summary: [{ name: 'Cliente A' }, { name: 'Parte B' }],
        }}
        linkedCases={[
          {
            id: 1,
            numero_processo_formatted: '1111111-11.1111.1.11.1111',
            titulo: 'Processo principal',
            classificacao: 'PRINCIPAL',
            parties_summary: [{ name: 'Cliente A' }],
          },
          {
            id: 11,
            case_principal: 1,
            numero_processo_formatted: '2222222-22.2222.2.22.2222',
            titulo: 'Outro derivado',
            vinculo_tipo_display: 'Recurso',
            parties_summary: [{ name: 'Cliente A' }, { name: 'Parte C' }],
          },
        ]}
      />
    );

    expect(screen.getByText(/PROCESSOS\s+VINCULADOS/i)).toBeInTheDocument();
    expect(screen.getByText('DERIVADO')).toBeInTheDocument();

    // Principal aparece na lista
    expect(screen.getByText('1111111-11.1111.1.11.1111')).toBeInTheDocument();

    // Tipo de vínculo aparece apenas nas linhas derivadas
    expect(screen.getByText(/Apenso/i)).toBeInTheDocument();
    expect(screen.getByText(/Recurso/i)).toBeInTheDocument();
  });

  it('allows editing and unlinking a derived linked process row', async () => {
    mockNavigate.mockClear();
    const onPatchCase = vi.fn().mockResolvedValue(true);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderWithRouter(
      <InformacaoTab
        id={10}
        isEditing={false}
        readOnly={false}
        onPatchCase={onPatchCase}
        formData={{
          numero_processo: '0000000-00.0000.0.00.0000',
          numero_processo_formatted: '0000000-00.0000.0.00.0000',
          tribunal: 'TJSP',
          titulo: 'Processo derivado atual',
          classificacao: 'NEUTRO',
          case_principal: 1,
          vinculo_tipo: 'APENSO',
          vinculo_tipo_display: 'Apenso',
        }}
        linkedCases={[
          {
            id: 1,
            numero_processo_formatted: '1111111-11.1111.1.11.1111',
            titulo: 'Processo principal',
            classificacao: 'PRINCIPAL',
          },
          {
            id: 11,
            case_principal: 1,
            numero_processo_formatted: '2222222-22.2222.2.22.2222',
            titulo: 'Outro derivado',
            vinculo_tipo: 'RECURSO',
            vinculo_tipo_display: 'Recurso',
          },
        ]}
      />
    );

    // Editar o processo derivado atual (id=10): deve navegar
    const editButtons = screen.getAllByLabelText(/Editar vínculo/i);
    await user.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('editDerivedCaseId=10')
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('principalCaseId=1')
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('vinculoTipo=APENSO')
    );

    // Desvincular o sibling (id=11): deve chamar onPatchCase
    const unlinkButtons = screen.getAllByLabelText(/Desvincular processo/i);
    await user.click(unlinkButtons[1]);

    expect(onPatchCase).toHaveBeenCalledWith({
      caseId: 11,
      patch: {
        case_principal: null,
        vinculo_tipo: '',
      },
    });

    confirmSpy.mockRestore();
  });

  it('shows inline add-derived action next to vínculo badge when case is principal', () => {
    renderWithRouter(
      <InformacaoTab
        id={55}
        isEditing={false}
        readOnly={false}
        formData={{
          numero_processo: '0000000-00.0000.0.00.0000',
          tribunal: 'TJSP',
          classificacao: 'PRINCIPAL',
          case_principal: null,
        }}
      />
    );

    expect(screen.getByText(/\+\s*Adicionar Processo Derivado/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tornar principal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vincular a principal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vincular como derivado/i)).not.toBeInTheDocument();
  });

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

/**
 * Read-only regression tests for Movimentações tab
 *
 * Coverage:
 * - Nova Movimentação disabled
 * - Consultar processo disabled
 * - Nova Tarefa disabled
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MovimentacoesTab from './MovimentacoesTab';
import MovimentacaoDisplay from './MovimentacaoDisplay';
import TasksInlineList from './TasksInlineList';

describe('Movimentações (read-only)', () => {
  it('disables "Nova Movimentação" when readOnly=true', () => {
    render(
      <MovimentacoesTab
        id={1}
        readOnly={true}
        movimentacoes={[]}
        tasks={[]}
        onRefreshTasks={vi.fn()}
        onRefreshMovements={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Nova Movimentação/i })).toBeDisabled();
  });

  it('disables "Consultar processo" when readOnly=true', () => {
    render(
      <MovimentacaoDisplay
        readOnly={true}
        mov={{
          id: 10,
          origem: 'DJE',
          tipo: 'DESPACHO',
          titulo: 'Mov',
          descricao: 'Desc',
          publication_data: {
            exists: true,
            numero_processo: '0000001-23.2026.8.26.0100',
            tribunal: 'TJSP',
            link_oficial: 'https://example.com',
            data_disponibilizacao: '2026-03-10',
            orgao: 'Órgão',
            meio_display: 'DJE',
          },
        }}
        tipoDisplay="Despacho"
        manualDescricao=""
        onEditClick={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Consultar processo/i })).toBeDisabled();
  });

  it('disables "Nova Tarefa" when readOnly=true', () => {
    render(
      <TasksInlineList
        readOnly={true}
        tasks={[]}
        movimentoId={10}
        addingTaskForMovement={null}
        editingTaskId={null}
        auxiliarHighlightedTaskId={null}
        newTaskForm={{ titulo: '', descricao: '', data_vencimento: '' }}
        editTaskForm={{ titulo: '', descricao: '', data_vencimento: '' }}
        savingTask={false}
        savingEditedTask={false}
        onOpenAddTask={vi.fn()}
        onCancelAddTask={vi.fn()}
        onSaveTask={vi.fn()}
        onOpenEditTask={vi.fn()}
        onCancelEditTask={vi.fn()}
        onSaveEditedTask={vi.fn()}
        onToggleTaskStatus={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Nova Tarefa/i })).toBeDisabled();
  });
});

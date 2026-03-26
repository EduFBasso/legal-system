import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SearchableCreatableSelectField from './SearchableCreatableSelectField';

function setup(props = {}) {
  const onChange = props.onChange || vi.fn();
  const onCreateOption = props.onCreateOption || vi.fn();
  const onEditOption = props.onEditOption || vi.fn();
  const onSearchOptions = props.onSearchOptions;

  render(
    <SearchableCreatableSelectField
      value={props.value ?? ''}
      onChange={onChange}
      options={props.options ?? []}
      allowCreate={props.allowCreate ?? true}
      allowCreateWhenExactMatchIsNotPersisted={props.allowCreateWhenExactMatchIsNotPersisted ?? false}
      onCreateOption={props.onCreateOption === undefined ? onCreateOption : props.onCreateOption}
      onEditOption={props.onEditOption === undefined ? onEditOption : props.onEditOption}
      onSearchOptions={onSearchOptions}
      remoteSearchDebounceMs={props.remoteSearchDebounceMs}
      remoteSearchMinChars={props.remoteSearchMinChars}
      placeholder={props.placeholder ?? 'Pesquisar ou digitar...'}
    />
  );

  return { onChange, onCreateOption, onEditOption };
}

describe('SearchableCreatableSelectField', () => {
  it('shows "Cadastrar" for exact match when not persisted (opt-in + dirty) and calls onCreateOption', async () => {
    const user = userEvent.setup();

    const onChange = vi.fn();
    const onCreateOption = vi.fn(async (label) => ({ id: 10, value: label, label, editable: true }));

    setup({
      onChange,
      onCreateOption,
      allowCreateWhenExactMatchIsNotPersisted: true,
      options: [
        // dynamic suggestion: exact label match but not persisted
        { value: 'Ação De Cobrança', label: 'Ação De Cobrança', editable: false },
      ],
    });

    const input = screen.getByPlaceholderText('Pesquisar ou digitar...');
    await user.click(input);
    await user.clear(input);
    await user.paste('Ação De Cobrança');

    const cadastrar = await screen.findByTitle('Salvar novo');
    expect(cadastrar).toBeInTheDocument();

    await user.click(cadastrar);

    expect(onCreateOption).toHaveBeenCalledTimes(1);
    expect(onCreateOption).toHaveBeenCalledWith('Ação De Cobrança');
    expect(onChange).toHaveBeenCalledWith('Ação De Cobrança');
  });

  it('does not show "Cadastrar" for exact match when opt-in is disabled', async () => {
    const user = userEvent.setup();

    setup({
      allowCreateWhenExactMatchIsNotPersisted: false,
      options: [{ value: 'Inventário', label: 'Inventário', editable: false }],
    });

    const input = screen.getByPlaceholderText('Pesquisar ou digitar...');
    await user.click(input);
    await user.clear(input);
    await user.paste('Inventário');

    expect(screen.queryByTitle('Salvar novo')).not.toBeInTheDocument();
  });

  it('renames a persisted editable option via pencil icon', async () => {
    const user = userEvent.setup();

    const onChange = vi.fn();
    const onEditOption = vi.fn(async (id, label) => ({ id, value: label, label, editable: true }));

    setup({
      value: 'Título Antigo',
      onChange,
      onEditOption,
      options: [{ id: 1, value: 'Título Antigo', label: 'Título Antigo', editable: true }],
    });

    const input = screen.getByPlaceholderText('Pesquisar ou digitar...');
    await user.click(input);

    const editBtn = await screen.findByTitle('Editar selecionado');
    await user.click(editBtn);

    // In edit mode the confirm button label is "Salvar" (same title "Salvar edição")
    await user.clear(input);
    await user.type(input, 'titulo novo');

    const saveBtn = await screen.findByTitle('Salvar edição');
    await user.click(saveBtn);

    expect(onEditOption).toHaveBeenCalledTimes(1);
    expect(onEditOption).toHaveBeenCalledWith(1, 'Titulo Novo');
    expect(onChange).toHaveBeenCalledWith('Titulo Novo');
  });

  it('supports remote search with debounce (onSearchOptions)', async () => {
    const user = userEvent.setup();

    const onSearchOptions = vi.fn(async (q) => {
      if (q.toLowerCase().includes('cob')) {
        return [{ id: 99, value: 'Ação de Cobrança', label: 'Ação de Cobrança', editable: true }];
      }
      return [];
    });

    setup({
      options: [],
      onSearchOptions,
      remoteSearchDebounceMs: 1,
      remoteSearchMinChars: 2,
    });

    const input = screen.getByPlaceholderText('Pesquisar ou digitar...');
    await user.click(input);
    await user.paste('cob');

    await waitFor(() => {
      expect(onSearchOptions).toHaveBeenCalledTimes(1);
    });
    expect(onSearchOptions).toHaveBeenCalledWith('cob');

    expect(await screen.findByText('Ação de Cobrança')).toBeInTheDocument();
  });
});

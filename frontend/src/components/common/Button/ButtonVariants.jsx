import Button from './Button';
import { Save, X, Trash2, Edit2 } from 'lucide-react';

/**
 * SaveButton - Botão padrão para salvar
 */
export function SaveButton({ children = '💾 Salvar', onClick, disabled = false, ...props }) {
  return (
    <Button
      variant="primary"
      size="md"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * CancelButton - Botão padrão para cancelar
 */
export function CancelButton({ children = 'Cancelar', onClick, disabled = false, ...props }) {
  return (
    <Button
      variant="secondary"
      size="md"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * DeleteButton - Botão padrão para deletar
 */
export function DeleteButton({ children = '🗑️ Apagar', onClick, disabled = false, ...props }) {
  return (
    <Button
      variant="danger"
      size="md"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * EditButton - Botão padrão para editar
 */
export function EditButton({ children = '✏️ Editar', onClick, disabled = false, ...props }) {
  return (
    <Button
      variant="edit"
      size="md"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}

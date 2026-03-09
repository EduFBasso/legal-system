import './Button.css';

/**
 * Button - Componente padrão reutilizável para botões
 * @param {string} variant - Tipo de botão: 'primary', 'secondary', 'danger', 'edit', 'success'
 * @param {string} size - Tamanho: 'sm', 'md' (padrão), 'lg'
 * @param {ReactNode} children - Conteúdo do botão
 * @param {boolean} disabled - Estado desabilitado
 * @param {function} onClick - Callback ao clique
 * @param {string} className - Classes adicionais
 * @param {object} ...props - Outros props do button
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClass = `btn btn-${variant} btn-${size}`;
  const finalClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <button
      type={type}
      className={finalClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

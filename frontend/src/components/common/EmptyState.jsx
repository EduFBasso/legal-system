/**
 * EmptyState - Componente reutilizável para estados vazios
 * Exibe ícone, mensagem principal e dica opcional
 * 
 * Uso:
 * <EmptyState 
 *   icon={Users}
 *   message="Nenhuma parte cadastrada"
 *   hint="Clique em 'Adicionar Parte' para vincular pessoas"
 *   action={<button>Ação</button>}
 * />
 *
 * Também aceita `icon` como string (ex.: "🔎") e `title/description`
 * como aliases de `message/hint`.
 */
import { isValidElement } from 'react';

function EmptyState({ 
  icon,
  iconSize = 48,
  message,
  hint,
  title,
  description,
  action,
  className = '',
  iconStyle = {}
}) {
  const resolvedMessage = message ?? title;
  const resolvedHint = hint ?? description;

  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      return (
        <span
          aria-hidden="true"
          style={{
            fontSize: iconSize,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...iconStyle,
          }}
        >
          {icon}
        </span>
      );
    }

    if (isValidElement(icon)) {
      return icon;
    }

    const IconComponent = icon;
    return <IconComponent size={iconSize} style={iconStyle} />;
  };

  return (
    <div className={`empty-state ${className}`}>
      {renderIcon()}
      {resolvedMessage && <p>{resolvedMessage}</p>}
      {resolvedHint && <p className="empty-state-hint">{resolvedHint}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;

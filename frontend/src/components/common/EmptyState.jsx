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
 */
function EmptyState({ 
  icon: Icon, 
  iconSize = 48,
  message, 
  hint,
  action,
  className = '',
  iconStyle = {}
}) {
  return (
    <div className={`empty-state ${className}`}>
      {Icon && <Icon size={iconSize} style={iconStyle} />}
      {message && <p>{message}</p>}
      {hint && <p className="empty-state-hint">{hint}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;

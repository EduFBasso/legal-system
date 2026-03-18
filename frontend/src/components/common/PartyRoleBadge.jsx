import './PartyRoleBadge.css';

const normalize = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const resolveRoleKey = ({ role = '', label = '' }) => {
  const roleText = normalize(role);
  const labelText = normalize(label);
  const text = `${roleText} ${labelText}`;

  if (text.includes('representado')) return 'representado';
  if (text.includes('cliente')) return 'cliente';
  if (text.includes('autor') || text.includes('requerente')) return 'autor';
  if (text.includes('reu') || text.includes('requerido')) return 'reu';
  if (text.includes('testemunha')) return 'testemunha';
  if (text.includes('perito')) return 'perito';
  if (text.includes('terceiro')) return 'terceiro';

  return 'terceiro';
};

export default function PartyRoleBadge({
  role,
  label,
  isClient = false,
  size = 'sm',
  showCheck = false,
  className = '',
}) {
  const roleKey = resolveRoleKey({ role, label });
  const isClientBadge = isClient || roleKey === 'cliente';
  const text = (label || role || (isClientBadge ? 'Cliente' : 'Parte')).toUpperCase();

  const classes = [
    'party-badge',
    size === 'md' ? 'party-badge--md' : 'party-badge--sm',
    isClientBadge ? 'party-badge--cliente' : `party-badge--${roleKey}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{showCheck && isClientBadge ? `✓ ${text}` : text}</span>;
}

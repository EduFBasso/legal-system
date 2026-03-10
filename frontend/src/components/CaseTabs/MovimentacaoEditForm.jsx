import { Check, X } from 'lucide-react';
import { MOVIMENTO_TIPOS } from '../../utils/movementUtils';

/**
 * MovimentacaoEditForm - Formulário inline para editar movimentação
 * 
 * Props:
 * - form: {data, tipo, tipo_customizado, titulo, descricao, prazo}
 * - onChange: (newForm) => void
 * - onSave: () => Promise
 * - onCancel: () => void
 * - saving: boolean
 */
export default function MovimentacaoEditForm({
  form = {},
  onChange = () => {},
  onSave = async () => {},
  onCancel = () => {},
  saving = false
}) {
  const handleChange = (field, value) => {
    onChange({ ...form, [field]: value });
  };

  const canSave = form.titulo && form.titulo.trim();

  return (
    <div style={{ 
      background: '#faf5ff',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '2px solid #6b21a8',
      marginBottom: '1rem'
    }}>
      <h4 style={{ marginBottom: '1rem', color: '#6b21a8', fontWeight: '600' }}>
        Editar Movimentação
      </h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Data */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: '#6b21a8', 
            fontWeight: '600', 
            fontSize: '0.875rem' 
          }}>
            Data *
          </label>
          <input
            type="date"
            value={form.data || ''}
            onChange={(e) => handleChange('data', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Tipo */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: '#6b21a8', 
            fontWeight: '600', 
            fontSize: '0.875rem' 
          }}>
            Tipo *
          </label>
          <select
            value={form.tipo || ''}
            onChange={(e) => handleChange('tipo', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              fontFamily: 'inherit'
            }}
          >
            <option value="">Selecione um tipo</option>
            {MOVIMENTO_TIPOS.map(tipo => (
              <option key={tipo} value={tipo}>
                {tipo === 'DESPACHO' ? 'Despacho'
                  : tipo === 'DECISAO' ? 'Decisão Interlocutória'
                  : tipo === 'SENTENCA' ? 'Sentença'
                  : tipo === 'ACORDAO' ? 'Acórdão'
                  : tipo === 'AUDIENCIA' ? 'Audiência'
                  : tipo === 'JUNTADA' ? 'Juntada de Documento'
                  : tipo === 'INTIMACAO' ? 'Intimação'
                  : tipo === 'CITACAO' ? 'Citação'
                  : tipo === 'CONCLUSAO' ? 'Conclusos'
                  : tipo === 'RECURSO' ? 'Recurso'
                  : tipo === 'PETICAO' ? 'Petição Protocolada'
                  : 'Outros'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tipo Customizado (se OUTROS) */}
      {form.tipo === 'OUTROS' && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: '#6b21a8', 
            fontWeight: '600', 
            fontSize: '0.875rem' 
          }}>
            Especifique o tipo *
          </label>
          <input
            type="text"
            value={form.tipo_customizado || ''}
            onChange={(e) => handleChange('tipo_customizado', e.target.value)}
            placeholder="Ex: Despacho do juiz"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              fontFamily: 'inherit'
            }}
          />
        </div>
      )}

      {/* Título */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: '#6b21a8', 
          fontWeight: '600', 
          fontSize: '0.875rem' 
        }}>
          Título/Resumo *
        </label>
        <input
          type="text"
          value={form.titulo || ''}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Ex: Audiência de conciliação"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Descrição */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: '#6b21a8', 
          fontWeight: '600', 
          fontSize: '0.875rem' 
        }}>
          Descrição Completa
        </label>
        <textarea
          value={form.descricao || ''}
          onChange={(e) => handleChange('descricao', e.target.value)}
          placeholder="Descreva os detalhes..."
          rows="3"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Prazo */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: '#6b21a8', 
          fontWeight: '600', 
          fontSize: '0.875rem' 
        }}>
          Prazo (em dias)
        </label>
        <input
          type="number"
          value={form.prazo || ''}
          onChange={(e) => handleChange('prazo', e.target.value)}
          min="0"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Botões Salvar / Cancelar */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onSave}
          disabled={!canSave || saving}
          style={{
            background: '#6b21a8',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: (saving || !canSave) ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '0.9375rem',
            opacity: (saving || !canSave) ? 0.6 : 1,
            transition: '0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => { 
            if (!saving && canSave) {
              e.target.style.background = '#581c87';
            }
          }}
          onMouseLeave={(e) => { 
            if (!saving && canSave) {
              e.target.style.background = '#6b21a8';
            }
          }}
        >
          <Check size={16} /> {saving ? 'Salvando...' : '✓ Salvar'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            background: '#e2e8f0',
            color: '#6b21a8',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '0.9375rem',
            transition: '0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => { 
            if (!saving) {
              e.target.style.background = '#cbd5e1';
            }
          }}
          onMouseLeave={(e) => { 
            if (!saving) {
              e.target.style.background = '#e2e8f0';
            }
          }}
        >
          <X size={16} /> ✕ Cancelar
        </button>
      </div>
    </div>
  );
}

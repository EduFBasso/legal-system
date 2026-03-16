import { Check, X } from 'lucide-react';
import { MOVIMENTO_TIPOS } from '../../utils/movementUtils';
import { caseTheme } from './caseTheme';
import './MovimentacaoEditForm.css';

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
      background: caseTheme.form.background,
      padding: '1rem',
      borderRadius: '8px',
      border: `1px solid ${caseTheme.form.border}`,
      boxShadow: `inset 0 0 0 1px ${caseTheme.darkBorder}`,
      marginBottom: '0.85rem'
    }}>
      <h4 style={{ marginBottom: '0.85rem', color: caseTheme.darkText, fontWeight: '600', fontSize: '1.1rem' }}>
        Editar Movimentação (inline)
      </h4>
      
      <div className="mov-form-row">
        {/* Data */}
        <div style={{ minWidth: 0 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: caseTheme.darkText, 
            fontWeight: '600', 
            fontSize: '1rem' 
          }}>
            Data *
          </label>
          <input
            type="date"
            value={form.data || ''}
            onChange={(e) => handleChange('data', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            style={{
              width: '1px',
              minWidth: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              padding: '0.75rem',
              border: `1px solid ${caseTheme.form.border}`,
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              background: caseTheme.form.input.background,
              color: caseTheme.form.input.text
            }}
          />
        </div>

        {/* Tipo */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: caseTheme.darkText, 
            fontWeight: '600', 
            fontSize: '1rem' 
          }}>
            Tipo *
          </label>
          <select
            value={form.tipo || ''}
            onChange={(e) => handleChange('tipo', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${caseTheme.form.border}`,
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              background: caseTheme.form.input.background,
              color: caseTheme.form.input.text
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
            color: caseTheme.darkText, 
            fontWeight: '600', 
            fontSize: '1rem' 
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
              border: `1px solid ${caseTheme.form.border}`,
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              background: caseTheme.form.input.background,
              color: caseTheme.form.input.text
            }}
          />
        </div>
      )}

      {/* Título */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: caseTheme.darkText, 
          fontWeight: '600', 
          fontSize: '1rem' 
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
            border: `1px solid ${caseTheme.form.border}`,
            borderRadius: '6px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            background: caseTheme.form.input.background,
            color: caseTheme.form.input.text
          }}
        />
      </div>

      {/* Descrição */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: caseTheme.darkText, 
          fontWeight: '600', 
          fontSize: '1rem' 
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
            border: `1px solid ${caseTheme.form.border}`,
            borderRadius: '6px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            background: caseTheme.form.input.background,
            color: caseTheme.form.input.text
          }}
        />
      </div>

      {/* Prazo */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: caseTheme.darkText, 
          fontWeight: '600', 
          fontSize: '1rem' 
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
            border: `1px solid ${caseTheme.form.border}`,
            borderRadius: '6px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            background: caseTheme.form.input.background,
            color: caseTheme.form.input.text
          }}
        />
      </div>

      {/* Botões Salvar / Cancelar */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onSave}
          disabled={!canSave || saving}
          style={{
            background: caseTheme.button.primary,
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
              e.target.style.background = caseTheme.button.primaryDark;
            }
          }}
          onMouseLeave={(e) => { 
            if (!saving && canSave) {
              e.target.style.background = caseTheme.button.primary;
            }
          }}
        >
          <Check size={16} /> {saving ? 'Salvando...' : '✓ Salvar'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            background: caseTheme.button.neutral,
            color: '#fff',
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
              e.target.style.background = caseTheme.button.neutralDark;
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 2px 8px rgba(71, 85, 105, 0.3)';
            }
          }}
          onMouseLeave={(e) => { 
            if (!saving) {
              e.target.style.background = caseTheme.button.neutral;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          <X size={16} /> ✕ Cancelar
        </button>
      </div>
    </div>
  );
}

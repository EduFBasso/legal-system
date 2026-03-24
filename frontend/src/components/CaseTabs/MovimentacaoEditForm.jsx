import { Check, X } from 'lucide-react';
import { MOVIMENTO_TIPOS } from '../../utils/movementUtils';
import { caseTheme } from './caseTheme';
import { Button } from '../common/Button';
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
        <Button variant="success" size="md" onClick={onSave} disabled={!canSave || saving}>
          <Check size={16} /> {saving ? 'Salvando...' : '✓ Salvar'}
        </Button>
        <Button variant="secondary" size="md" onClick={onCancel} disabled={saving}>
          <X size={16} /> ✕ Cancelar
        </Button>
      </div>
    </div>
  );
}

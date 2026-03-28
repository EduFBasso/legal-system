// src/components/SettingsModal.jsx
import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import './SettingsModal.css';
import systemSettingsService from '@/services/systemSettingsService.js';

const SETTINGS_KEYS = {
  enabled: 'STALE_PROCESS_MONITOR_ENABLED',
  time: 'STALE_PROCESS_MONITOR_TIME',
  days: 'STALE_PROCESS_DAYS_THRESHOLD',
};

function normalizeTimeValue(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : '';
}

export default function SettingsModal({ isOpen, onClose }) {
  const defaults = useMemo(() => systemSettingsService.getDefaultSettings(), []);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [draftEnabled, setDraftEnabled] = useState(Boolean(defaults[SETTINGS_KEYS.enabled]));
  const [draftTime, setDraftTime] = useState(normalizeTimeValue(defaults[SETTINGS_KEYS.time]) || '09:00');
  const [draftDays, setDraftDays] = useState(String(defaults[SETTINGS_KEYS.days] ?? 90));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    (async () => {
      setErrorMessage('');
      setIsLoading(true);
      try {
        const settings = await systemSettingsService.getAllSettings();
        if (cancelled) return;

        setDraftEnabled(Boolean(settings?.[SETTINGS_KEYS.enabled] ?? defaults[SETTINGS_KEYS.enabled]));
        setDraftTime(
          normalizeTimeValue(settings?.[SETTINGS_KEYS.time])
          || normalizeTimeValue(defaults[SETTINGS_KEYS.time])
          || '09:00'
        );
        const nextDays = settings?.[SETTINGS_KEYS.days] ?? defaults[SETTINGS_KEYS.days] ?? 90;
        setDraftDays(String(nextDays));
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error?.message || 'Erro ao carregar configurações.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, defaults]);

  async function handleSave() {
    setErrorMessage('');

    const parsedDays = parseInt(String(draftDays || '').trim(), 10);
    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      setErrorMessage('Dias sem movimentação deve ser um inteiro maior que 0.');
      return;
    }

    const timeValue = normalizeTimeValue(draftTime);
    if (!timeValue) {
      setErrorMessage('Hora marcada inválida. Use HH:MM (ex.: 09:00).');
      return;
    }

    setIsSaving(true);
    try {
      await systemSettingsService.updateSettings({
        [SETTINGS_KEYS.enabled]: Boolean(draftEnabled),
        [SETTINGS_KEYS.time]: timeValue,
        [SETTINGS_KEYS.days]: parsedDays,
      });
      onClose();
    } catch (error) {
      setErrorMessage(error?.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Configurações" size="medium">
      <div className="settings-content">
        <div className="settings-section">
          <h3 className="settings-section-title">Monitoramento (90+ dias)</h3>

          {errorMessage ? (
            <div className="setting-item" role="alert" aria-live="polite">
              <div className="setting-info full-width">
                <span className="setting-label">Erro</span>
                <p className="setting-description">{errorMessage}</p>
              </div>
            </div>
          ) : null}

          <div className="setting-item" aria-busy={isLoading ? 'true' : 'false'}>
            <div className="setting-info">
              <label className="setting-label" htmlFor="stale-monitor-enabled">Habilitar monitoramento</label>
              <p className="setting-description">Gera notificações para processos com 90+ dias sem movimentação.</p>
            </div>
            <button
              id="stale-monitor-enabled"
              type="button"
              className={`toggle-button ${draftEnabled ? 'active' : ''}`}
              onClick={() => setDraftEnabled((v) => !v)}
              disabled={isLoading || isSaving}
              aria-pressed={draftEnabled}
              aria-label="Habilitar monitoramento"
            >
              <span className="toggle-slider" />
            </button>
          </div>

          <div className="setting-item" aria-busy={isLoading ? 'true' : 'false'}>
            <div className="setting-info">
              <label className="setting-label" htmlFor="stale-monitor-time">Hora marcada</label>
              <p className="setting-description">Horário do dia para executar a verificação automaticamente.</p>
            </div>
            <div className="setting-info" style={{ maxWidth: 180 }}>
              <input
                id="stale-monitor-time"
                type="time"
                className="setting-password-input"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value)}
                disabled={isLoading || isSaving}
              />
            </div>
          </div>

          <div className="setting-item" aria-busy={isLoading ? 'true' : 'false'}>
            <div className="setting-info">
              <label className="setting-label" htmlFor="stale-monitor-days">Dias sem movimentação</label>
              <p className="setting-description">Quantidade de dias sem movimentação para gerar o alerta.</p>
            </div>
            <div className="setting-input-group">
              <input
                id="stale-monitor-days"
                type="number"
                min="1"
                step="1"
                className="setting-number-input"
                value={draftDays}
                onChange={(e) => setDraftDays(e.target.value)}
                disabled={isLoading || isSaving}
              />
              <span className="setting-input-suffix">dias</span>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={handleSave}
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

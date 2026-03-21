// src/components/SettingsModal.jsx
import { useState } from 'react';
import Modal from './Modal';
import { useSettings } from '../contexts/SettingsContext';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose }) {
  const { settings, updateSettings } = useSettings();
  const [draftSettings, setDraftSettings] = useState(null);
  const localSettings = draftSettings ?? settings;

  const handleSave = async () => {
    await updateSettings(localSettings);
    setDraftSettings(null);
    onClose();
  };

  const handleCancel = () => {
    setDraftSettings(null); // Reverte mudanças
    onClose();
  };

  const handleToggle = (key) => {
    setDraftSettings((prev) => ({
      ...prev,
      ...(prev ?? settings),
      [key]: !(prev ?? settings)[key],
    }));
  };

  const handlePasswordChange = (e) => {
    setDraftSettings((prev) => ({
      ...prev,
      ...(prev ?? settings),
      deletePassword: e.target.value,
    }));
  };

  const handleRetroactiveDaysChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setDraftSettings((prev) => ({
      ...prev,
      ...(prev ?? settings),
      retroactiveDays: Math.max(0, Math.min(30, value)), // Entre 0 e 30 dias
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="⚙️ Configurações" size="medium">
      <div className="settings-content">
        {/* Visualização */}
        <section className="settings-section">
          <h3 className="settings-section-title">👁️ Visualização</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <label className="setting-label">Exibir campos vazios</label>
              <p className="setting-description">
                Mostra "Não informado" em campos sem dados no modal de detalhes. 
                Útil para lembrar quais informações faltam cadastrar.
              </p>
            </div>
            <button
              className={`toggle-button ${localSettings.showEmptyFields ? 'active' : ''}`}
              onClick={() => handleToggle('showEmptyFields')}
              aria-label="Alternar exibição de campos vazios"
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
        </section>

        {/* Segurança */}
        <section className="settings-section">
          <h3 className="settings-section-title">🔐 Segurança</h3>
          
          <div className="setting-item">
            <div className="setting-info full-width">
              <label className="setting-label">Senha para exclusão de contatos</label>
              <p className="setting-description">
                Define uma senha que será solicitada ao excluir contatos. 
                Deixe em branco para permitir exclusão sem confirmação de senha.
              </p>
              <input
                type="password"
                className="setting-password-input"
                value={localSettings.deletePassword || ''}
                onChange={handlePasswordChange}
                placeholder="Digite uma senha (opcional)"
              />
            </div>
          </div>
        </section>

        {/* Notificações */}
        <section className="settings-section">
          <h3 className="settings-section-title">🔔 Notificações</h3>
          
          <div className="setting-item">
            <div className="setting-info full-width">
              <label className="setting-label">Dias retroativos para notificações</label>
              <p className="setting-description">
                Ao buscar publicações, apenas as dos últimos <strong>{localSettings.retroactiveDays || 7} dias </strong> 
                geram notificações. Publicações mais antigas aparecem apenas na lista, sem notificação.
              </p>
              <div className="setting-input-group">
                <input
                  type="number"
                  className="setting-number-input"
                  value={localSettings.retroactiveDays || 7}
                  onChange={handleRetroactiveDaysChange}
                  min="0"
                  max="30"
                  placeholder="7"
                />
                <span className="setting-input-suffix">dias</span>
              </div>
              <p className="setting-hint">
                💡 Dica: Use 0 para nunca criar notificações automáticas, 
                ou até 30 dias para histórico mais amplo.
              </p>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label className="setting-label">Exibir botões de teste</label>
              <p className="setting-description">
                Mostra os botões "Criar Teste" e "Teste 90+ dias" na página de Notificações.
                Recomendado manter desativado em uso normal.
              </p>
            </div>
            <button
              className={`toggle-button ${localSettings.showNotificationTestButtons ? 'active' : ''}`}
              onClick={() => handleToggle('showNotificationTestButtons')}
              aria-label="Alternar botões de teste em notificações"
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
        </section>

        {/* Botões de ação */}
        <div className="settings-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave}>
            💾 Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { useState, useRef, useEffect } from 'react';
import './PublicationsSearchForm.css';

const STORAGE_KEY_TRIBUNAIS = 'tribunaisSelecionados';

export default function PublicationsSearchForm({ onSearch, isLoading }) {
  const today = new Date().toISOString().split('T')[0];
  
  const [dataInicio, setDataInicio] = useState(today);
  const [dataFim, setDataFim] = useState(today);
  const dataInicioRef = useRef(null);
  const dataFimRef = useRef(null);
  
  // Carregar tribunais do localStorage ou usar padrão
  const [tribunais, setTribunais] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRIBUNAIS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar tribunais salvos:', error);
    }
    // Padrão: todos selecionados
    return {
      TJSP: true,
      TJMG: true,
      TRF3: true,
      TRT2: true,
      TRT15: true,
    };
  });

  // Salvar tribunais no localStorage quando mudam
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRIBUNAIS, JSON.stringify(tribunais));
    } catch (error) {
      console.error('Erro ao salvar tribunais:', error);
    }
  }, [tribunais]);

  const handleTribunalChange = (tribunal) => {
    setTribunais(prev => ({
      ...prev,
      [tribunal]: !prev[tribunal]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validações
    if (!dataInicio || !dataFim) {
      alert('Por favor, selecione as datas de início e fim');
      return;
    }

    const tribunaisSelecionados = Object.keys(tribunais).filter(t => tribunais[t]);
    if (tribunaisSelecionados.length === 0) {
      alert('Selecione pelo menos um tribunal');
      return;
    }

    // Chamar callback com parâmetros
    onSearch({
      dataInicio,
      dataFim,
      tribunais: tribunaisSelecionados
    });
  };

  const handleSelectAll = () => {
    setTribunais({
      TJSP: true,
      TJMG: true,
      TRF3: true,
      TRT2: true,
      TRT15: true,
    });
  };

  const handleDeselectAll = () => {
    setTribunais({
      TJSP: false,
      TJMG: false,
      TRF3: false,
      TRT2: false,
      TRT15: false,
    });
  };

  const tribunaisInfo = {
    TJSP: 'Tribunal de Justiça de São Paulo',
    TJMG: 'Tribunal de Justiça de Minas Gerais',
    TRF3: 'Tribunal Regional Federal 3ª Região',
    TRT2: 'Tribunal Regional do Trabalho 2ª Região (SP)',
    TRT15: 'Tribunal Regional do Trabalho 15ª Região (Campinas)',
  };

  const handleDateIconClick = (ref) => {
    if (ref.current && !isLoading) {
      ref.current.showPicker();
    }
  };

  return (
    <form className="publications-search-form" onSubmit={handleSubmit}>
      <div className="search-section">
        <h3 className="section-title">📅 Período</h3>
        <div className="date-inputs">
          <div className="form-group">
            <label htmlFor="dataInicio">Data Início</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="dataInicio"
                ref={dataInicioRef}
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                max={dataFim || undefined}
                className="date-input"
                disabled={isLoading}
              />
              <span 
                className="date-icon" 
                onClick={() => handleDateIconClick(dataInicioRef)}
                title="Clique para abrir o calendário"
              >
                📆
              </span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dataFim">Data Fim</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="dataFim"
                ref={dataFimRef}
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                min={dataInicio || undefined}
                className="date-input"
                disabled={isLoading}
              />
              <span 
                className="date-icon" 
                onClick={() => handleDateIconClick(dataFimRef)}
                title="Clique para abrir o calendário"
              >
                📆
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="section-header">
          <h3 className="section-title">🏛️ Tribunais</h3>
          <div className="selection-actions">
            <button
              type="button"
              onClick={handleSelectAll}
              className="btn-action"
              disabled={isLoading}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="btn-action"
              disabled={isLoading}
            >
              Nenhum
            </button>
          </div>
        </div>

        <div className="tribunais-list">
          {Object.keys(tribunaisInfo).map((sigla) => (
            <label key={sigla} className="tribunal-checkbox">
              <input
                type="checkbox"
                checked={tribunais[sigla]}
                onChange={() => handleTribunalChange(sigla)}
                disabled={isLoading}
              />
              <div className="tribunal-info">
                <span className="tribunal-sigla">{sigla}</span>
                <span className="tribunal-nome">{tribunaisInfo[sigla]}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="btn-search"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner-small"></span>
            Buscando...
          </>
        ) : (
          <>
            🔍 Buscar Publicações
          </>
        )}
      </button>
    </form>
  );
}

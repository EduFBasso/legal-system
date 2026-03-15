// src/pages/MasterDashboardPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PROTÓTIPO VISUAL — dados completamente fictícios.
// Fase 1: Layout e UX aprovados → Fase 2: integração com API real.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MasterDashboardPage.css';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_LAWYERS = [
  { id: 1, name: 'Dra. Beatriz Almeida', oab: '234.567', initials: 'BA' },
  { id: 2, name: 'Dr. Carlos Mendes',    oab: '189.234', initials: 'CM' },
  { id: 3, name: 'Dra. Fernanda Costa',  oab: '301.456', initials: 'FC' },
];

const MOCK_KPI = {
  all: { ativos: 73, pendentes: 35, urgentes: 10, vencidas: 7 },
  1:   { ativos: 24, pendentes: 12, urgentes: 3,  vencidas: 2 },
  2:   { ativos: 18, pendentes: 8,  urgentes: 1,  vencidas: 5 },
  3:   { ativos: 31, pendentes: 15, urgentes: 6,  vencidas: 0 },
};

const MOCK_WORKLOAD = [
  { lawyerId: 1, name: 'Dra. Beatriz Almeida', initials: 'BA', ativos: 24, pendentes: 12, urgentes: 3, vencidas: 2, novasEsSemana: 2, mediaAcoes: 4.1 },
  { lawyerId: 2, name: 'Dr. Carlos Mendes',    initials: 'CM', ativos: 18, pendentes: 8,  urgentes: 1, vencidas: 5, novasEsSemana: 0, mediaAcoes: 3.8 },
  { lawyerId: 3, name: 'Dra. Fernanda Costa',  initials: 'FC', ativos: 31, pendentes: 15, urgentes: 6, vencidas: 0, novasEsSemana: 4, mediaAcoes: 5.2 },
];

const MOCK_CASES = [
  { id: 1, lawyerId: 1, lawyer: 'Beatriz A.', numero: '0001234-56.2023.8.26.0100', tribunal: 'TJSP', vara: '3ª Vara Cível',     assunto: 'Cobrança',        status: 'Em andamento', pendentes: 3, urgentes: 0 },
  { id: 2, lawyerId: 1, lawyer: 'Beatriz A.', numero: '0009876-12.2024.8.26.0200', tribunal: 'TJSP', vara: '1ª Vara Família',   assunto: 'Divórcio',        status: 'Aguardando',    pendentes: 1, urgentes: 1 },
  { id: 3, lawyerId: 1, lawyer: 'Beatriz A.', numero: '0005555-33.2022.8.26.0050', tribunal: 'TJSP', vara: '2ª Vara Criminal',  assunto: 'Crime',           status: 'Em andamento', pendentes: 0, urgentes: 0 },
  { id: 4, lawyerId: 2, lawyer: 'Carlos M.',  numero: '0002222-11.2023.8.26.0300', tribunal: 'TRT-2','vara': '7ª Vara Trabalho', assunto: 'Trabalhista',    status: 'Em andamento', pendentes: 4, urgentes: 0 },
  { id: 5, lawyerId: 2, lawyer: 'Carlos M.',  numero: '0007777-44.2024.8.26.0400', tribunal: 'TJSP', vara: '5ª Vara Cível',     assunto: 'Indenização',     status: 'Aguardando',    pendentes: 2, urgentes: 0 },
  { id: 6, lawyerId: 3, lawyer: 'Fernanda C.',numero: '0003333-22.2023.8.26.0500', tribunal: 'TJSP', vara: '4ª Vara Família',   assunto: 'Guarda',          status: 'Em andamento', pendentes: 5, urgentes: 2 },
  { id: 7, lawyerId: 3, lawyer: 'Fernanda C.',numero: '0008888-55.2024.8.26.0600', tribunal: 'STJ',  vara: '1ª Turma',          assunto: 'Recurso Especial',status: 'Aguardando',    pendentes: 1, urgentes: 1 },
  { id: 8, lawyerId: 3, lawyer: 'Fernanda C.',numero: '0004444-88.2022.8.26.0700', tribunal: 'TJSP', vara: '6ª Vara Cível',     assunto: 'Contrato',        status: 'Encerrado',     pendentes: 0, urgentes: 0 },
];

const MOCK_FINANCIALS = [
  { lawyerId: 1, name: 'Dra. Beatriz Almeida', hoje:  1200, semana:  4800, mes: 18500, ticket: 2300, inadimplencia:  3200 },
  { lawyerId: 2, name: 'Dr. Carlos Mendes',    hoje:     0, semana:  3200, mes: 12750, ticket: 1800, inadimplencia:  5400 },
  { lawyerId: 3, name: 'Dra. Fernanda Costa',  hoje:  2800, semana:  7600, mes: 24300, ticket: 3100, inadimplencia:     0 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABS = { CARGA: 'CARGA', OPERACOES: 'OPERACOES', FINANCEIRO: 'FINANCEIRO' };

const fmt = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

const STATUS_COLORS = {
  'Em andamento': 'mdash-status--ativa',
  'Aguardando':   'mdash-status--aguardando',
  'Encerrado':    'mdash-status--encerrado',
};

// ── Componentes internos ──────────────────────────────────────────────────────

function KpiCard({ icon, label, value, variant }) {
  return (
    <div className={`mdash-kpi-card mdash-kpi-card--${variant}`}>
      <span className="mdash-kpi-icon">{icon}</span>
      <span className="mdash-kpi-value">{value}</span>
      <span className="mdash-kpi-label">{label}</span>
    </div>
  );
}

function WorkloadSection({ selectedLawyer }) {
  const rows = selectedLawyer === 'all'
    ? MOCK_WORKLOAD
    : MOCK_WORKLOAD.filter((r) => String(r.lawyerId) === selectedLawyer);

  return (
    <div className="mdash-section">
      <div className="mdash-section-header">
        <h2 className="mdash-section-title">Carga de Trabalho</h2>
        <span className="mdash-proto-tag">dados fictícios</span>
      </div>
      <div className="mdash-workload-grid">
        {rows.map((row) => (
          <div key={row.lawyerId} className="mdash-workload-card">
            <div className="mdash-workload-card-top">
              <span className="mdash-avatar">{row.initials}</span>
              <div>
                <p className="mdash-workload-name">{row.name}</p>
                <p className="mdash-workload-sub">{row.ativos} processos ativos</p>
              </div>
            </div>
            <div className="mdash-workload-stats">
              <div className="mdash-wstat">
                <span className="mdash-wstat-num mdash-wstat-num--neutral">{row.pendentes}</span>
                <span className="mdash-wstat-label">Pendentes</span>
              </div>
              <div className="mdash-wstat">
                <span className={`mdash-wstat-num ${row.urgentes > 0 ? 'mdash-wstat-num--urgent' : 'mdash-wstat-num--zero'}`}>{row.urgentes}</span>
                <span className="mdash-wstat-label">Urgentes</span>
              </div>
              <div className="mdash-wstat">
                <span className={`mdash-wstat-num ${row.vencidas > 0 ? 'mdash-wstat-num--danger' : 'mdash-wstat-num--zero'}`}>{row.vencidas}</span>
                <span className="mdash-wstat-label">Vencidas</span>
              </div>
              <div className="mdash-wstat">
                <span className="mdash-wstat-num mdash-wstat-num--new">{row.novasEsSemana}</span>
                <span className="mdash-wstat-label">Novas / sem.</span>
              </div>
            </div>
            <div className="mdash-workload-footer">
              <span>Média de ações por processo: <strong>{row.mediaAcoes}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OperacoesSection({ selectedLawyer, activeStatus, includeEncerrados }) {
  const [sortField, setSortField] = useState('numero');
  const [sortDir, setSortDir] = useState('asc');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  let rows = selectedLawyer === 'all'
    ? [...MOCK_CASES]
    : MOCK_CASES.filter((c) => String(c.lawyerId) === selectedLawyer);

  if (!includeEncerrados) {
    rows = rows.filter((c) => c.status !== 'Encerrado');
  }

  if (activeStatus !== 'all') {
    rows = rows.filter((c) => c.status === activeStatus);
  }

  rows = [...rows].sort((a, b) => {
    const valA = a[sortField] ?? '';
    const valB = b[sortField] ?? '';
    const cmp = String(valA).localeCompare(String(valB), 'pt-BR');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="mdash-section">
      <div className="mdash-section-header">
        <h2 className="mdash-section-title">Operações Diárias</h2>
        <span className="mdash-proto-tag">dados fictícios</span>
      </div>
      {rows.length === 0 ? (
        <p className="mdash-empty">Nenhum processo encontrado com os filtros selecionados.</p>
      ) : (
        <div className="mdash-table-wrapper">
          <table className="mdash-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('numero')}  className="mdash-th-sortable">Processo{sortIcon('numero')}</th>
                <th onClick={() => toggleSort('tribunal')} className="mdash-th-sortable">Tribunal{sortIcon('tribunal')}</th>
                <th onClick={() => toggleSort('assunto')}  className="mdash-th-sortable">Assunto{sortIcon('assunto')}</th>
                <th onClick={() => toggleSort('lawyer')}   className="mdash-th-sortable">Advogado(a){sortIcon('lawyer')}</th>
                <th onClick={() => toggleSort('status')}   className="mdash-th-sortable">Status{sortIcon('status')}</th>
                <th>Tarefas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((caso) => (
                <tr key={caso.id} className="mdash-tr">
                  <td className="mdash-td mdash-td--mono">
                    <span className="mdash-case-num" title={caso.vara}>{caso.numero}</span>
                    <span className="mdash-case-vara">{caso.vara}</span>
                  </td>
                  <td className="mdash-td">
                    <span className="mdash-tribunal-badge">{caso.tribunal}</span>
                  </td>
                  <td className="mdash-td">{caso.assunto}</td>
                  <td className="mdash-td">{caso.lawyer}</td>
                  <td className="mdash-td">
                    <span className={`mdash-status ${STATUS_COLORS[caso.status] || ''}`}>{caso.status}</span>
                  </td>
                  <td className="mdash-td">
                    <div className="mdash-task-badges">
                      {caso.urgentes > 0 && (
                        <span className="mdash-task-badge mdash-task-badge--urgent">{caso.urgentes} urg.</span>
                      )}
                      {caso.pendentes > 0 && (
                        <span className="mdash-task-badge mdash-task-badge--pending">{caso.pendentes} pend.</span>
                      )}
                      {caso.pendentes === 0 && caso.urgentes === 0 && (
                        <span className="mdash-task-badge mdash-task-badge--ok">OK</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mdash-table-count">{rows.length} processo(s) exibido(s)</p>
    </div>
  );
}

function FinanceiroSection({ selectedLawyer }) {
  const rows = selectedLawyer === 'all'
    ? MOCK_FINANCIALS
    : MOCK_FINANCIALS.filter((r) => String(r.lawyerId) === selectedLawyer);

  const totals = rows.reduce(
    (acc, r) => ({
      hoje:         acc.hoje         + r.hoje,
      semana:       acc.semana       + r.semana,
      mes:          acc.mes          + r.mes,
      inadimplencia:acc.inadimplencia+ r.inadimplencia,
    }),
    { hoje: 0, semana: 0, mes: 0, inadimplencia: 0 }
  );

  return (
    <div className="mdash-section">
      <div className="mdash-section-header">
        <h2 className="mdash-section-title">Resumo Financeiro</h2>
        <span className="mdash-proto-tag">dados fictícios</span>
      </div>

      {/* Totalizadores */}
      <div className="mdash-fin-summary">
        <div className="mdash-fin-total-card">
          <span className="mdash-fin-total-label">Recebido Hoje</span>
          <span className="mdash-fin-total-value">{fmt(totals.hoje)}</span>
        </div>
        <div className="mdash-fin-total-card">
          <span className="mdash-fin-total-label">Esta Semana</span>
          <span className="mdash-fin-total-value">{fmt(totals.semana)}</span>
        </div>
        <div className="mdash-fin-total-card mdash-fin-total-card--highlight">
          <span className="mdash-fin-total-label">Este Mês</span>
          <span className="mdash-fin-total-value">{fmt(totals.mes)}</span>
        </div>
        <div className="mdash-fin-total-card mdash-fin-total-card--danger">
          <span className="mdash-fin-total-label">Inadimplência</span>
          <span className="mdash-fin-total-value">{fmt(totals.inadimplencia)}</span>
        </div>
      </div>

      {/* Tabela por advogado */}
      <div className="mdash-table-wrapper">
        <table className="mdash-table">
          <thead>
            <tr>
              <th>Advogado(a)</th>
              <th>Recebido Hoje</th>
              <th>Esta Semana</th>
              <th>Este Mês</th>
              <th>Ticket Médio</th>
              <th>Inadimplência</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lawyerId} className="mdash-tr">
                <td className="mdash-td mdash-td--name">{row.name}</td>
                <td className="mdash-td">{fmt(row.hoje)}</td>
                <td className="mdash-td">{fmt(row.semana)}</td>
                <td className="mdash-td mdash-td--bold">{fmt(row.mes)}</td>
                <td className="mdash-td">{fmt(row.ticket)}</td>
                <td className={`mdash-td ${row.inadimplencia > 0 ? 'mdash-td--danger' : 'mdash-td--ok'}`}>
                  {fmt(row.inadimplencia)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function MasterDashboardPage() {
  const { user } = useAuth();

  const [selectedLawyer, setSelectedLawyer] = useState('all');
  const [activePeriod, setActivePeriod]     = useState('mes');
  const [activeStatus, setActiveStatus]     = useState('all');
  const [includeEncerrados, setIncludeEncerrados] = useState(false);
  const [activeTab, setActiveTab]           = useState(TABS.CARGA);

  if (!user || user.role !== 'MASTER') {
    return (
      <div className="mdash-access-denied">
        <span>🔒</span>
        <p>Acesso restrito ao usuário Master.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  const kpi = MOCK_KPI[selectedLawyer] || MOCK_KPI.all;

  return (
    <div className="mdash-page">

      {/* Banner de protótipo */}
      <div className="mdash-proto-banner">
        ⚠️ <strong>Protótipo visual</strong> — todos os números são fictícios. Integração com dados reais na próxima fase.
      </div>

      {/* Cabeçalho da página */}
      <div className="mdash-page-header">
        <div className="mdash-page-title-group">
          <span className="mdash-page-icon">🔑</span>
          <div>
            <h1 className="mdash-page-title">Painel Administrativo</h1>
            <p className="mdash-page-subtitle">Visão consolidada da equipe · Escritório</p>
          </div>
        </div>
        <Link to="/master" className="mdash-btn-secondary">
          ⚙️ Gestão de Equipe
        </Link>
      </div>

      {/* Barra de filtros */}
      <div className="mdash-filter-bar">
        <div className="mdash-filter-group">
          <label className="mdash-filter-label" htmlFor="filter-lawyer">Advogado(a)</label>
          <select
            id="filter-lawyer"
            className="mdash-filter-select"
            value={selectedLawyer}
            onChange={(e) => setSelectedLawyer(e.target.value)}
          >
            <option value="all">Toda a equipe</option>
            {MOCK_LAWYERS.map((l) => (
              <option key={l.id} value={String(l.id)}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="mdash-filter-group">
          <label className="mdash-filter-label" htmlFor="filter-period">Período</label>
          <select
            id="filter-period"
            className="mdash-filter-select"
            value={activePeriod}
            onChange={(e) => setActivePeriod(e.target.value)}
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mês</option>
            <option value="trimestre">Último trimestre</option>
            <option value="ano">Este ano</option>
          </select>
        </div>

        <div className="mdash-filter-group">
          <label className="mdash-filter-label" htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            className="mdash-filter-select"
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando">Aguardando</option>
            <option value="Encerrado">Encerrado</option>
          </select>
        </div>

        <label className="mdash-filter-check">
          <input
            type="checkbox"
            checked={includeEncerrados}
            onChange={(e) => setIncludeEncerrados(e.target.checked)}
          />
          Incluir encerrados
        </label>

        <button
          type="button"
          className="mdash-btn-reset"
          onClick={() => {
            setSelectedLawyer('all');
            setActivePeriod('mes');
            setActiveStatus('all');
            setIncludeEncerrados(false);
          }}
        >
          Limpar filtros
        </button>
      </div>

      {/* KPI Row */}
      <div className="mdash-kpi-row">
        <KpiCard icon="⚖️"  label="Processos Ativos" value={kpi.ativos}    variant="primary" />
        <KpiCard icon="📋"  label="Tarefas Pendentes" value={kpi.pendentes} variant="neutral" />
        <KpiCard icon="🔥"  label="Urgentes"           value={kpi.urgentes}  variant="warning" />
        <KpiCard icon="❌"  label="Vencidas"            value={kpi.vencidas}  variant="danger"  />
      </div>

      {/* Tabs de seção */}
      <div className="mdash-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === TABS.CARGA}
          className={`mdash-tab ${activeTab === TABS.CARGA ? 'mdash-tab--active' : ''}`}
          onClick={() => setActiveTab(TABS.CARGA)}
        >
          👥 Carga de Trabalho
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === TABS.OPERACOES}
          className={`mdash-tab ${activeTab === TABS.OPERACOES ? 'mdash-tab--active' : ''}`}
          onClick={() => setActiveTab(TABS.OPERACOES)}
        >
          📂 Operações Diárias
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === TABS.FINANCEIRO}
          className={`mdash-tab ${activeTab === TABS.FINANCEIRO ? 'mdash-tab--active' : ''}`}
          onClick={() => setActiveTab(TABS.FINANCEIRO)}
        >
          💰 Financeiro
        </button>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === TABS.CARGA && (
        <WorkloadSection selectedLawyer={selectedLawyer} />
      )}
      {activeTab === TABS.OPERACOES && (
        <OperacoesSection
          selectedLawyer={selectedLawyer}
          activeStatus={activeStatus}
          includeEncerrados={includeEncerrados}
        />
      )}
      {activeTab === TABS.FINANCEIRO && (
        <FinanceiroSection selectedLawyer={selectedLawyer} />
      )}
    </div>
  );
}

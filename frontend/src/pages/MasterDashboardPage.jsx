import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ContactCard from '../components/ContactCard';
import contactsAPI from '../services/api';
import './MasterDashboardPage.css';

const LAWYER_OPTIONS = [
  { id: 'all', label: 'Toda a equipe' },
  { id: '1', label: 'Dra. Beatriz Almeida' },
  { id: '2', label: 'Dr. Carlos Mendes' },
  { id: '3', label: 'Dra. Fernanda Costa' },
];

const SUMMARY_TOTALS = {
  all: { contatos: 248, processos: 96, tarefas: 134, financeiro: 84250 },
  1: { contatos: 82, processos: 31, tarefas: 46, financeiro: 29100 },
  2: { contatos: 69, processos: 24, tarefas: 39, financeiro: 21650 },
  3: { contatos: 97, processos: 41, tarefas: 49, financeiro: 33500 },
};

function getTodayIsoDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function MasterDashboardPage() {
  const { user } = useAuth();

  const today = getTodayIsoDate();
  const [selectedLawyer, setSelectedLawyer] = useState('all');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activeKpi, setActiveKpi] = useState('contatos');
  const [contactsSearch, setContactsSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const totals = SUMMARY_TOTALS[selectedLawyer] || SUMMARY_TOTALS.all;

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        setContactsLoading(true);
        setContactsError('');
        const params = {
          data_inicio: startDate,
          data_fim: endDate,
        };
        if (contactsSearch.trim()) {
          params.search = contactsSearch.trim();
        }
        if (selectedLawyer !== 'all') {
          params.team_member_id = selectedLawyer;
        }
        const data = await contactsAPI.getAll(params);
        if (!mounted) return;
        setContacts(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setContactsError('Não foi possível carregar os contatos neste painel.');
        setContacts([]);
      } finally {
        if (mounted) setContactsLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [contactsSearch, selectedLawyer, startDate, endDate]);

  if (!user || user.role !== 'MASTER') {
    return (
      <main className="master-admin-page">
        <section className="master-admin-card master-admin-card--denied">
          <h1 className="master-admin-title">Painel Administrativo</h1>
          <p className="master-admin-denied-text">Acesso restrito ao usuário Master.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="master-admin-page">
      <section className="master-admin-card">
        <header className="master-admin-header">
          <div className="master-admin-header-text">
            <h1 className="master-admin-title">Painel Administrativo</h1>
            <p className="master-admin-subtitle">
              Etapa 1 (protótipo): filtro principal por advogado, data inicial e data final.
            </p>
          </div>
          <button className="master-admin-btn-add" type="button">
            + Adicionar Novo Membro
          </button>
        </header>

        <div className="master-admin-filters-grid">
          <div className="master-admin-field">
            <label className="master-admin-label" htmlFor="master-lawyer-filter">Advogado(a)</label>
            <select
              id="master-lawyer-filter"
              className="master-admin-select"
              value={selectedLawyer}
              onChange={(event) => setSelectedLawyer(event.target.value)}
            >
              {LAWYER_OPTIONS.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>{lawyer.label}</option>
              ))}
            </select>
          </div>

          <div className="master-admin-field">
            <label className="master-admin-label" htmlFor="master-start-date">Data inicial</label>
            <input
              id="master-start-date"
              type="date"
              className="master-admin-date"
              value={startDate}
              onChange={(event) => {
                const nextStart = event.target.value;
                setStartDate(nextStart);
                setEndDate(nextStart);
              }}
            />
          </div>

          <div className="master-admin-field">
            <label className="master-admin-label" htmlFor="master-end-date">Data final</label>
            <input
              id="master-end-date"
              type="date"
              className="master-admin-date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          {selectedLawyer !== 'all' && (
            <div className="master-admin-field master-admin-field--actions">
              <span className="master-admin-label" aria-hidden="true">Ações</span>
              <div className="master-admin-member-actions">
                <button className="master-admin-btn-edit" type="button">
                  Editar
                </button>
                <button className="master-admin-btn-deactivate" type="button">
                  Desativar
                </button>
              </div>
            </div>
          )}
        </div>

        <section className="master-admin-kpi-row" aria-label="Resumo por tópico">
          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--contacts ${activeKpi === 'contatos' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'contatos'}
            onClick={() => setActiveKpi('contatos')}
          >
            <p className="master-admin-kpi-title">Contatos</p>
            <strong className="master-admin-kpi-value">{totals.contatos}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--cases ${activeKpi === 'processos' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'processos'}
            onClick={() => setActiveKpi('processos')}
          >
            <p className="master-admin-kpi-title">Processos</p>
            <strong className="master-admin-kpi-value">{totals.processos}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--tasks ${activeKpi === 'tarefas' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'tarefas'}
            onClick={() => setActiveKpi('tarefas')}
          >
            <p className="master-admin-kpi-title">Tarefas</p>
            <strong className="master-admin-kpi-value">{totals.tarefas}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--finance ${activeKpi === 'financeiro' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'financeiro'}
            onClick={() => setActiveKpi('financeiro')}
          >
            <p className="master-admin-kpi-title">Financeiro</p>
            <strong className="master-admin-kpi-value">{formatCurrency(totals.financeiro)}</strong>
          </button>
        </section>

        <section className="master-admin-contacts-section" aria-label="Contatos (somente leitura)">
          <div className="master-admin-contacts-header">
            <div>
              <h2 className="master-admin-contacts-title">Contatos</h2>
              <p className="master-admin-contacts-subtitle">Espelho read-only da página de contatos com filtro local.</p>
            </div>
            <div className="master-admin-contacts-search-wrap">
              <span className="master-admin-contacts-search-icon">🔍</span>
              <input
                type="text"
                className="master-admin-contacts-search"
                placeholder="Buscar contato..."
                value={contactsSearch}
                onChange={(event) => setContactsSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="master-admin-contacts-readonly">
            {contactsError ? (
              <div className="master-admin-contacts-feedback master-admin-contacts-feedback--error">{contactsError}</div>
            ) : contactsLoading ? (
              <div className="master-admin-contacts-feedback">Carregando contatos...</div>
            ) : contacts.length === 0 ? (
              <div className="master-admin-contacts-feedback">Nenhum contato encontrado para o filtro aplicado.</div>
            ) : (
              contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={false}
                  onSelect={() => {}}
                  onView={() => {}}
                  onLinkToCase={() => {}}
                />
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, FileText, Trash2, Check, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { subscribeToTaskUpdates, notifyTaskUpdate } from '../../services/taskSyncService';
import EmptyState from '../common/EmptyState';
import caseTasksService from '../../services/caseTasksService';
import caseMovementsService from '../../services/caseMovementsService';

/**
 * Mapeamento de tipos de movimentação para exibição legível
 */
const getTipoDisplay = (tipo, tipoCustomizado) => {
  if (!tipo) return '';
  
  const tipoMap = {
    'DESPACHO': 'Despacho',
    'DECISAO': 'Decisão Interlocutória',
    'SENTENCA': 'Sentença',
    'ACORDAO': 'Acórdão',
    'AUDIENCIA': 'Audiência',
    'JUNTADA': 'Juntada de Documento',
    'INTIMACAO': 'Intimação',
    'CITACAO': 'Citação',
    'CONCLUSAO': 'Conclusos',
    'RECURSO': 'Recurso',
    'PETICAO': 'Petição Protocolada',
    'OUTROS': tipoCustomizado || 'Outros'
  };
  
  return tipoMap[tipo] || tipo;
};

const HIGHLIGHT_DURATION_MS = 3000;

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeManualDescription = (descricao, tipoDisplay, tipoRaw) => {
  if (!descricao) return '';

  let sanitizedDescription = descricao.trim();
  const prefixes = [tipoDisplay, tipoRaw].filter(Boolean);

  prefixes.forEach((prefix) => {
    const prefixRegex = new RegExp(`^(?:tipo\\s*[:\\-–—]\\s*)?${escapeRegExp(prefix)}\\s*[:\\-–—]\\s*`, 'i');
    sanitizedDescription = sanitizedDescription.replace(prefixRegex, '');
  });

  return sanitizedDescription;
};

/**
 * MovimentacoesTab - Aba de Movimentações Processuais
 * Exibe lista de movimentações (publicações DJE, despachos, decisões)
 * 
 * 2-Phase Highlight System:
 * - Fase 1 (0-5s): movimento + tarefa com destaque azul
 * - Fase 2 (5s+): apenas tarefa mantém destaque permanente
 */
function MovimentacoesTab({ 
  id,
  movimentacoes = [],
  highlightedMovimentacaoId = null,
  highlightedTaskId = null,
  numeroProcesso = '',
  tasks = [],
  onOpenModal = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onRefreshTasks = () => {},
    onRefreshMovements = () => {},
  }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para controlar qual movimento está com formulário de tarefa aberto
  const [addingTaskForMovement, setAddingTaskForMovement] = useState(null);
  const [newTaskForm, setNewTaskForm] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: '',
  });
  const [savingTask, setSavingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: '',
  });
  const [savingEditedTask, setSavingEditedTask] = useState(false);
  
  // Estados para edição inline de movimentação
  const [editingMovimentacaoId, setEditingMovimentacaoId] = useState(null);
  const [selectedMovimentacaoId, setSelectedMovimentacaoId] = useState(null);
  const [temporaryHighlightedMovimentacaoId, setTemporaryHighlightedMovimentacaoId] = useState(null);
  
  // 2-phase highlight para tarefas
  const [temporaryHighlightedTaskId, setTemporaryHighlightedTaskId] = useState(null); // Fase 1: 0-5s
  const [permanentHighlightedTaskId, setPermanentHighlightedTaskId] = useState(null);  // Fase 2: 5s+
  
  const [editMovimentacaoForm, setEditMovimentacaoForm] = useState({
    data: '',
    tipo: '',
    tipo_customizado: '',
    titulo: '',
    descricao: '',
    prazo: '',
  });
  const [savingMovimentacao, setSavingMovimentacao] = useState(false);

  // Filtrar tarefas por movimentação
  const getTasksByMovement = (movementId) => {
    return tasks.filter(task => Number(task.movimentacao) === Number(movementId));
  };

  // Handler para abrir formulário de adição de tarefa
  const handleOpenAddTask = (movementId) => {
    setEditingTaskId(null);
    setAddingTaskForMovement(movementId);
    setNewTaskForm({
      titulo: '',
      descricao: '',
      data_vencimento: '',
    });
  };

  // Handler para cancelar adição de tarefa
  const handleCancelAddTask = () => {
    setAddingTaskForMovement(null);
    setNewTaskForm({
      titulo: '',
      descricao: '',
      data_vencimento: '',
    });
  };

  // Handler para salvar nova tarefa
  const handleSaveTask = async (movementId) => {
    if (!newTaskForm.titulo.trim()) {
      alert('Título da tarefa é obrigatório');
      return;
    }

    setSavingTask(true);
    try {
      await caseTasksService.createTask({
        case: id,
        movimentacao: movementId,
        titulo: newTaskForm.titulo,
        descricao: newTaskForm.descricao || '',
        data_vencimento: newTaskForm.data_vencimento || null,
        status: 'PENDENTE',
      });
      
      await onRefreshTasks();
      handleCancelAddTask();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Erro ao salvar tarefa');
    } finally {
      setSavingTask(false);
    }
  };

  // Handler para toggle status da tarefa
  const handleToggleTaskStatus = async (task) => {
    try {
      const nextStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
      await caseTasksService.patchTask(task.id, { status: nextStatus });
      await onRefreshTasks();
      
      // Notificar outros abas da mudança de tarefa
      notifyTaskUpdate({
        type: 'task-updated',
        action: 'status-changed',
        taskId: task.id,
        caseId: id,
        newStatus: nextStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling task status:', error);
      alert('Erro ao atualizar status da tarefa');
    }
  };

  const handleOpenEditTask = (task) => {
    setAddingTaskForMovement(null);
    setEditingTaskId(task.id);
    setEditTaskForm({
      titulo: task.titulo || '',
      descricao: task.descricao || '',
      data_vencimento: task.data_vencimento || '',
    });
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskForm({
      titulo: '',
      descricao: '',
      data_vencimento: '',
    });
  };

  const handleSaveEditedTask = async (taskId) => {
    if (!editTaskForm.titulo.trim()) {
      alert('Título da tarefa é obrigatório');
      return;
    }

    setSavingEditedTask(true);
    try {
      await caseTasksService.patchTask(taskId, {
        titulo: editTaskForm.titulo,
        descricao: editTaskForm.descricao || '',
        data_vencimento: editTaskForm.data_vencimento || null,
      });
      await onRefreshTasks();
      handleCancelEditTask();
    } catch (error) {
      console.error('Error editing task:', error);
      alert('Erro ao editar tarefa');
    } finally {
      setSavingEditedTask(false);
    }
  };

  // ========== HANDLERS PARA EDIÇÃO DE MOVIMENTAÇÃO ==========
  const handleOpenEditMovimentacao = (mov) => {
    setEditingMovimentacaoId(mov.id);
    setEditMovimentacaoForm({
      data: mov.data,
      tipo: mov.tipo || '',
      tipo_customizado: mov.tipo_customizado || '',
      titulo: mov.titulo || '',
      descricao: mov.descricao || '',
      prazo: mov.prazo || '',
    });
  };

  const handleCancelEditMovimentacao = () => {
    setEditingMovimentacaoId(null);
    setEditMovimentacaoForm({
      data: '',
      tipo: '',
      tipo_customizado: '',
      titulo: '',
      descricao: '',
      prazo: '',
    });
  };

  const handleSaveMovimentacao = async (movId) => {
    if (!editMovimentacaoForm.titulo.trim()) {
      alert('Título é obrigatório');
      return;
    }

    setSavingMovimentacao(true);
    try {
      await caseMovementsService.updateMovement(movId, {
        case: parseInt(id),
        data: editMovimentacaoForm.data,
        tipo: editMovimentacaoForm.tipo,
        tipo_customizado: editMovimentacaoForm.tipo_customizado || '',
        titulo: editMovimentacaoForm.titulo,
        descricao: editMovimentacaoForm.descricao || '',
        prazo: editMovimentacaoForm.prazo ? parseInt(editMovimentacaoForm.prazo) : null,
      });
      
        // Chamar callbacks para atualizar tarefas e movimentações
        await Promise.all([onRefreshTasks(), onRefreshMovements()]);
      handleCancelEditMovimentacao();
    } catch (error) {
      console.error('Error saving movimentacao:', error);
      alert('Erro ao salvar movimentação');
    } finally {
      setSavingMovimentacao(false);
    }
  };

  const getDaysToDueDate = (dueDate) => {
    if (!dueDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${dueDate}T00:00:00`);
    const diffMs = due.getTime() - today.getTime();

    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  // Calcular urgência automaticamente baseado nos dias restantes (igual CasePrazo)
  const calculateUrgency = (dueDate) => {
    const daysRemaining = getDaysToDueDate(dueDate);
    if (daysRemaining === null) return 'NORMAL';
    
    if (daysRemaining <= 3) return 'URGENTISSIMO';
    if (daysRemaining <= 7) return 'URGENTE';
    return 'NORMAL';
  };

  const filteredMovimentacoes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return movimentacoes;

    return movimentacoes.filter((mov) => {
      const searchableText = [
        mov.titulo,
        mov.descricao,
        mov.tipo,
        mov.tipo_display,
        mov.origem,
        mov.origem_display,
        mov.data,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [movimentacoes, searchTerm]);

  useEffect(() => {
    if (!highlightedMovimentacaoId) return;

    setTemporaryHighlightedMovimentacaoId(highlightedMovimentacaoId);
    setSelectedMovimentacaoId(highlightedMovimentacaoId);

    const scrollTimeout = setTimeout(() => {
      const element = document.getElementById(`movimentacao-${highlightedMovimentacaoId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    const clearHighlightTimeout = setTimeout(() => {
      setTemporaryHighlightedMovimentacaoId((currentId) =>
        currentId === highlightedMovimentacaoId ? null : currentId
      );
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(clearHighlightTimeout);
    };
  }, [highlightedMovimentacaoId, filteredMovimentacoes]);

  /**
   * 2-Phase Task Highlight System
   * Fase 1 (0-5s): temporaryHighlightedTaskId + permanentHighlightedTaskId (ambos azuis)
   * Fase 2 (5s+): apenas permanentHighlightedTaskId (continua azul)
   */
  useEffect(() => {
    if (!highlightedTaskId) return;

    // Fase 1: ativa ambos os destaques
    setTemporaryHighlightedTaskId(highlightedTaskId);
    setPermanentHighlightedTaskId(highlightedTaskId);

    // Scroll até a tarefa
    const scrollTimeout = setTimeout(() => {
      const element = document.getElementById(`task-${highlightedTaskId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    // Fase 2: Remove apenas o destaque temporário após 5s, mantém o permanente
    const clearTemporaryHighlightTimeout = setTimeout(() => {
      setTemporaryHighlightedTaskId((currentId) =>
        currentId === highlightedTaskId ? null : currentId
      );
      // permanentHighlightedTaskId continua ativo indefinidamente
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(clearTemporaryHighlightTimeout);
    };
  }, [highlightedTaskId]);

  /**
   * Sincroniza alterações de tarefas entre abas/janelas do navegador
   * Quando uma tarefa é marcada como concluída em outra aba, recarrega os dados
   */
  useEffect(() => {
    const unsubscribe = subscribeToTaskUpdates((event) => {
      if (event?.type === 'task-updated' && event?.action === 'status-changed') {
        Promise.all([onRefreshTasks(), onRefreshMovements()]);
      }
    });
    return unsubscribe;
  }, [onRefreshTasks, onRefreshMovements]);

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">⚖️ Movimentações Processuais{numeroProcesso && ` - ${numeroProcesso}`}</h2>
            <p className="section-subtitle">Publicações do DJE, despachos, decisões e movimentações do tribunal</p>
          </div>
          {id && (
            <button
              onClick={onOpenModal}
              style={{
                background: '#6b21a8',
                color: 'white',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#581c87';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(107, 33, 168, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#6b21a8';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <Plus size={18} /> Nova Movimentação
            </button>
          )}
        </div>
        
        {movimentacoes.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar movimentações por título, descrição, tipo, origem ou data..."
              className="financeiro-input"
              style={{ width: '100%' }}
            />
          </div>
        )}

        {movimentacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message="Nenhuma movimentação cadastrada"
            hint="Clique em 'Nova Movimentação' para adicionar despachos, decisões, audiências, etc."
          />
        ) : filteredMovimentacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message="Nenhuma movimentação encontrada"
            hint="Tente ajustar o texto de busca"
          />
        ) : (
          <div className="movimentacoes-timeline">
            {filteredMovimentacoes.map(mov => {
              const isTemporaryHighlighted = temporaryHighlightedMovimentacaoId === mov.id;
              const isSelected = selectedMovimentacaoId === mov.id;
              const tipoDisplay = getTipoDisplay(mov.tipo, mov.tipo_customizado);
              const manualDescricao = mov.origem === 'MANUAL'
                ? sanitizeManualDescription(mov.descricao, tipoDisplay, mov.tipo)
                : mov.descricao;

              const truncateText = (text, maxLength) => {
                if (!text || text.length <= maxLength) return text;
                return text.substring(0, maxLength) + '...';
              };

              return (
                <div
                  key={mov.id}
                  id={`movimentacao-${mov.id}`}
                  className="timeline-item"
                  onClick={() => setSelectedMovimentacaoId(mov.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    ...(isTemporaryHighlighted
                      ? {
                          background: '#eff6ff',
                          border: '3px solid #3b82f6',
                          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
                        }
                      : isSelected
                        ? {
                            border: '3px solid #6b21a8',
                          }
                        : {}),
                  }}
                >
                  <div className="timeline-marker"></div>
                  
                  <div className="timeline-content">
                  {/* MODO EDIÇÃO - Formulário inline */}
                  {editingMovimentacaoId === mov.id && (
                    <div style={{ 
                      background: '#faf5ff',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '2px solid #6b21a8',
                      marginBottom: '1rem'
                    }}>
                      <h4 style={{ marginBottom: '1rem', color: '#6b21a8', fontWeight: '600' }}>Editar Movimentação</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {/* Data */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b21a8', fontWeight: '600', fontSize: '0.875rem' }}>
                            Data *
                          </label>
                          <input
                            type="date"
                            value={editMovimentacaoForm.data}
                            onChange={(e) => setEditMovimentacaoForm(prev => ({ ...prev, data: e.target.value }))}
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
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b21a8', fontWeight: '600', fontSize: '0.875rem' }}>
                            Tipo *
                          </label>
                          <select
                            value={editMovimentacaoForm.tipo}
                            onChange={(e) => setEditMovimentacaoForm(prev => ({ ...prev, tipo: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '0.9375rem',
                              fontFamily: 'inherit'
                            }}
                          >
                            <option value="DESPACHO">Despacho</option>
                            <option value="DECISAO">Decisão Interlocutória</option>
                            <option value="SENTENCA">Sentença</option>
                            <option value="ACORDAO">Acórdão</option>
                            <option value="AUDIENCIA">Audiência</option>
                            <option value="JUNTADA">Juntada de Documento</option>
                            <option value="INTIMACAO">Intimação</option>
                            <option value="CITACAO">Citação</option>
                            <option value="CONCLUSAO">Conclusos</option>
                            <option value="RECURSO">Recurso</option>
                            <option value="PETICAO">Petição Protocolada</option>
                            <option value="OUTROS">Outros</option>
                          </select>
                        </div>
                      </div>

                      {/* Tipo Customizado (se OUTROS) */}
                      {editMovimentacaoForm.tipo === 'OUTROS' && (
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b21a8', fontWeight: '600', fontSize: '0.875rem' }}>
                            Especifique o tipo *
                          </label>
                          <input
                            type="text"
                            value={editMovimentacaoForm.tipo_customizado}
                            onChange={(e) => setEditMovimentacaoForm(prev => ({ ...prev, tipo_customizado: e.target.value }))}
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b21a8', fontWeight: '600', fontSize: '0.875rem' }}>
                          Título/Resumo *
                        </label>
                        <input
                          type="text"
                          value={editMovimentacaoForm.titulo}
                          onChange={(e) => setEditMovimentacaoForm(prev => ({ ...prev, titulo: e.target.value }))}
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b21a8', fontWeight: '600', fontSize: '0.875rem' }}>
                          Descrição Completa
                        </label>
                        <textarea
                          value={editMovimentacaoForm.descricao}
                          onChange={(e) => setEditMovimentacaoForm(prev => ({ ...prev, descricao: e.target.value }))}
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b21a8', fontWeight: '600', fontSize: '0.875rem' }}>
                          Prazo (em dias)
                        </label>
                        <input
                          type="number"
                          value={editMovimentacaoForm.prazo}
                          onChange={(e) => setEditMovimentacaoForm(prev => ({ ...prev, prazo: e.target.value }))}
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
                          onClick={() => handleSaveMovimentacao(mov.id)}
                          disabled={savingMovimentacao}
                          style={{
                            background: '#6b21a8',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: savingMovimentacao ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9375rem',
                            opacity: savingMovimentacao ? 0.6 : 1,
                            transition: '0.2s'
                          }}
                          onMouseEnter={(e) => { if (!savingMovimentacao) e.target.style.background = '#581c87'; }}
                          onMouseLeave={(e) => { if (!savingMovimentacao) e.target.style.background = '#6b21a8'; }}
                        >
                          {savingMovimentacao ? 'Salvando...' : '✓ Salvar'}
                        </button>
                        <button
                          onClick={handleCancelEditMovimentacao}
                          disabled={savingMovimentacao}
                          style={{
                            background: '#e2e8f0',
                            color: '#6b21a8',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '6px',
                            cursor: savingMovimentacao ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9375rem',
                            transition: '0.2s'
                          }}
                          onMouseEnter={(e) => { if (!savingMovimentacao) e.target.style.background = '#cbd5e1'; }}
                          onMouseLeave={(e) => { if (!savingMovimentacao) e.target.style.background = '#e2e8f0'; }}
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* MODO VISUALIZAÇÃO - Conteúdo normal */}
                  {editingMovimentacaoId !== mov.id && (
                    <>
                  
                  {/* Data de disponibilização + Tipo (MANUAL) - mesma linha */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    fontSize: '1.36rem',
                    fontWeight: '500',
                    color: '#6b21a8',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Lado esquerdo: Data */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      📅 <strong>Disponibilização:</strong> {formatDate(mov.data)}
                    </span>
                    
                    {/* Lado direito: Tipo (para movimentações MANUAL) */}
                    {mov.origem === 'MANUAL' && mov.tipo && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        ⚖️ <strong>Tipo:</strong> {tipoDisplay}
                      </span>
                    )}
                  </div>

                  {/* Órgão (linha separada) */}
                  {mov.orgao && (
                    <div style={{ 
                      marginBottom: '1.5rem',
                      fontSize: '1.36rem',
                      fontWeight: '500',
                      color: '#6b21a8'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        🏛️ <strong>Órgão:</strong> {mov.orgao}
                      </span>
                    </div>
                  )}

                    {/* Conteúdo diferenciado: MANUAL vs AUTOMÁTICA */}
                    {mov.origem === 'MANUAL' ? (
                      // Formato estruturado para movimentações MANUAL
                      <div style={{ marginBottom: '0.75rem' }}>
                        {/* Título com label */}
                        {mov.titulo && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ 
                              fontSize: '1.05rem',
                              fontWeight: '700',
                              color: '#6b21a8',
                              marginBottom: '0.375rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Título:
                            </div>
                            <div style={{ 
                              fontSize: '1.25rem',
                              lineHeight: '1.6',
                              color: '#6b21a8',
                              fontWeight: '600'
                            }}>
                              {mov.titulo}
                            </div>
                          </div>
                        )}
                        {/* Descrição Completa */}
                        {manualDescricao && (
                          <div>
                            <div style={{ 
                              fontSize: '1.05rem',
                              fontWeight: '700',
                              color: '#6b21a8',
                              marginBottom: '0.375rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Descrição completa:
                            </div>
                            <div style={{ 
                              fontSize: '1.125rem',
                              lineHeight: '1.6',
                              color: '#6b21a8',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {manualDescricao}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Formato original para movimentações AUTOMÁTICAS (importadas)
                      <>
                        {/* Texto da publicação truncado (prioriza descrição completa) */}
                        <div style={{ 
                          fontSize: '1.125rem',
                          lineHeight: '1.6',
                          color: '#6b21a8',
                          marginBottom: '0.75rem'
                        }}>
                          {(() => {
                            // Priorizar descricao (texto completo) sobre titulo (resumo)
                            const textoCompleto = mov.descricao || mov.titulo || '';
                            const minChars = 240;
                            const maxChars = 360;
                            
                            if (textoCompleto.length <= minChars) {
                              return textoCompleto;
                            }
                            
                            // Truncar entre 240-360 chars tentando terminar em frase
                            let truncated = textoCompleto.substring(0, maxChars);
                            const lastPeriod = truncated.lastIndexOf('.');
                            const lastComma = truncated.lastIndexOf(',');
                            
                            if (lastPeriod > minChars) {
                              truncated = textoCompleto.substring(0, lastPeriod + 1);
                            } else if (lastComma > minChars) {
                              truncated = textoCompleto.substring(0, lastComma + 1);
                            }
                            
                            return truncated + '...';
                          })()}
                        </div>

                        {/* Link "Ver publicação completa" */}
                        {mov.publicacao_id && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(`/publications/${mov.publicacao_id}/details`, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              style={{ 
                                color: '#6b21a8',
                                textDecoration: 'none',
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'transform 0.2s ease',
                                transformOrigin: 'left center'
                              }}
                            >
                              → Ver publicação completa
                            </a>
                          </div>
                        )}
                      </>
                    )}

                    {/* Badges e Ações: ORIGEM → PRAZOS | EXCLUIR */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Badges Container */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Badge ORIGEM */}
      <span className={`origem-badge origem-${mov.origem?.toLowerCase() || 'dje'}`} style={{
                          textTransform: 'uppercase',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          background: '#6b21a8',
                          color: 'white',
                          display: 'inline-block',
                          border: 'none'
                        }}>
                          {mov.origem === 'MANUAL' ? 'MANUAL' : `IMPORTADO ${mov.origem}`}
                        </span>
                        
                        {/* Badge PRAZOS */}
                        {mov.prazo && (
                          <span style={{
                            textTransform: 'uppercase',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            background: '#6b21a8',
                            color: 'white',
                            display: 'inline-block'
                          }}>
                            PRAZOS: {mov.prazo} DIAS
                          </span>
                        )}
                      </div>

                      {/* Ações */}
                      {mov.origem === 'MANUAL' && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            onClick={() => handleOpenEditMovimentacao(mov)}
                            title="Editar movimentação"
                            style={{
                              background: '#6b21a8',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1.25rem',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              fontWeight: '600',
                              transition: '0.2s',
                              whiteSpace: 'nowrap',
                              minWidth: 'fit-content'
                            }}
                            onMouseEnter={(e) => { e.target.style.background = '#581c87'; e.target.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.target.style.background = '#6b21a8'; e.target.style.transform = 'scale(1)'; }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => onDelete(mov.id)}
                            title="Excluir"
                            style={{
                              background: '#6b21a8',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1.25rem',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              fontWeight: '600',
                              transition: '0.2s',
                              whiteSpace: 'nowrap',
                              minWidth: 'fit-content'
                            }}
                            onMouseEnter={(e) => { e.target.style.background = '#581c87'; e.target.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.target.style.background = '#6b21a8'; e.target.style.transform = 'scale(1)'; }}
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>

                    </>
                  )}

                    {/* ========== SEÇÃO DE TAREFAS ========== */}
                    <hr style={{ 
                      margin: '1.5rem 0', 
                      border: 'none', 
                      borderTop: '3px solid #6b21a8',
                      opacity: 0.3
                    }} />

                    {/* Header: TAREFAS | + Adicionar Tarefa */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <h4 style={{ 
                        fontSize: '1.059rem', 
                        fontWeight: '700', 
                        color: '#6b21a8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        margin: 0
                      }}>
                        📋 Tarefas
                      </h4>
                      <button
                        onClick={() => handleOpenAddTask(mov.id)}
                        disabled={addingTaskForMovement === mov.id}
                        title="Adicionar nova tarefa"
                        style={{
                          background: '#6b21a8',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: addingTaskForMovement === mov.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease',
                          opacity: addingTaskForMovement === mov.id ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (addingTaskForMovement !== mov.id) {
                            e.target.style.background = '#581c87';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(107, 33, 168, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#6b21a8';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <Plus size={16} /> Adicionar Tarefa
                      </button>
                    </div>

                    {/* Lista de Tarefas Existentes */}
                    {getTasksByMovement(mov.id).length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        {getTasksByMovement(mov.id).map(task => {
                          const isTemporaryHighlighted = temporaryHighlightedTaskId === task.id;
                          const isPermanentHighlighted = permanentHighlightedTaskId === task.id;
                          const isHighlighted = isTemporaryHighlighted || isPermanentHighlighted;

                          return (
                          <div
                            key={task.id}
                            id={`task-${task.id}`}
                            style={{
                              display: 'flex',
                              gap: '0.75rem',
                              padding: '0.5rem',
                              background: isHighlighted ? '#eff6ff' : '#faf5ff',
                              border: isHighlighted ? '3px solid #3b82f6' : '1px solid #6b21a8',
                              borderRadius: '6px',
                              marginBottom: '0.5rem',
                              alignItems: 'flex-start',
                              boxShadow: isHighlighted ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : 'none',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={task.status === 'CONCLUIDA'}
                              onChange={() => handleToggleTaskStatus(task)}
                              style={{
                                marginTop: '0.25rem',
                                cursor: 'pointer',
                                width: '16px',
                                height: '16px'
                              }}
                            />
                            
                            {/* Conteúdo da Tarefa */}
                            <div style={{ flex: 1 }}>
                              {editingTaskId === task.id ? (
                                <>
                                  <input
                                    type="text"
                                    value={editTaskForm.titulo}
                                    onChange={(e) => setEditTaskForm(prev => ({ ...prev, titulo: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '0.45rem',
                                      border: '1px solid #6b21a8',
                                      borderRadius: '4px',
                                      fontSize: '1.05rem',
                                      marginBottom: '0.4rem',
                                      background: 'white',
                                      color: '#6b21a8',
                                      fontWeight: '500'
                                    }}
                                  />
                                  <textarea
                                    value={editTaskForm.descricao}
                                    onChange={(e) => setEditTaskForm(prev => ({ ...prev, descricao: e.target.value }))}
                                    rows={2}
                                    style={{
                                      width: '100%',
                                      padding: '0.45rem',
                                      border: '1px solid #6b21a8',
                                      borderRadius: '4px',
                                      fontSize: '0.975rem',
                                      marginBottom: '0.4rem',
                                      resize: 'vertical',
                                      background: 'white',
                                      color: '#6b21a8',
                                      fontWeight: '500'
                                    }}
                                  />
                                  <div style={{ marginBottom: '0.5rem' }}>
                                    <input
                                      type="date"
                                      value={editTaskForm.data_vencimento}
                                      onChange={(e) => setEditTaskForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
                                      placeholder="Data de vencimento"
                                      style={{
                                        width: '100%',
                                        padding: '0.45rem',
                                        border: '1px solid #6b21a8',
                                        borderRadius: '4px',
                                        fontSize: '0.975rem',
                                        background: 'white',
                                        color: '#6b21a8',
                                        fontWeight: '500'
                                      }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button
                                      onClick={handleCancelEditTask}
                                      disabled={savingEditedTask}
                                      style={{
                                        border: '1px solid #6b21a8',
                                        background: '#ffffff',
                                        color: '#6b21a8',
                                        borderRadius: '8px',
                                        padding: '0.375rem 0.75rem',
                                        fontSize: '0.8125rem',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        cursor: savingEditedTask ? 'not-allowed' : 'pointer',
                                        opacity: savingEditedTask ? 0.6 : 1
                                      }}
                                    >
                                      <X size={12} /> Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleSaveEditedTask(task.id)}
                                      disabled={savingEditedTask || !editTaskForm.titulo.trim()}
                                      style={{
                                        border: 'none',
                                        background: '#6b21a8',
                                        color: 'white',
                                        borderRadius: '8px',
                                        padding: '0.375rem 0.75rem',
                                        fontSize: '0.8125rem',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        cursor: (savingEditedTask || !editTaskForm.titulo.trim()) ? 'not-allowed' : 'pointer',
                                        opacity: (savingEditedTask || !editTaskForm.titulo.trim()) ? 0.6 : 1
                                      }}
                                    >
                                      <Check size={12} /> {savingEditedTask ? 'Salvando...' : 'Salvar'}
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    <div style={{
                                      fontWeight: '600',
                                      fontSize: '0.9625rem',
                                      color: '#6b21a8',
                                      textDecoration: task.status === 'CONCLUIDA' ? 'line-through' : 'none',
                                      marginBottom: '0.25rem'
                                    }}>
                                      {task.titulo}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                                      <button
                                        onClick={() => handleOpenEditTask(task)}
                                        title="Editar tarefa"
                                        style={{
                                          border: 'none',
                                          background: '#6b21a8',
                                          color: 'white',
                                          borderRadius: '6px',
                                          padding: '0.25rem 0.5rem',
                                          fontSize: '0.75rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          cursor: 'pointer',
                                          fontWeight: '600',
                                          transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => { e.target.style.background = '#581c87'; e.target.style.transform = 'scale(1.05)'; }}
                                        onMouseLeave={(e) => { e.target.style.background = '#6b21a8'; e.target.style.transform = 'scale(1)'; }}
                                      >
                                        Editar
                                      </button>
                                    </div>
                                  </div>
                                  {task.descricao && (
                                    <div style={{
                                      fontSize: '0.9375rem',
                                      color: '#6b21a8',
                                      marginBottom: '0.25rem'
                                    }}>
                                      {task.descricao}
                                    </div>
                                  )}
                                  <div style={{
                                    fontSize: '0.9375rem',
                                    color: '#6b21a8',
                                    fontWeight: '700',
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center'
                                  }}>
                                    {task.data_vencimento && (
                                      <>
                                        <span>📅 {formatDate(task.data_vencimento)}</span>
                                        {(() => {
                                          const remainingDays = getDaysToDueDate(task.data_vencimento);
                                          if (remainingDays === null) return null;

                                          const label = remainingDays >= 0
                                            ? `Falta${remainingDays === 1 ? '' : 'm'} ${remainingDays} dia${remainingDays === 1 ? '' : 's'}`
                                            : `Venceu há ${Math.abs(remainingDays)} dia${Math.abs(remainingDays) === 1 ? '' : 's'}`;

                                          return <span>• {label}</span>;
                                        })()}
                                      </>
                                    )}
                                    {task.data_vencimento && (() => {
                                      const urgenciaCalculada = calculateUrgency(task.data_vencimento);
                                      const displayText = urgenciaCalculada === 'URGENTISSIMO' ? 'CRITICO' : urgenciaCalculada;
                                      return (
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '0.35rem 0.75rem',
                                          borderRadius: '8px',
                                          fontSize: '0.8125rem',
                                          fontWeight: '700',
                                          background: '#6b21a8',
                                          color: '#f8fafc',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.4px',
                                          lineHeight: 1
                                        }}>
                                          {displayText}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Formulário Inline para Nova Tarefa */}
                    {addingTaskForMovement === mov.id && (
                      <div style={{
                        padding: '0.75rem',
                        background: '#faf5ff',
                        border: '1px solid #c4b5fd',
                        borderRadius: '6px',
                        marginBottom: '0.75rem'
                      }}>
                        {/* Título */}
                        <input
                          type="text"
                          placeholder="Título da tarefa *"
                          value={newTaskForm.titulo}
                          onChange={(e) => setNewTaskForm(prev => ({ ...prev, titulo: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #6b21a8',
                            borderRadius: '4px',
                            fontSize: '1.05rem',
                            marginBottom: '0.5rem',
                            background: 'white',
                            color: '#6b21a8',
                            fontWeight: '500'
                          }}
                        />

                        {/* Descrição */}
                        <textarea
                          placeholder="Descrição (opcional)"
                          value={newTaskForm.descricao}
                          onChange={(e) => setNewTaskForm(prev => ({ ...prev, descricao: e.target.value }))}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #6b21a8',
                            borderRadius: '4px',
                            fontSize: '0.975rem',
                            marginBottom: '0.5rem',
                            resize: 'vertical',
                            background: 'white',
                            color: '#6b21a8',
                            fontWeight: '500'
                          }}
                        />

                        {/* Data Limite */}
                        <div style={{ marginBottom: '0.5rem' }}>
                          <input
                            type="date"
                            placeholder="Data de vencimento"
                            value={newTaskForm.data_vencimento}
                            onChange={(e) => setNewTaskForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #6b21a8',
                              borderRadius: '4px',
                              fontSize: '0.975rem',
                              background: 'white',
                              color: '#6b21a8',
                              fontWeight: '500'
                            }}
                          />
                        </div>

                        {/* Botões de Ação */}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={handleCancelAddTask}
                            disabled={savingTask}
                            style={{
                              border: '1px solid #6b21a8',
                              background: '#ffffff',
                              color: '#6b21a8',
                              borderRadius: '8px',
                              padding: '0.375rem 0.75rem',
                              fontSize: '0.8125rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: savingTask ? 'not-allowed' : 'pointer',
                              opacity: savingTask ? 0.6 : 1,
                              transition: 'all 0.2s'
                            }}
                          >
                            <X size={14} /> Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveTask(mov.id)}
                            disabled={savingTask || !newTaskForm.titulo.trim()}
                            style={{
                              border: 'none',
                              background: '#6b21a8',
                              color: 'white',
                              borderRadius: '8px',
                              padding: '0.375rem 0.75rem',
                              fontSize: '0.8125rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: (savingTask || !newTaskForm.titulo.trim()) ? 'not-allowed' : 'pointer',
                              opacity: (savingTask || !newTaskForm.titulo.trim()) ? 0.6 : 1,
                              transition: 'all 0.2s'
                            }}
                          >
                            <Check size={14} /> {savingTask ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mensagem quando não há tarefas */}
                    {getTasksByMovement(mov.id).length === 0 && addingTaskForMovement !== mov.id && (
                      <div style={{
                        fontSize: '0.8125rem',
                        color: '#94a3b8',
                        fontStyle: 'italic',
                        padding: '0.5rem',
                        textAlign: 'center'
                      }}>
                        Nenhuma tarefa vinculada. Clique em "Adicionar Tarefa" para criar.
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovimentacoesTab;

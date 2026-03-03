import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, Edit2, Trash2, Check, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';
import caseTasksService from '../../services/caseTasksService';

/**
 * MovimentacoesTab - Aba de Movimentações Processuais
 * Exibe lista de movimentações (publicações DJE, despachos, decisões)
 */
function MovimentacoesTab({ 
  id,
  movimentacoes = [],
  highlightedMovimentacaoId = null,
  numeroProcesso = '',
  deadlines = [],
  tasks = [],
  onOpenModal = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onAddPrazo = () => {},
  onCreateTaskInDeadlines = () => {},
  onRefreshTasks = () => {},
}) {
  // Mapeamento de movimentações para prazos criados
  const getDeadlinesByMovement = (movementId) => {
    return deadlines.filter(d => d.id === movementId);
  };
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

  /**
   * Navega/scroll até a movimentação quando highlightedMovimentacaoId é definido
   */
  useEffect(() => {
    if (highlightedMovimentacaoId) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        const element = document.getElementById(`movimentacao-${highlightedMovimentacaoId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedMovimentacaoId]);

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

    const element = document.getElementById(`movimentacao-${highlightedMovimentacaoId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedMovimentacaoId, filteredMovimentacoes]);

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
              const truncateText = (text, maxLength) => {
                if (!text || text.length <= maxLength) return text;
                return text.substring(0, maxLength) + '...';
              };

              return (
                <div
                  key={mov.id}
                  id={`movimentacao-${mov.id}`}
                  className="timeline-item"
                  style={
                    highlightedMovimentacaoId === mov.id
                      ? {
                          background: '#eff6ff',
                          border: '2px solid #3b82f6',
                          borderRadius: '8px',
                          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.15)',
                          transition: 'all 0.3s ease',
                        }
                      : undefined
                  }
                >
                  <div className="timeline-marker"></div>
                  
                  {/* Meta: Data de disponibilização + Órgão */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    marginBottom: '0.75rem',
                    fontSize: '1.03rem',
                    fontWeight: '500',
                    color: '#6b21a8',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      📅 <strong>Disponibilização:</strong> {formatDate(mov.data)}
                    </span>
                    {(() => {
                      // Usar órgão da API se disponível, senão usar o que foi extraído do texto
                      if (mov.orgao) {
                        return (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            🏛️ <strong>Órgão:</strong> {mov.orgao}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="timeline-content">
                    {/* Texto da publicação truncado (prioriza descrição completa) */}
                    <div style={{ 
                      fontSize: '0.9375rem',
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
                            fontSize: '0.875rem',
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

                    {/* Badges: ORIGEM → PRAZOS → INDICADOR */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Badge ORIGEM */}
                      <span className={`origem-badge origem-${mov.origem?.toLowerCase() || 'dje'}`} style={{
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        letterSpacing: '0.5px'
                      }}>
                        {mov.origem === 'MANUAL' ? 'MANUAL' : `IMPORTADO ${mov.origem}`}
                      </span>
                      
                      {/* Badge PRAZOS */}
                      {mov.prazo && (
                        <span className="prazo-badge" style={{
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          letterSpacing: '0.5px'
                        }}>
                          PRAZOS: {mov.prazo} DIAS
                        </span>
                      )}
                      
                      {/* Badge INDICADOR */}
                      {getDeadlinesByMovement(mov.id).length > 0 && (
                        <span className="prazo-generated-badge" style={{
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          letterSpacing: '0.5px'
                        }}>
                          ✓ PRAZO CRIADO
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    {mov.origem === 'MANUAL' && (
                      <div className="timeline-actions" style={{ marginTop: '0.75rem' }}>
                        {!mov.prazo && (
                          <button 
                            className="btn-icon-small btn-warning" 
                            onClick={() => onAddPrazo(mov)}
                            title="Adicionar prazo a esta movimentação"
                          >
                            ⏰ Prazo
                          </button>
                        )}
                        <button
                          className="btn-icon-small"
                          onClick={() => onCreateTaskInDeadlines(mov)}
                          title="Criar tarefa vinculada na aba Prazos"
                        >
                          📝 Tarefa
                        </button>
                        <button 
                          className="btn-icon-small" 
                          onClick={() => onEdit(mov)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-icon-small btn-danger" 
                          onClick={() => onDelete(mov.id)}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                    {/* ========== SEÇÃO DE TAREFAS ========== */}
                    <hr style={{ 
                      margin: '1rem 0', 
                      border: 'none', 
                      borderTop: '1px solid #e2e8f0' 
                    }} />

                    {/* Header: TAREFAS | + Adicionar Tarefa */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <h4 style={{ 
                        fontSize: '0.9625rem', 
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
                        {getTasksByMovement(mov.id).map(task => (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex',
                              gap: '0.75rem',
                              padding: '0.5rem',
                              background: '#faf5ff',
                              border: '1px solid #6b21a8',
                              borderRadius: '6px',
                              marginBottom: '0.5rem',
                              alignItems: 'flex-start'
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
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Edit2 size={12} /> Editar
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
                                          {urgenciaCalculada}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
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

// src/components/FormFields/SearchableCreatableSelectField.jsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Pencil } from 'lucide-react';
import './FormFields.css';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function capitalizeWords(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  return raw
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * SearchableCreatableSelectField
 * - Input filters the dropdown options (by label)
 * - Check icon confirms current text:
 *   - If text matches an existing option label => selects that option
 *   - Else creates a new option and selects it (value = label)
 */
export default function SearchableCreatableSelectField({
  label,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Pesquisar ou selecionar...',
  allowCreate = true,
  onCreateOption = null,
  onEditOption = null,
  reduceListOnQuery = false,
}) {
  const rootRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const lastUserInputRef = useRef('');
  const optionRefs = useRef(new Map());

  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const [extraOptions, setExtraOptions] = useState([]);
  const allOptions = useMemo(() => {
    const map = new Map();
    for (const opt of normalizedOptions) {
      map.set(String(opt.value), opt);
    }
    for (const opt of extraOptions) {
      map.set(String(opt.value), opt);
    }
    return Array.from(map.values());
  }, [normalizedOptions, extraOptions]);

  const selectedLabel = useMemo(() => {
    const selected = allOptions.find((opt) => String(opt.value) === String(value));
    return selected?.label ?? (value ?? '');
  }, [allOptions, value]);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);

  const inputValue = isDirty ? query : (selectedLabel || '');

  // UX: por padrão, não reduzir a lista ao digitar; apenas destacar/rolar para o melhor match.
  // Para campos com muitos itens (ex: títulos), pode reduzir/filtrar via prop.
  const visibleOptions = useMemo(() => {
    if (!reduceListOnQuery) return allOptions;
    if (!isDirty) return allOptions;
    const q = normalizeText(query).trim();
    if (!q) return allOptions;
    return allOptions.filter((opt) => normalizeText(opt.label).includes(q));
  }, [reduceListOnQuery, allOptions, isDirty, query]);

  const suppressSelectedStyle = useMemo(() => {
    if (!isOpen) return false;

    // If the user is navigating the list (mouse hover or keyboard),
    // avoid showing two highlights at once (selected + active).
    const active = activeIndex >= 0 ? visibleOptions[activeIndex] : null;
    if (active && String(active.value) !== String(value)) {
      return true;
    }

    // Also suppress selected styling when user is typing a different query.
    if (!isDirty) return false;
    const q = normalizeText(query).trim();
    if (!q) return false;
    const sel = normalizeText(selectedLabel).trim();
    return q !== sel;
  }, [isOpen, activeIndex, visibleOptions, value, isDirty, query, selectedLabel]);

  const [dropdownStyle, setDropdownStyle] = useState(null);

  const isInCaseDetailWrapper = !!rootRef.current?.closest?.('.detail-select-wrapper');

  const computeDropdownStyle = () => {
    const root = rootRef.current;
    if (!root) return null;
    const rect = root.getBoundingClientRect();
    return {
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    };
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // LayoutEffect evita flicker: garante que o dropdown já tenha estilo no mesmo frame.
    const next = computeDropdownStyle();
    if (next) setDropdownStyle(next);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const updatePosition = () => {
      const next = computeDropdownStyle();
      if (next) setDropdownStyle(next);
    };

    const onPointerDown = (event) => {
      const root = rootRef.current;
      const dropdown = dropdownRef.current;
      if (root && root.contains(event.target)) return;
      if (dropdown && dropdown.contains(event.target)) return;
      setIsOpen(false);
      setIsDirty(false);
      setQuery('');
      setActiveIndex(-1);
      setIsEditingSelected(false);
      setEditingTarget(null);
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen]);

  // Define um "ativo" (para rolar e para Enter selecionar corretamente)
  useEffect(() => {
    if (!isOpen) return;
    if (visibleOptions.length === 0) {
      setActiveIndex(-1);
      return;
    }

    const raw = String((isDirty ? query : selectedLabel) || '').trim();
    const normalized = normalizeText(raw);

    let idx = -1;
    if (normalized) {
      idx = visibleOptions.findIndex((opt) => normalizeText(opt.label) === normalized);
      if (idx < 0) idx = visibleOptions.findIndex((opt) => normalizeText(opt.label).startsWith(normalized));
      if (idx < 0) idx = visibleOptions.findIndex((opt) => normalizeText(opt.label).includes(normalized));
    }
    if (idx < 0 && value != null && value !== '') {
      idx = visibleOptions.findIndex((opt) => String(opt.value) === String(value));
    }
    if (idx < 0) idx = 0;
    setActiveIndex(idx);
  }, [isOpen, visibleOptions, isDirty, query, selectedLabel, value]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (activeIndex < 0) return;
    const opt = visibleOptions[activeIndex];
    if (!opt) return;
    const key = String(opt.value);
    const el = optionRefs.current.get(key);
    if (!el) return;
    try {
      el.scrollIntoView({ block: 'nearest' });
    } catch {
      // ignore
    }
  }, [isOpen, activeIndex, visibleOptions]);

  const hasExactLabelMatch = useMemo(() => {
    const trimmed = String((isDirty ? query : selectedLabel) || '').trim();
    if (!trimmed) return false;
    const normalizedQuery = normalizeText(trimmed);
    return allOptions.some((opt) => normalizeText(opt.label) === normalizedQuery);
  }, [allOptions, isDirty, query, selectedLabel]);

  const shouldShowConfirm = allowCreate && !disabled && !creating && (() => {
    if (isEditingSelected) return false;
    const trimmed = String((isDirty ? query : selectedLabel) || '').trim();
    if (!trimmed) return false;
    return !hasExactLabelMatch;
  })();

  const selectedOption = useMemo(() => {
    return allOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [allOptions, value]);

  const editCandidateOption = useMemo(() => {
    if (disabled) return null;
    if (typeof onEditOption !== 'function') return null;

    // Prefer editing the option that matches the current text exactly (when user typed/searching),
    // otherwise fall back to the selected option.
    const raw = String((isDirty ? query : selectedLabel) || '').trim();
    const normalizedRaw = normalizeText(raw);
    const exact = normalizedRaw
      ? allOptions.find((opt) => normalizeText(opt.label) === normalizedRaw)
      : null;

    const candidate = exact || selectedOption;
    if (!candidate) return null;
    if (!candidate.editable) return null;
    if (candidate.id == null) return null;
    return candidate;
  }, [disabled, onEditOption, isDirty, query, selectedLabel, allOptions, selectedOption]);

  const canInlineEditCandidate = !!editCandidateOption;

  const shouldShowEditIcon = !isEditingSelected && canInlineEditCandidate && !shouldShowConfirm;

  const canSaveEdit = useMemo(() => {
    if (!isEditingSelected) return false;
    if (!editingTarget) return false;
    const trimmed = String(query || '').trim();
    if (!trimmed) return false;
    const normalizedNext = normalizeText(trimmed);
    const normalizedPrev = normalizeText(editingTarget.label);
    return normalizedNext !== normalizedPrev;
  }, [isEditingSelected, editingTarget, query]);

  const handleSelect = (opt) => {
    if (disabled) return;
    if (onChange) onChange(opt.value);
    setIsOpen(false);
    setIsDirty(false);
    setQuery(opt.label);
    lastUserInputRef.current = '';
    setActiveIndex(-1);
    setIsEditingSelected(false);
    setEditingTarget(null);
  };

  const startEditingSelected = () => {
    if (!editCandidateOption) return;

    setIsOpen(false);
    setIsEditingSelected(true);
    setEditingTarget({
      id: editCandidateOption.id,
      value: editCandidateOption.value,
      label: editCandidateOption.label,
    });
    setIsDirty(true);
    setQuery(String(editCandidateOption.label || ''));

    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      try {
        input.focus();
        input.setSelectionRange(0, String(editCandidateOption.label || '').length);
      } catch {
        // ignore
      }
    });
  };

  const confirmEditingSelected = async () => {
    if (!isEditingSelected) return;
    if (!editingTarget) return;
    if (disabled) return;
    if (typeof onEditOption !== 'function') return;

    const trimmed = String(query || '').trim();
    if (!trimmed) return;

    const nextLabel = capitalizeWords(trimmed);
    if (normalizeText(nextLabel) === normalizeText(editingTarget.label)) {
      setIsEditingSelected(false);
      setEditingTarget(null);
      setIsDirty(false);
      setQuery('');
      return;
    }

    let updated = null;
    try {
      updated = await onEditOption(editingTarget.id, nextLabel);
    } catch (error) {
      // Caller should surface the error (ex.: toast). Keep editing open.
      console.warn('Error updating option:', error);
      return;
    }

    // If caller returned null/undefined (ex.: validation/conflict), keep editing open.
    if (!updated) {
      return;
    }

    setExtraOptions((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const updatedValue = updated.value ?? nextLabel;
      const updatedLabel = updated.label ?? nextLabel;
      const idx = next.findIndex((p) => (
        (p?.id != null && editingTarget?.id != null && Number(p.id) === Number(editingTarget.id))
        || String(p?.value) === String(editingTarget.value)
      ));
      const merged = {
        ...(editingTarget || null),
        ...(typeof updated === 'object' ? updated : null),
        value: updatedValue,
        label: updatedLabel,
      };
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...merged };
        return next;
      }
      return [...next, merged];
    });

    if (String(value) === String(editingTarget.value)) {
      if (onChange) onChange(updated.value ?? nextLabel);
    }

    setIsEditingSelected(false);
    setEditingTarget(null);
    setIsDirty(false);
    setQuery('');
    lastUserInputRef.current = '';
    setActiveIndex(-1);
  };

  const handleConfirm = async () => {
    if (disabled) return;
    if (!allowCreate) return;

    const trimmed = String((isDirty ? query : selectedLabel) || '').trim();
    if (!trimmed) {
      if (onChange) onChange('');
      setIsOpen(false);
      setIsDirty(false);
      setQuery('');
      lastUserInputRef.current = '';
      return;
    }

    const normalizedQuery = normalizeText(trimmed);
    const existingByLabel = allOptions.find((opt) => normalizeText(opt.label) === normalizedQuery);
    if (existingByLabel) {
      handleSelect(existingByLabel);
      return;
    }

    let createdLabel = capitalizeWords(trimmed);
    let createdValue = createdLabel;
    let createdMeta = null;

    if (typeof onCreateOption === 'function') {
      try {
        setCreating(true);
        const result = await onCreateOption(createdLabel);
        if (typeof result === 'string' && result.trim()) {
          createdLabel = result.trim();
          createdValue = createdLabel;
        } else if (result && typeof result === 'object') {
          createdMeta = result;
          if (typeof result.label === 'string' && result.label.trim()) {
            createdLabel = result.label.trim();
          }
          if (typeof result.value === 'string' && result.value.trim()) {
            createdValue = result.value.trim();
          } else {
            createdValue = createdLabel;
          }
        }
      } finally {
        setCreating(false);
      }
    }

    const created = {
      ...(createdMeta && typeof createdMeta === 'object' ? createdMeta : null),
      value: createdValue,
      label: createdLabel,
    };

    setExtraOptions((prev) => {
      if (prev.some((opt) => String(opt.value) === String(created.value))) return prev;
      return [...prev, created];
    });

    if (onChange) onChange(created.value);
    setIsOpen(false);
    setIsDirty(false);
    setQuery(created.label);
    lastUserInputRef.current = '';
    setActiveIndex(-1);
  };

  return (
    <div className={`form-field ${className}`} ref={rootRef}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}

      <div className={`searchable-select ${disabled ? 'is-disabled' : ''}`}>
        <input
          className="form-input searchable-select-input"
          value={inputValue}
          ref={inputRef}
          onChange={(e) => {
            if (isEditingSelected) {
              // Em modo edição, não tenta autocompletar nem abrir a lista.
              setIsDirty(true);
              setQuery(e.target.value);
              return;
            }

            const nextRaw = e.target.value;
            const prevRaw = lastUserInputRef.current;
            lastUserInputRef.current = nextRaw;

            setIsDirty(true);
            if (!isOpen) setIsOpen(true);

            const didInsert = nextRaw.length > prevRaw.length;
            const normalizedNext = normalizeText(nextRaw);
            const match = didInsert && normalizedNext
              ? allOptions.find((opt) => normalizeText(opt.label).startsWith(normalizedNext))
              : null;

            if (match) {
              setQuery(match.label);
              requestAnimationFrame(() => {
                const el = inputRef.current;
                if (!el) return;
                try {
                  el.setSelectionRange(nextRaw.length, match.label.length);
                } catch {
                  // ignore
                }
              });
              return;
            }

            setQuery(nextRaw);
          }}
          onKeyDown={(e) => {
            if (disabled) return;

            if (e.key === 'Escape') {
              if (isOpen) {
                e.preventDefault();
                setIsOpen(false);
                setIsDirty(false);
                setQuery('');
                setActiveIndex(-1);
                setIsEditingSelected(false);
                setEditingTarget(null);
              }
              if (isEditingSelected) {
                e.preventDefault();
                setIsEditingSelected(false);
                setEditingTarget(null);
                setIsDirty(false);
                setQuery('');
                lastUserInputRef.current = '';
              }
              return;
            }

            if (e.key === 'Tab') {
              const el = inputRef.current;
              if (el && el.selectionStart !== el.selectionEnd) {
                // Accept current completion (keep focus). Tab again to move focus.
                e.preventDefault();
                const end = el.selectionEnd;
                requestAnimationFrame(() => {
                  try {
                    el.setSelectionRange(end, end);
                  } catch {
                    // ignore
                  }
                });
                return;
              }

              const raw = String((isDirty ? query : selectedLabel) || '');
              const normalizedRaw = normalizeText(raw);
              if (!normalizedRaw) return;

              const match = allOptions.find((opt) => normalizeText(opt.label).startsWith(normalizedRaw));
              if (match && match.label !== raw) {
                e.preventDefault();
                setIsDirty(true);
                setQuery(match.label);
                requestAnimationFrame(() => {
                  const input = inputRef.current;
                  if (!input) return;
                  try {
                    input.setSelectionRange(match.label.length, match.label.length);
                  } catch {
                    // ignore
                  }
                });
              }
              return;
            }

            if (e.key === 'Enter') {
              if (isEditingSelected) {
                e.preventDefault();
                if (canSaveEdit) confirmEditingSelected();
                return;
              }

              if (visibleOptions.length > 0) {
                e.preventDefault();
                const idx = activeIndex >= 0 ? activeIndex : 0;
                handleSelect(visibleOptions[idx] || visibleOptions[0]);
                return;
              }

              if (shouldShowConfirm) {
                e.preventDefault();
                handleConfirm();
              }
            }
          }}
          onFocus={() => {
            if (disabled) return;
            if (isEditingSelected) return;
            setIsOpen(true);
            const next = computeDropdownStyle();
            if (next) setDropdownStyle(next);
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-expanded={isOpen}
        />

        <button
          type="button"
          className="searchable-select-btn"
          onClick={() => {
            if (disabled) return;
            if (isEditingSelected) {
              setIsEditingSelected(false);
              setEditingTarget(null);
              setIsDirty(false);
              setQuery('');
              lastUserInputRef.current = '';
            }
            setIsOpen((prev) => {
              const nextOpen = !prev;
              if (nextOpen) {
                const next = computeDropdownStyle();
                if (next) setDropdownStyle(next);
              } else {
                setActiveIndex(-1);
              }
              return nextOpen;
            });
          }}
          disabled={disabled}
          title="Abrir lista"
        >
          <ChevronDown size={16} />
        </button>

        {shouldShowEditIcon && (
          <button
            type="button"
            className="searchable-select-btn is-edit"
            onClick={startEditingSelected}
            disabled={disabled}
            title="Editar selecionado"
          >
            <Pencil size={16} />
          </button>
        )}

        {isEditingSelected && (
          <button
            type="button"
            className="searchable-select-btn is-confirm"
            onClick={confirmEditingSelected}
            disabled={disabled || !canSaveEdit}
            title="Salvar edição"
          >
            <Check size={21} strokeWidth={1.6} />
            <span className="searchable-select-confirm-label">Salvar</span>
          </button>
        )}

        {shouldShowConfirm && (
          <button
            type="button"
            className="searchable-select-btn is-confirm"
            onClick={handleConfirm}
            disabled={disabled || creating}
            title="Salvar novo"
          >
            <Check size={21} strokeWidth={1.6} />
            <span className="searchable-select-confirm-label">Cadastrar</span>
          </button>
        )}

        {isOpen && typeof document !== 'undefined' && createPortal(
          <div
            className={`searchable-select-dropdown${isInCaseDetailWrapper ? ' searchable-select-dropdown--detail' : ''}`}
            role="listbox"
            ref={dropdownRef}
            style={dropdownStyle || computeDropdownStyle() || { position: 'fixed', top: 0, left: 0, width: 320, zIndex: 9999 }}
          >
            {visibleOptions.length === 0 ? (
              <div className="searchable-select-empty">Nenhum item encontrado</div>
            ) : (
              visibleOptions.map((opt) => (
                <button
                  type="button"
                  key={String(opt.value)}
                  className={`searchable-select-item ${(String(opt.value) === String(value) && !suppressSelectedStyle) ? 'is-selected' : ''} ${visibleOptions[activeIndex]?.value === opt.value ? 'is-active' : ''}`}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => {
                    const idx = visibleOptions.findIndex((o) => String(o.value) === String(opt.value));
                    if (idx >= 0) setActiveIndex(idx);
                  }}
                  ref={(el) => {
                    const map = optionRefs.current;
                    const k = String(opt.value);
                    if (!map) return;
                    if (el) map.set(k, el);
                    else map.delete(k);
                  }}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

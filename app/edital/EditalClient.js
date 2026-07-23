'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const STATUS_CYCLE = ['naoEstudado', 'visto', 'dominado'];

const STATUS_CONFIG = {
  naoEstudado: { label: 'Não Estudado', emoji: '❌', classModifier: 'pendente' },
  visto: { label: 'Visto', emoji: '🔄', classModifier: 'visto' },
  dominado: { label: 'Dominado', emoji: '✅', classModifier: 'dominado' },
};

function getStorageKey(username) {
  return `edital-status-${username || 'guest'}`;
}

function loadEditalStatus(username) {
  try {
    const raw = localStorage.getItem(getStorageKey(username));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEditalStatus(username, statusMap) {
  try {
    localStorage.setItem(getStorageKey(username), JSON.stringify(statusMap));
  } catch {
    // Storage full or unavailable
  }
}

export default function EditalClient({ disciplinas }) {
  const { data: session } = useSession();
  const username = session?.user?.name;

  const [topicStatus, setTopicStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collapsedDisciplines, setCollapsedDisciplines] = useState({});
  const [mounted, setMounted] = useState(false);

  // Carrega o progresso do usuário no localStorage
  useEffect(() => {
    if (username) {
      setTopicStatus(loadEditalStatus(username));
    }
    setMounted(true);
  }, [username]);

  // Alterna o status de um tópico (❌ -> 🔄 -> ✅ -> ❌)
  const cycleStatus = useCallback(
    (topicId) => {
      setTopicStatus((prev) => {
        const current = prev[topicId] || 'naoEstudado';
        const nextIndex = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
        const nextStatus = STATUS_CYCLE[nextIndex];
        const updated = { ...prev, [topicId]: nextStatus };
        saveEditalStatus(username, updated);
        return updated;
      });
    },
    [username]
  );

  // Alterna expansão de uma disciplina
  const toggleCollapse = useCallback((discId) => {
    setCollapsedDisciplines((prev) => ({
      ...prev,
      [discId]: !prev[discId],
    }));
  }, []);

  // Coleta todos os tópicos válidos (excluindo subcabeçalhos)
  const allItems = useMemo(() => {
    const items = [];
    disciplinas.forEach((disc) => {
      disc.topicos.forEach((top) => {
        if (!top.isHeader) {
          items.push({ ...top, discId: disc.id, discNome: disc.nome });
        }
      });
    });
    return items;
  }, [disciplinas]);

  // Estatísticas agregadas
  const stats = useMemo(() => {
    let dominado = 0;
    let visto = 0;
    let naoEstudado = 0;

    allItems.forEach((item) => {
      const st = topicStatus[item.id] || 'naoEstudado';
      if (st === 'dominado') dominado++;
      else if (st === 'visto') visto++;
      else naoEstudado++;
    });

    const total = allItems.length;
    const dominadoPct = total > 0 ? Math.round((dominado / total) * 100) : 0;
    const vistoPct = total > 0 ? Math.round((visto / total) * 100) : 0;
    const pendentePct = total > 0 ? Math.round((naoEstudado / total) * 100) : 0;
    const coberturaTotalPct = total > 0 ? Math.round(((dominado + visto) / total) * 100) : 0;

    return {
      total,
      dominado,
      visto,
      naoEstudado,
      dominadoPct,
      vistoPct,
      pendentePct,
      coberturaTotalPct,
    };
  }, [allItems, topicStatus]);

  // Filtra disciplinas e tópicos com base na busca e filtro de status
  const filteredDisciplinas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return disciplinas.map((disc) => {
      const filteredTopicos = disc.topicos.filter((top) => {
        if (top.isHeader) return true; // Mantém subcabeçalhos

        // Filtro de status
        const st = topicStatus[top.id] || 'naoEstudado';
        if (statusFilter !== 'all' && st !== statusFilter) return false;

        // Filtro de busca por texto
        if (term && !top.texto.toLowerCase().includes(term) && !disc.nome.toLowerCase().includes(term)) {
          return false;
        }

        return true;
      });

      // Remove subcabeçalhos que ficaram órfãos sem nenhum item abaixo
      const hasActualItems = filteredTopicos.some((t) => !t.isHeader);

      return {
        ...disc,
        topicos: hasActualItems ? filteredTopicos : [],
      };
    }).filter((disc) => disc.topicos.length > 0);
  }, [disciplinas, topicStatus, statusFilter, searchTerm]);

  if (!mounted) return null;

  return (
    <div className="edital-page page-fade-in">
      {/* Overview & Stats Card */}
      <div className="glass-card edital-overview">
        <h2 className="edital-overview__title">📊 Progresso Geral no Edital</h2>

        <div className="edital-overview__stats">
          <div className="edital-stat edital-stat--dominado">
            <span className="edital-stat__value">{stats.dominado}</span>
            <span className="edital-stat__label">✅ Dominados</span>
          </div>
          <div className="edital-stat edital-stat--visto">
            <span className="edital-stat__value">{stats.visto}</span>
            <span className="edital-stat__label">🔄 Vistos</span>
          </div>
          <div className="edital-stat edital-stat--pendente">
            <span className="edital-stat__value">{stats.naoEstudado}</span>
            <span className="edital-stat__label">❌ Pendentes</span>
          </div>
          <div className="edital-stat">
            <span className="edital-stat__value">{stats.total}</span>
            <span className="edital-stat__label">📋 Total de Tópicos</span>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="edital-progress">
          <div className="edital-progress-bar">
            <div
              className="edital-progress-fill edital-progress-fill--dominado"
              style={{ width: `${stats.dominadoPct}%` }}
              title={`${stats.dominadoPct}% Dominado`}
            />
            <div
              className="edital-progress-fill edital-progress-fill--visto"
              style={{ width: `${stats.vistoPct}%` }}
              title={`${stats.vistoPct}% Visto`}
            />
          </div>
          <div className="edital-progress-labels">
            <span>{stats.dominadoPct}% dominado</span>
            <span>{stats.coberturaTotalPct}% cobertura total ({stats.dominado + stats.visto}/{stats.total})</span>
            <span>{stats.pendentePct}% pendente</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="edital-toolbar glass-card">
        <div className="edital-search">
          <span className="edital-search-icon">🔍</span>
          <input
            type="text"
            className="form-input edital-search-input"
            placeholder="Pesquisar por assunto ou lei no edital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="edital-search-clear" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="edital-status-filters">
          <button
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('all')}
          >
            Todos ({stats.total})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'dominado' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('dominado')}
          >
            ✅ Dominados ({stats.dominado})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'visto' ? 'btn-warning' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('visto')}
          >
            🔄 Vistos ({stats.visto})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'naoEstudado' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('naoEstudado')}
          >
            ❌ Pendentes ({stats.naoEstudado})
          </button>
        </div>
      </div>

      {/* Disciplines List */}
      <div className="edital-disciplines">
        {filteredDisciplinas.length === 0 ? (
          <div className="glass-card empty-state">
            <span className="empty-state-icon">🔍</span>
            <p className="empty-state-title">Nenhum tópico encontrado</p>
            <p className="empty-state-text">Tente alterar os termos da busca ou ajustar os filtros de status.</p>
          </div>
        ) : (
          filteredDisciplinas.map((disc) => {
            const isCollapsed = !!collapsedDisciplines[disc.id];

            // Stats desta disciplina
            const discItems = disc.topicos.filter((t) => !t.isHeader);
            const discDominado = discItems.filter((t) => (topicStatus[t.id] || 'naoEstudado') === 'dominado').length;
            const discVisto = discItems.filter((t) => (topicStatus[t.id] || 'naoEstudado') === 'visto').length;
            const discTotal = discItems.length;
            const discPct = discTotal > 0 ? Math.round(((discDominado + discVisto) / discTotal) * 100) : 0;

            return (
              <div key={disc.id} className="glass-card edital-discipline">
                {/* Header da Disciplina */}
                <div className="edital-discipline__header" onClick={() => toggleCollapse(disc.id)}>
                  <div className="edital-discipline__info">
                    <h3 className="edital-discipline__name">{disc.nome}</h3>
                    <span className="edital-discipline__count">
                      {discDominado + discVisto}/{discTotal} tópicos vistos ({discPct}%)
                    </span>
                  </div>

                  <div className="edital-discipline__actions">
                    <div className="edital-discipline__progress-mini">
                      <div
                        className="edital-discipline__progress-fill"
                        style={{ width: `${discPct}%` }}
                      />
                    </div>
                    <span className="edital-discipline__chevron">{isCollapsed ? '▶' : '▼'}</span>
                  </div>
                </div>

                {/* Tópicos da Disciplina */}
                {!isCollapsed && (
                  <div className="edital-discipline__topics">
                    {disc.topicos.map((top) => {
                      if (top.isHeader) {
                        return (
                          <div key={top.id} className="edital-topic-header">
                            📌 {top.texto}
                          </div>
                        );
                      }

                      const st = topicStatus[top.id] || 'naoEstudado';
                      const cfg = STATUS_CONFIG[st];

                      return (
                        <div
                          key={top.id}
                          className={`edital-topic edital-topic--${cfg.classModifier}`}
                          onClick={() => cycleStatus(top.id)}
                          role="button"
                          tabIndex={0}
                          aria-label={`${top.texto} — Status atual: ${cfg.label}. Clique para alterar.`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              cycleStatus(top.id);
                            }
                          }}
                        >
                          <span
                            className={`edital-status-btn edital-status-btn--${cfg.classModifier}`}
                            title={`Status: ${cfg.label}. Clique para alterar.`}
                          >
                            <span>{cfg.emoji}</span>
                            <span className="edital-status-label">{cfg.label}</span>
                          </span>

                          <span className="edital-topic__text">{top.texto}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

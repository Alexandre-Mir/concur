'use client';

import { useState } from 'react';

const STATUS_CONFIG = {
  dominado: { label: 'Dominado', emoji: '✅', className: 'topic-row--dominado', badgeClass: 'topic-badge--dominado' },
  visto: { label: 'Visto', emoji: '🔄', className: 'topic-row--visto', badgeClass: 'topic-badge--visto' },
  naoEstudado: { label: 'Pendente', emoji: '❌', className: 'topic-row--pendente', badgeClass: 'topic-badge--pendente' },
};

export default function TopicMatrix({ domainData }) {
  const [collapsedAreas, setCollapsedAreas] = useState({});

  if (!domainData || !domainData.areas || domainData.areas.length === 0) {
    return (
      <div className="glass-card topic-matrix-empty">
        <p>📋 Nenhum mapa de tópicos disponível.</p>
      </div>
    );
  }

  const { areas, stats } = domainData;
  const totalTopics = stats.total || 1;
  const dominadoPct = Math.round((stats.dominado / totalTopics) * 100);
  const vistoPct = Math.round((stats.visto / totalTopics) * 100);
  const pendentePct = Math.round((stats.naoEstudado / totalTopics) * 100);
  const coberturaTotal = Math.round(((stats.dominado + stats.visto) / totalTopics) * 100);

  const toggleArea = (areaNome) => {
    setCollapsedAreas((prev) => ({
      ...prev,
      [areaNome]: !prev[areaNome],
    }));
  };

  return (
    <div className="topic-matrix-v2">
      {/* Overview Card */}
      <div className="glass-card topic-matrix__overview">
        <div className="topic-matrix__header">
          <div>
            <h3 className="topic-matrix__title">🗺️ Mapa de Domínio do Edital</h3>
            <p className="text-sm text-secondary">
              Acompanhamento sistemático do conteúdo programático por disciplina
            </p>
          </div>

          <div className="topic-matrix__total-badge">
            <span className="topic-matrix__total-pct">{coberturaTotal}%</span>
            <span className="topic-matrix__total-lbl">Cobertura Geral</span>
          </div>
        </div>

        <div className="topic-matrix__stats-grid">
          <div className="topic-matrix__stat topic-matrix__stat--dominado">
            <span className="topic-matrix__stat-value">{stats.dominado}</span>
            <span className="topic-matrix__stat-label">✅ Dominados</span>
          </div>
          <div className="topic-matrix__stat topic-matrix__stat--visto">
            <span className="topic-matrix__stat-value">{stats.visto}</span>
            <span className="topic-matrix__stat-label">🔄 Vistos</span>
          </div>
          <div className="topic-matrix__stat topic-matrix__stat--pendente">
            <span className="topic-matrix__stat-value">{stats.naoEstudado}</span>
            <span className="topic-matrix__stat-label">❌ Pendentes</span>
          </div>
          <div className="topic-matrix__stat">
            <span className="topic-matrix__stat-value">{stats.total}</span>
            <span className="topic-matrix__stat-label">📋 Total Tópicos</span>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="topic-matrix__progress-wrapper">
          <div className="topic-matrix__progress-bar">
            <div
              className="topic-matrix__progress-fill topic-matrix__progress-fill--dominado"
              style={{ width: `${dominadoPct}%` }}
              title={`${dominadoPct}% Dominado`}
            />
            <div
              className="topic-matrix__progress-fill topic-matrix__progress-fill--visto"
              style={{ width: `${vistoPct}%` }}
              title={`${vistoPct}% Visto`}
            />
          </div>
          <div className="topic-matrix__progress-labels">
            <span>{dominadoPct}% dominado</span>
            <span>{coberturaTotal}% cobertura ({stats.dominado + stats.visto}/{stats.total})</span>
            <span>{pendentePct}% pendente</span>
          </div>
        </div>
      </div>

      {/* Disciplines Accordion List */}
      <div className="topic-matrix__areas-list">
        {areas.map((area) => {
          if (!area.topicos || area.topicos.length === 0) return null;

          const isCollapsed = !!collapsedAreas[area.nome];
          const areaTotal = area.topicos.length;
          const areaDominado = area.topicos.filter((t) => t.status === 'dominado').length;
          const areaVisto = area.topicos.filter((t) => t.status === 'visto').length;
          const areaPct = Math.round(((areaDominado + areaVisto) / areaTotal) * 100);

          return (
            <div key={area.nome} className="glass-card topic-area-card">
              {/* Area Header */}
              <div className="topic-area-card__header" onClick={() => toggleArea(area.nome)}>
                <div className="topic-area-card__info">
                  <h4 className="topic-area-card__title">{area.nome}</h4>
                  <span className="topic-area-card__meta">
                    {areaDominado + areaVisto} de {areaTotal} tópicos cobertos ({areaPct}%)
                  </span>
                </div>

                <div className="topic-area-card__actions">
                  <div className="topic-area-card__progress-mini">
                    <div
                      className="topic-area-card__progress-fill"
                      style={{ width: `${areaPct}%` }}
                    />
                  </div>
                  <span className="topic-area-card__chevron">{isCollapsed ? '▶' : '▼'}</span>
                </div>
              </div>

              {/* Area Progress Bar */}
              <div className="topic-area-card__bar">
                <div
                  className="topic-area-card__bar-fill"
                  style={{ width: `${areaPct}%` }}
                />
              </div>

              {/* Topics List */}
              {!isCollapsed && (
                <div className="topic-area-card__topics-grid">
                  {area.topicos.map((topico) => {
                    const cfg = STATUS_CONFIG[topico.status] || STATUS_CONFIG.naoEstudado;
                    return (
                      <div
                        key={topico.nome}
                        className={`topic-row ${cfg.className}`}
                        title={`${topico.nome} — ${cfg.label}`}
                      >
                        <span className={`topic-row__badge ${cfg.badgeClass}`}>
                          <span>{cfg.emoji}</span>
                          <span>{cfg.label}</span>
                        </span>
                        <span className="topic-row__text">{topico.nome}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

const STATUS_CONFIG = {
  dominado: { label: 'Dominado', emoji: '✅', className: 'topic-badge--dominado' },
  visto: { label: 'Visto', emoji: '🔄', className: 'topic-badge--visto' },
  naoEstudado: { label: 'Não Estudado', emoji: '❌', className: 'topic-badge--pendente' },
};

/**
 * TopicMatrix — Visual topic domain map.
 * @param {{ domainData: { areas: Array, stats: object } }} props
 */
export default function TopicMatrix({ domainData }) {
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

  return (
    <div className="topic-matrix">
      {/* Overall stats */}
      <div className="glass-card topic-matrix__overview">
        <h3 className="topic-matrix__title">📋 Cobertura do Edital</h3>
        <div className="topic-matrix__stats">
          <div className="topic-matrix__stat topic-matrix__stat--dominado">
            <span className="topic-matrix__stat-value">{stats.dominado}</span>
            <span className="topic-matrix__stat-label">Dominado</span>
          </div>
          <div className="topic-matrix__stat topic-matrix__stat--visto">
            <span className="topic-matrix__stat-value">{stats.visto}</span>
            <span className="topic-matrix__stat-label">Visto</span>
          </div>
          <div className="topic-matrix__stat topic-matrix__stat--pendente">
            <span className="topic-matrix__stat-value">{stats.naoEstudado}</span>
            <span className="topic-matrix__stat-label">Pendente</span>
          </div>
          <div className="topic-matrix__stat">
            <span className="topic-matrix__stat-value">{stats.total}</span>
            <span className="topic-matrix__stat-label">Total</span>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="topic-matrix__progress-bar">
          <div
            className="topic-matrix__progress-fill topic-matrix__progress-fill--dominado"
            style={{ width: `${dominadoPct}%` }}
          />
          <div
            className="topic-matrix__progress-fill topic-matrix__progress-fill--visto"
            style={{ width: `${vistoPct}%` }}
          />
          <div
            className="topic-matrix__progress-fill topic-matrix__progress-fill--pendente"
            style={{ width: `${pendentePct}%` }}
          />
        </div>
        <div className="topic-matrix__progress-labels">
          <span>{dominadoPct}% dominado</span>
          <span>{vistoPct}% visto</span>
          <span>{pendentePct}% pendente</span>
        </div>
      </div>

      {/* Areas */}
      {areas.map((area) => {
        if (!area.topicos || area.topicos.length === 0) return null;

        const areaTotal = area.topicos.length;
        const areaDominado = area.topicos.filter((t) => t.status === 'dominado').length;
        const areaVisto = area.topicos.filter((t) => t.status === 'visto').length;
        const areaPct = Math.round(((areaDominado + areaVisto) / areaTotal) * 100);

        return (
          <div key={area.nome} className="glass-card topic-area">
            <div className="topic-area__header">
              <h4 className="topic-area__name">{area.nome}</h4>
              <span className="topic-area__count">
                {areaDominado + areaVisto}/{areaTotal}
              </span>
            </div>

            {/* Area progress bar */}
            <div className="topic-area__progress">
              <div
                className="topic-area__progress-fill"
                style={{ width: `${areaPct}%` }}
              />
            </div>

            {/* Topic badges */}
            <div className="topic-area__badges">
              {area.topicos.map((topico) => {
                const cfg = STATUS_CONFIG[topico.status] || STATUS_CONFIG.naoEstudado;
                return (
                  <span
                    key={topico.nome}
                    className={`topic-badge ${cfg.className}`}
                    title={`${topico.nome} — ${cfg.label}`}
                  >
                    <span className="topic-badge__emoji">{cfg.emoji}</span>
                    <span className="topic-badge__text">{topico.nome}</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

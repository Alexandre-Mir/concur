'use client';

import { useState } from 'react';
import StudyLogViewer from '@/components/StudyLogViewer';

/**
 * EstudosClient — client component managing log filters and collapse/expand logic.
 *
 * @param {object} props
 * @param {Array} props.logs - list of parsed logs
 */
export default function EstudosClient({ logs }) {
  const [expandedSlug, setExpandedSlug] = useState(null);

  if (logs.length === 0) {
    return (
      <div className="glass-card empty-state">
        <p>📖 Nenhuma sessão de estudo registrada ainda.</p>
      </div>
    );
  }

  function toggleExpand(slug) {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  }

  return (
    <div className="estudos-list">
      {logs.map((log) => {
        const isExpanded = expandedSlug === log.slug;
        const scoreClass =
          log.scorePercent != null
            ? log.scorePercent >= 80
              ? 'score-badge--high'
              : log.scorePercent >= 60
              ? 'score-badge--mid'
              : 'score-badge--low'
            : '';

        return (
          <div key={log.slug} className={`glass-card log-item${isExpanded ? ' log-item--expanded' : ''}`}>
            {/* Header toggle */}
            <div className="log-item__header" onClick={() => toggleExpand(log.slug)}>
              <div className="log-item__meta">
                <span className="log-item__date">📅 {log.data || 'Sem data'}</span>
                <span className="log-item__fase">{log.fase || 'Sem fase'}</span>
              </div>
              <div className="log-item__actions">
                {log.score && (
                  <span className={`score-badge ${scoreClass}`}>
                    {log.score}
                  </span>
                )}
                <span className="log-item__chevron">{isExpanded ? '▼' : '▶'}</span>
              </div>
            </div>

            {/* Foco topic (always visible when collapsed/expanded) */}
            {!isExpanded && log.foco && (
              <p className="log-item__foco">{log.foco}</p>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="log-item__content">
                <StudyLogViewer content={log.content} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

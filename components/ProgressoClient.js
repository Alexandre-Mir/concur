'use client';

import { useMemo } from 'react';
import ProgressChart from '@/components/ProgressChart';
import TopicMatrix from '@/components/TopicMatrix';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{d.nome}</p>
      <p className="chart-tooltip__row">
        <span>Cobertura:</span> <strong>{d.cobertura}%</strong>
      </p>
    </div>
  );
}

export default function ProgressoClient({
  logs,
  evolutionData,
  domainData,
  phaseStats,
  areaChartData,
}) {
  const reversedLogs = useMemo(() => [...logs].reverse(), [logs]);
  return (
    <>
      {/* Evolution chart (larger) */}
      <ProgressChart data={evolutionData} />

      {/* Area coverage bar chart */}
      {areaChartData.length > 0 && (
        <div className="glass-card chart-container">
          <h3 className="chart-container__title">📊 Cobertura por Área</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={areaChartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="nome"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, angle: -35, textAnchor: 'end' }}
                tickLine={false}
                interval={0}
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="cobertura" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats breakdown by phase */}
      {phaseStats.length > 0 && (
        <div className="glass-card">
          <h3 className="section-title">📈 Desempenho por Fase</h3>
          <div className="phase-stats-grid">
            {phaseStats.map((ps) => (
              <div key={ps.fase} className="phase-stat-card">
                <span className="phase-stat-card__fase">{ps.fase}</span>
                <span className="phase-stat-card__value">{ps.media}%</span>
                <span className="phase-stat-card__count">{ps.count} sessão(ões)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic matrix (expanded) */}
      <TopicMatrix domainData={domainData} />

      {/* Full session table */}
      <div className="glass-card">
        <h3 className="section-title">📋 Histórico Completo de Sessões</h3>
        {logs.length === 0 ? (
          <p className="empty-text">Nenhuma sessão registrada.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Fase</th>
                  <th>Foco</th>
                  <th>Resultado</th>
                  <th>Acerto</th>
                </tr>
              </thead>
              <tbody>
                {reversedLogs.map((log) => (
                    <tr key={log.slug}>
                      <td>{log.data || '—'}</td>
                      <td>{log.fase || '—'}</td>
                      <td>{log.foco || '—'}</td>
                      <td>{log.score || '—'}</td>
                      <td>
                        {log.scorePercent != null ? (
                          <span
                            className={`score-badge ${
                              log.scorePercent >= 80
                                ? 'score-badge--high'
                                : log.scorePercent >= 60
                                ? 'score-badge--mid'
                                : 'score-badge--low'
                            }`}
                          >
                            {log.scorePercent}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

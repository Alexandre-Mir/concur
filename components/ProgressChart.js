'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">Sessão {entry.sessao}</p>
      <p className="chart-tooltip__row">
        <span>Data:</span> <strong>{entry.data}</strong>
      </p>
      <p className="chart-tooltip__row">
        <span>Fase:</span> <strong>{entry.fase}</strong>
      </p>
      <p className="chart-tooltip__row">
        <span>Nível:</span> <strong>{entry.nivel}</strong>
      </p>
      <p className="chart-tooltip__row">
        <span>Acerto:</span> <strong>{entry.acertoNum}%</strong>
      </p>
    </div>
  );
}

/**
 * ProgressChart — Line chart showing score evolution over sessions.
 * @param {{ data: Array<{ sessao, data, fase, nivel, acerto }> }} props
 */
export default function ProgressChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card chart-empty">
        <p>📊 Nenhum dado de evolução disponível.</p>
      </div>
    );
  }

  // Parse acerto percentage — handles "100%", "75%", etc.
  const chartData = data.map((d) => ({
    ...d,
    acertoNum: parseInt(String(d.acerto).replace('%', ''), 10) || 0,
  }));

  return (
    <div className="glass-card chart-container">
      <h3 className="chart-container__title">📊 Evolução de Desempenho</h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="sessao"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={80}
            stroke="#f59e0b"
            strokeDasharray="6 4"
            label={{
              value: 'Meta 80%',
              fill: '#f59e0b',
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />
          <Area
            type="monotone"
            dataKey="acertoNum"
            stroke="#7c3aed"
            strokeWidth={2.5}
            fill="url(#chartGradient)"
            dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#a78bfa' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import { getAllStudyLogs, getTopicDomainMap, getEvolutionData } from '@/lib/content';
import ProgressoClient from '@/components/ProgressoClient';

export const metadata = {
  title: 'Progresso — SEDES Study',
};

export default function ProgressoPage() {
  const logs = getAllStudyLogs();
  const domainData = getTopicDomainMap();
  const evolutionData = getEvolutionData();

  // Phase stats aggregation
  const phaseMap = {};
  for (const log of logs) {
    const key = log.fase || 'Sem fase';
    if (!phaseMap[key]) {
      phaseMap[key] = { fase: key, total: 0, count: 0 };
    }
    phaseMap[key].total += log.scorePercent || 0;
    phaseMap[key].count += 1;
  }
  const phaseStats = Object.values(phaseMap).map((ps) => ({
    ...ps,
    media: ps.count > 0 ? Math.round(ps.total / ps.count) : 0,
  }));

  // Area coverage for bar chart
  const areaChartData = domainData.areas
    .filter((a) => a.topicos && a.topicos.length > 0)
    .map((area) => {
      const total = area.topicos.length;
      const dominado = area.topicos.filter((t) => t.status === 'dominado').length;
      const visto = area.topicos.filter((t) => t.status === 'visto').length;
      return {
        nome: area.nome.length > 25 ? area.nome.slice(0, 22) + '…' : area.nome,
        cobertura: Math.round(((dominado + visto) / total) * 100),
      };
    });

  return (
    <div className="page-content">
      <header className="page-header">
        <h1 className="page-title">📈 Progresso</h1>
        <p className="page-subtitle">Análise detalhada do seu desempenho</p>
      </header>

      <ProgressoClient
        logs={logs}
        evolutionData={evolutionData}
        domainData={domainData}
        phaseStats={phaseStats}
        areaChartData={areaChartData}
      />
    </div>
  );
}

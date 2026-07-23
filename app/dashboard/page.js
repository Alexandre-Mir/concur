import { getAllFlashcards, getAllStudyLogs, getTopicDomainMap, getEvolutionData } from '@/lib/content';
import DashboardClient from '@/components/DashboardClient';

export const metadata = {
  title: 'Dashboard — SEDES Study',
};

export default function DashboardPage() {
  const flashcards = getAllFlashcards();
  const logs = getAllStudyLogs();
  const domainData = getTopicDomainMap();
  const evolutionData = getEvolutionData();

  const totalSessoes = logs.length;
  const totalFlashcards = flashcards.length;

  const taxaMedia =
    logs.length > 0
      ? Math.round(
          logs.reduce((sum, log) => sum + (log.scorePercent || 0), 0) / logs.length
        )
      : 0;

  const coberturaEdital =
    domainData.stats.total > 0
      ? Math.round((domainData.stats.dominado / domainData.stats.total) * 100)
      : 0;

  const recentLogs = logs.slice(-3).reverse();

  return (
    <div className="page-content">
      <header className="page-header">
        <h1 className="page-title">🏠 Dashboard</h1>
        <p className="page-subtitle">Visão geral do seu progresso</p>
      </header>

      <DashboardClient
        totalSessoes={totalSessoes}
        taxaMedia={taxaMedia}
        totalFlashcards={totalFlashcards}
        coberturaEdital={coberturaEdital}
        evolutionData={evolutionData}
        domainData={domainData}
        recentLogs={recentLogs}
      />
    </div>
  );
}

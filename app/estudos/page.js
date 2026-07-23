import { getAllStudyLogs } from '@/lib/content';
import EstudosClient from './EstudosClient';

export const metadata = {
  title: 'Logs de Estudo — SEDES Study',
};

export default function EstudosPage() {
  const logs = getAllStudyLogs();

  // Inverte os logs para mostrar o mais recente primeiro por padrão
  const sortedLogs = [...logs].reverse();

  return (
    <div className="page-content">
      <header className="page-header">
        <h1 className="page-title">📖 Logs de Estudo</h1>
        <p className="page-subtitle">Histórico completo de revisões e conteúdos</p>
      </header>

      <EstudosClient logs={sortedLogs} />
    </div>
  );
}

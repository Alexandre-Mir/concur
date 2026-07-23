'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import TopicMatrix from '@/components/TopicMatrix';
import {
  getStudyStreak,
  exportUserDataJSON,
  importUserDataJSON,
} from '@/lib/flashcards';

// Carrega o gráfico dinamicamente sem SSR para prevenir falhas de renderização gráfica
const ProgressChart = dynamic(() => import('@/components/ProgressChart'), {
  ssr: false,
  loading: () => (
    <div className="glass-card chart-container" style={{ minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p className="text-secondary text-sm">📈 Carregando gráfico de desempenho...</p>
    </div>
  ),
});

export default function DashboardClient({
  totalSessoes,
  taxaMedia,
  totalFlashcards,
  coberturaEdital,
  evolutionData,
  domainData,
  recentLogs,
}) {
  const { data: session } = useSession();
  const username = session?.user?.name;

  const [mounted, setMounted] = useState(false);
  const [backupMessage, setBackupMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const streak = useMemo(() => {
    if (!mounted || !username) return { currentStreak: 0, bestStreak: 0 };
    return getStudyStreak(username);
  }, [mounted, username]);

  const handleExport = () => {
    exportUserDataJSON(username);
    setBackupMessage({ type: 'success', text: 'Backup baixado com sucesso!' });
    setTimeout(() => setBackupMessage(null), 4000);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importUserDataJSON(username, content);
        if (res.success) {
          setBackupMessage({
            type: 'success',
            text: 'Dados restaurados com sucesso! Recarregando página...',
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setBackupMessage({ type: 'error', text: res.error });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="dashboard-wrapper page-fade-in">
      {/* Stat cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card stat-card--streak">
          <span className="stat-card__icon">🔥</span>
          <div className="stat-card__content">
            <span className="stat-card__value">
              {streak.currentStreak} <small className="text-xs text-tertiary">dias</small>
            </span>
            <span className="stat-card__label">
              Sequência (Recorde: {streak.bestStreak}d)
            </span>
          </div>
        </div>

        <div className="glass-card stat-card stat-card--sessions">
          <span className="stat-card__icon">📅</span>
          <div className="stat-card__content">
            <span className="stat-card__value">{totalSessoes}</span>
            <span className="stat-card__label">Sessões Registradas</span>
          </div>
        </div>

        <div className="glass-card stat-card stat-card--accuracy">
          <span className="stat-card__icon">🎯</span>
          <div className="stat-card__content">
            <span className="stat-card__value">{taxaMedia}%</span>
            <span className="stat-card__label">Taxa Média de Acerto</span>
          </div>
        </div>

        <div className="glass-card stat-card stat-card--flashcards">
          <span className="stat-card__icon">🃏</span>
          <div className="stat-card__content">
            <span className="stat-card__value">{totalFlashcards}</span>
            <span className="stat-card__label">Flashcards Gerados</span>
          </div>
        </div>

        <div className="glass-card stat-card stat-card--coverage">
          <span className="stat-card__icon">📋</span>
          <div className="stat-card__content">
            <span className="stat-card__value">{coberturaEdital}%</span>
            <span className="stat-card__label">Cobertura do Edital</span>
          </div>
        </div>
      </div>

      {/* Evolution chart */}
      <ProgressChart data={evolutionData} />

      {/* Topic domain map */}
      <TopicMatrix domainData={domainData} />

      {/* Recent sessions + Quick access */}
      <div className="dashboard-bottom">
        <div className="glass-card recent-sessions">
          <h3 className="section-title">📝 Sessões Recentes</h3>
          {recentLogs.length === 0 ? (
            <p className="empty-text">Nenhuma sessão registrada.</p>
          ) : (
            <ul className="recent-sessions__list">
              {recentLogs.map((log) => (
                <li key={log.slug} className="recent-sessions__item">
                  <div className="recent-sessions__info">
                    <span className="recent-sessions__date">📅 {log.data || '—'}</span>
                    <span className="recent-sessions__fase">{log.fase || '—'}</span>
                  </div>
                  <span className={`recent-sessions__score ${
                    log.scorePercent >= 80
                      ? 'score--high'
                      : log.scorePercent >= 60
                      ? 'score--medium'
                      : 'score--low'
                  }`}>
                    {log.scorePercent != null ? `${log.scorePercent}%` : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="quick-access">
          <Link href="/flashcards" className="glass-card quick-card">
            <span className="quick-card__icon">🃏</span>
            <div>
              <span className="quick-card__label">Revisar Flashcards</span>
              <p className="text-xs text-tertiary">Algoritmo Spaced Repetition (SM-2)</p>
            </div>
          </Link>
          <Link href="/simulados" className="glass-card quick-card">
            <span className="quick-card__icon">📝</span>
            <div>
              <span className="quick-card__label">Novo Simulado</span>
              <p className="text-xs text-tertiary">Questões interativas por tema</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Backup & Restauração */}
      <div className="glass-card backup-section">
        <div className="backup-section__header">
          <div>
            <h3>💾 Backup & Restauração de Dados</h3>
            <p className="text-secondary text-sm">
              Exporte seus dados do SRS e edital em formato JSON para segurança ou transferência de dispositivo.
            </p>
          </div>

          <div className="backup-section__actions">
            <button className="btn btn-secondary" onClick={handleExport}>
              💾 Baixar Backup (JSON)
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              📂 Restaurar Backup
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        {backupMessage && (
          <div
            className={`backup-section__msg ${
              backupMessage.type === 'success'
                ? 'backup-section__msg--success'
                : 'backup-section__msg--error'
            }`}
          >
            {backupMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}

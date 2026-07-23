'use client';

import { useState, useMemo, useCallback } from 'react';
import QuizQuestion from '@/components/QuizQuestion';

const QUESTION_COUNTS = [8, 15, 20];

/**
 * SimuladoClient — interactive quiz simulator with modes, filters, and scoring.
 *
 * @param {object} props
 * @param {Array} props.questions - all available quiz questions
 * @param {Array} props.allTags - unique sorted tags
 */
export default function SimuladoClient({ questions, allTags }) {
  // Setup state
  const [phase, setPhase] = useState('setup'); // 'setup' | 'running' | 'finished'
  const [mode, setMode] = useState('estudo'); // 'estudo' | 'simulado'
  const [selectedTags, setSelectedTags] = useState([]);
  const [questionCount, setQuestionCount] = useState(15);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Filter questions by selected tags
  const filteredQuestions = useMemo(() => {
    if (selectedTags.length === 0) return questions;
    return questions.filter(
      (q) => q.tags && q.tags.some((t) => selectedTags.includes(t))
    );
  }, [questions, selectedTags]);

  const handleToggleTag = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleStart = useCallback(() => {
    const pool = [...filteredQuestions];

    // Embaralha
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const count = questionCount === 0 ? pool.length : Math.min(questionCount, pool.length);
    const selected = pool.slice(0, count).map((q, i) => ({
      ...q,
      numero: i + 1,
    }));

    setQuizQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setPhase('running');
  }, [filteredQuestions, questionCount]);

  const handleAnswer = useCallback(
    (questionId, letra) => {
      setAnswers((prev) => ({ ...prev, [questionId]: letra }));

      // No modo simulado, avança automaticamente após 300ms
      if (mode === 'simulado') {
        setTimeout(() => {
          setCurrentIndex((prev) =>
            prev + 1 < quizQuestions.length ? prev + 1 : prev
          );
        }, 300);
      }
    },
    [mode, quizQuestions.length]
  );

  const handleFinish = useCallback(() => {
    setPhase('finished');
  }, []);

  const handleRestart = useCallback(() => {
    setPhase('setup');
    setQuizQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
  }, []);

  // Score calculations
  const scoreData = useMemo(() => {
    if (quizQuestions.length === 0) return null;

    let correct = 0;
    const byTema = {};

    for (const q of quizQuestions) {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.gabarito;
      if (isCorrect) correct++;

      const tema = q.tema || 'Geral';
      if (!byTema[tema]) byTema[tema] = { total: 0, correct: 0 };
      byTema[tema].total++;
      if (isCorrect) byTema[tema].correct++;
    }

    return {
      total: quizQuestions.length,
      correct,
      incorrect: quizQuestions.length - correct,
      percent: Math.round((correct / quizQuestions.length) * 100),
      byTema,
    };
  }, [quizQuestions, answers]);

  const answeredCount = Object.keys(answers).length;
  const progress = quizQuestions.length > 0
    ? Math.round((answeredCount / quizQuestions.length) * 100)
    : 0;

  // ─── SETUP SCREEN ───
  if (phase === 'setup') {
    return (
      <div className="simulado-page">
        <div className="simulado-setup">
          <h1 className="simulado-title">📝 Simulado</h1>
          <p className="simulado-subtitle">
            Configure seu simulado e teste seus conhecimentos.
          </p>

          {/* Modo */}
          <div className="simulado-section">
            <h3>Modo</h3>
            <div className="simulado-mode-toggle">
              <button
                className={`simulado-mode-btn${mode === 'estudo' ? ' active' : ''}`}
                onClick={() => setMode('estudo')}
                type="button"
              >
                📖 Estudo
                <span className="simulado-mode-desc">Resposta imediata por questão</span>
              </button>
              <button
                className={`simulado-mode-btn${mode === 'simulado' ? ' active' : ''}`}
                onClick={() => setMode('simulado')}
                type="button"
              >
                🎯 Simulado
                <span className="simulado-mode-desc">Resultado ao final</span>
              </button>
            </div>
          </div>

          {/* Número de questões */}
          <div className="simulado-section">
            <h3>Número de Questões</h3>
            <div className="simulado-count-options">
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  className={`simulado-count-btn${questionCount === n ? ' active' : ''}`}
                  onClick={() => setQuestionCount(n)}
                  type="button"
                >
                  {n}
                </button>
              ))}
              <button
                className={`simulado-count-btn${questionCount === 0 ? ' active' : ''}`}
                onClick={() => setQuestionCount(0)}
                type="button"
              >
                Todas ({filteredQuestions.length})
              </button>
            </div>
          </div>

          {/* Filtro de tags */}
          <div className="simulado-section">
            <h3>Filtrar por Tema</h3>
            <div className="simulado-tags-filter">
              {allTags.map((tag) => (
                <label key={tag} className="simulado-tag-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => handleToggleTag(tag)}
                  />
                  <span className="simulado-tag-label">{tag}</span>
                </label>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                className="simulado-clear-tags"
                onClick={() => setSelectedTags([])}
                type="button"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Info + Start */}
          <div className="simulado-start-area">
            <p className="simulado-pool-info">
              {filteredQuestions.length} questões disponíveis
            </p>
            <button
              className="simulado-start-btn"
              onClick={handleStart}
              disabled={filteredQuestions.length < 4}
              type="button"
            >
              Iniciar Simulado
            </button>
            {filteredQuestions.length < 4 && (
              <p className="simulado-warning">
                São necessárias ao menos 4 questões para iniciar.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── RUNNING SCREEN ───
  if (phase === 'running') {
    const currentQuestion = quizQuestions[currentIndex];
    const showResult = mode === 'estudo';
    const allAnswered = answeredCount >= quizQuestions.length;

    return (
      <div className="simulado-page">
        <div className="simulado-running">
          {/* Header bar */}
          <div className="simulado-header-bar">
            <span className="simulado-counter">
              {currentIndex + 1} / {quizQuestions.length}
            </span>
            <span className="simulado-mode-indicator">
              {mode === 'estudo' ? '📖 Estudo' : '🎯 Simulado'}
            </span>
            <span className="simulado-answered">
              {answeredCount} respondidas
            </span>
          </div>

          {/* Progress bar */}
          <div className="simulado-progress">
            <div
              className="simulado-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question */}
          {currentQuestion && (
            <QuizQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              showResult={showResult && answers[currentQuestion.id] !== undefined}
              userAnswer={answers[currentQuestion.id] || null}
            />
          )}

          {/* Navigation */}
          <div className="simulado-nav">
            <button
              className="simulado-nav-btn"
              onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              type="button"
            >
              ← Anterior
            </button>

            {/* Question dots */}
            <div className="simulado-dots">
              {quizQuestions.map((q, i) => (
                <button
                  key={q.id}
                  className={`simulado-dot${i === currentIndex ? ' current' : ''}${answers[q.id] ? ' answered' : ''}`}
                  onClick={() => setCurrentIndex(i)}
                  type="button"
                  title={`Questão ${i + 1}`}
                />
              ))}
            </div>

            {currentIndex < quizQuestions.length - 1 ? (
              <button
                className="simulado-nav-btn"
                onClick={() => setCurrentIndex((p) => Math.min(quizQuestions.length - 1, p + 1))}
                type="button"
              >
                Próxima →
              </button>
            ) : (
              <button
                className="simulado-finish-btn"
                onClick={handleFinish}
                disabled={!allAnswered}
                type="button"
              >
                {allAnswered ? 'Finalizar' : `Faltam ${quizQuestions.length - answeredCount}`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── FINISHED SCREEN ───
  if (phase === 'finished' && scoreData) {
    const scoreClass = scoreData.percent >= 80
      ? 'score-green'
      : scoreData.percent >= 60
        ? 'score-amber'
        : 'score-red';

    return (
      <div className="simulado-page">
        <div className="simulado-results">
          <h1 className="simulado-results-title">📊 Resultado do Simulado</h1>

          {/* Score card */}
          <div className={`simulado-score-card ${scoreClass}`}>
            <div className="simulado-score-main">
              <span className="simulado-score-percent">{scoreData.percent}%</span>
              <span className="simulado-score-fraction">
                {scoreData.correct}/{scoreData.total}
              </span>
            </div>
            <div className="simulado-score-bar-container">
              <div
                className="simulado-score-bar-fill"
                style={{ width: `${scoreData.percent}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="simulado-stats-row">
            <div className="simulado-stat">
              <span className="simulado-stat-value simulado-stat-correct">
                {scoreData.correct}
              </span>
              <span className="simulado-stat-label">Acertos</span>
            </div>
            <div className="simulado-stat">
              <span className="simulado-stat-value simulado-stat-incorrect">
                {scoreData.incorrect}
              </span>
              <span className="simulado-stat-label">Erros</span>
            </div>
            <div className="simulado-stat">
              <span className="simulado-stat-value">{scoreData.total}</span>
              <span className="simulado-stat-label">Total</span>
            </div>
          </div>

          {/* Breakdown by tema */}
          <div className="simulado-breakdown">
            <h3>Desempenho por Tema</h3>
            <div className="simulado-breakdown-list">
              {Object.entries(scoreData.byTema)
                .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
                .map(([tema, data]) => {
                  const pct = Math.round((data.correct / data.total) * 100);
                  const cls = pct >= 80 ? 'score-green' : pct >= 60 ? 'score-amber' : 'score-red';
                  return (
                    <div key={tema} className="simulado-breakdown-item">
                      <div className="simulado-breakdown-header">
                        <span className="simulado-breakdown-tema">{tema}</span>
                        <span className={`simulado-breakdown-pct ${cls}`}>
                          {data.correct}/{data.total} ({pct}%)
                        </span>
                      </div>
                      <div className="simulado-breakdown-bar">
                        <div
                          className={`simulado-breakdown-bar-fill ${cls}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Review questions (simulado mode) */}
          {mode === 'simulado' && (
            <div className="simulado-review">
              <h3>Revisão das Questões</h3>
              {quizQuestions.map((q) => (
                <QuizQuestion
                  key={q.id}
                  question={q}
                  onAnswer={() => {}}
                  showResult={true}
                  userAnswer={answers[q.id] || null}
                />
              ))}
            </div>
          )}

          {/* Restart */}
          <button
            className="simulado-restart-btn"
            onClick={handleRestart}
            type="button"
          >
            🔄 Novo Simulado
          </button>
        </div>
      </div>
    );
  }

  return null;
}

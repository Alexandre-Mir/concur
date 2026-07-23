'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import FlashcardCard from '@/components/FlashcardCard';
import {
  calculateNextReview,
  getCardsForReview,
  initializeCardState,
  getSRSStats,
  formatInterval,
  getStudyStreak,
  updateStudyStreak,
} from '@/lib/flashcards';

const RATING_BUTTONS = [
  { quality: 0, label: 'Esqueci', className: 'rating-forgot' },
  { quality: 3, label: 'Difícil', className: 'rating-hard' },
  { quality: 4, label: 'Bom', className: 'rating-good' },
  { quality: 5, label: 'Fácil', className: 'rating-easy' },
];

function getStorageKey(username) {
  return `srs-state-${username || 'guest'}`;
}

function loadSRSState(username) {
  try {
    const raw = localStorage.getItem(getStorageKey(username));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSRSState(username, state) {
  try {
    localStorage.setItem(getStorageKey(username), JSON.stringify(state));
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * Extracts all unique tags from an array of cards.
 */
function extractTags(cards) {
  const tagSet = new Set();
  for (const card of cards) {
    if (card.tags) {
      for (const tag of card.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort();
}

/**
 * Builds the study queue from cards and SRS state.
 * Separated to allow snapshotting.
 */
function buildStudyQueue(tagFilteredCards, srsState, dueOnly) {
  if (!dueOnly) return tagFilteredCards;
  const { due, newCards } = getCardsForReview(tagFilteredCards, srsState);
  return [...due, ...newCards];
}

/**
 * FlashcardDeck — full study session with SRS scheduling.
 *
 * @param {object} props
 * @param {Array} props.cards - Array of card objects
 */
export default function FlashcardDeck({ cards }) {
  const { data: session } = useSession();
  const username = session?.user?.name;

  const [srsState, setSrsState] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    incorrect: 0,
  });
  const [showComplete, setShowComplete] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [dueOnly, setDueOnly] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Snapshot of the study queue — frozen at session start to prevent
  // the queue from shrinking when srsState updates after rating a card.
  const [activeQueue, setActiveQueue] = useState([]);
  const queueInitialized = useRef(false);

  // Load SRS state from localStorage on mount
  useEffect(() => {
    if (username) {
      setSrsState(loadSRSState(username));
    }
    setMounted(true);
  }, [username]);

  // All available tags for the filter
  const allTags = useMemo(() => extractTags(cards), [cards]);

  // Filtered cards by tag
  const tagFilteredCards = useMemo(() => {
    if (!filterTag) return cards;
    return cards.filter((c) => c.tags && c.tags.includes(filterTag));
  }, [cards, filterTag]);

  // Compute the live queue (used only for initialization and filter changes)
  const liveQueue = useMemo(
    () => buildStudyQueue(tagFilteredCards, srsState, dueOnly),
    [tagFilteredCards, srsState, dueOnly]
  );

  // Initialize or reset the active queue when filters change or on first load.
  // The active queue is a snapshot that stays stable during a study session.
  useEffect(() => {
    if (!mounted) return;
    setActiveQueue(liveQueue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowComplete(false);
    setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 });
    queueInitialized.current = true;
  }, [filterTag, dueOnly, mounted]); // intentionally excludes srsState and liveQueue

  const studyQueue = activeQueue;
  const currentCard = studyQueue[currentIndex] || null;
  const totalCards = studyQueue.length;

  const stats = useMemo(
    () => getSRSStats(srsState, cards.length),
    [srsState, cards.length]
  );

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    (quality) => {
      if (!currentCard) return;

      // Get or initialize state for this card
      const cardState = srsState[currentCard.id] || initializeCardState(currentCard.id);
      const updated = calculateNextReview(cardState, quality);

      // Update SRS state
      const newSrsState = { ...srsState, [currentCard.id]: updated };
      setSrsState(newSrsState);
      saveSRSState(username, newSrsState);
      updateStudyStreak(username);

      // Update session stats
      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
        incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
      }));

      // Animate and advance
      setSlideDirection('slide-out');

      setTimeout(() => {
        setIsFlipped(false);

        if (currentIndex + 1 >= totalCards) {
          setShowComplete(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
          setSlideDirection('slide-in');

          setTimeout(() => setSlideDirection(null), 300);
        }
      }, 250);
    },
    [currentCard, currentIndex, totalCards, srsState, username]
  );

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSlideDirection(null);
    setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 });
    setShowComplete(false);
  }, []);

  // Don't render until mounted (avoids hydration mismatch with localStorage)
  if (!mounted) return null;

  // Session complete screen
  if (showComplete) {
    const accuracy =
      sessionStats.reviewed > 0
        ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
        : 0;

    return (
      <div className="deck-complete">
        <div className="deck-complete-inner">
          <div className="deck-complete-icon">🎉</div>
          <h2>Sessão Concluída!</h2>

          <div className="deck-complete-stats">
            <div className="deck-stat">
              <span className="deck-stat-value">{sessionStats.reviewed}</span>
              <span className="deck-stat-label">Revisados</span>
            </div>
            <div className="deck-stat">
              <span className="deck-stat-value deck-stat-correct">
                {sessionStats.correct}
              </span>
              <span className="deck-stat-label">Acertos</span>
            </div>
            <div className="deck-stat">
              <span className="deck-stat-value deck-stat-incorrect">
                {sessionStats.incorrect}
              </span>
              <span className="deck-stat-label">Erros</span>
            </div>
            <div className="deck-stat">
              <span className="deck-stat-value">{accuracy}%</span>
              <span className="deck-stat-label">Precisão</span>
            </div>
          </div>

          <div className="deck-complete-srs">
            <h3>Estatísticas SRS</h3>
            <ul>
              <li>
                <strong>Total revisados:</strong> {stats.totalReviewed} cartões
              </li>
              <li>
                <strong>Pendentes hoje:</strong> {stats.dueToday} cartões
              </li>
              <li>
                <strong>Novos:</strong> {stats.newCards} cartões
              </li>
              <li>
                <strong>Dominados:</strong> {stats.masteredCount} cartões
              </li>
              <li>
                <strong>Facilidade média:</strong> {stats.averageEase}
              </li>
            </ul>
          </div>

          <button className="deck-restart-btn" onClick={handleRestart}>
            Estudar Novamente
          </button>
        </div>
      </div>
    );
  }

  // No cards available
  if (totalCards === 0) {
    return (
      <div className="deck-empty">
        <div className="deck-empty-icon">📭</div>
        <h2>Nenhum cartão disponível</h2>
        <p>
          {dueOnly
            ? 'Nenhum cartão pendente para revisão. Alterne para "Todos" para estudar livremente.'
            : 'Nenhum cartão encontrado com os filtros selecionados.'}
        </p>
        {dueOnly && (
          <button className="deck-toggle-btn" onClick={() => setDueOnly(false)}>
            Mostrar Todos
          </button>
        )}
      </div>
    );
  }

  const progress = Math.round(((currentIndex) / totalCards) * 100);
  const cardSrsState = currentCard ? srsState[currentCard.id] : null;

  const streak = useMemo(() => getStudyStreak(username), [username, sessionStats.reviewed]);

  return (
    <div className="deck-container">
      {/* Toolbar */}
      <div className="deck-toolbar">
        <div className="deck-filters">
          <select
            className="deck-filter-select"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">Todas as tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          <button
            className={`deck-toggle-btn${dueOnly ? ' active' : ''}`}
            onClick={() => setDueOnly((prev) => !prev)}
          >
            {dueOnly ? '📅 Pendentes' : '📚 Todos'}
          </button>

          {streak.currentStreak > 0 && (
            <span className="streak-badge" title={`Sequência de estudos: ${streak.currentStreak} dia(s) consecutivo(s)! Recorde: ${streak.bestStreak} dia(s)`}>
              🔥 {streak.currentStreak}d
            </span>
          )}
        </div>

        <div className="deck-counter">
          Cartão {currentIndex + 1} de {totalCards}
        </div>
      </div>

      {/* Progress bar */}
      <div className="deck-progress">
        <div className="deck-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Card area */}
      <div className={`deck-card-area${slideDirection ? ` ${slideDirection}` : ''}`}>
        {currentCard && (
          <FlashcardCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        )}
      </div>

      {/* SRS info for current card */}
      {cardSrsState && (
        <div className="deck-srs-info">
          Intervalo atual: {formatInterval(cardSrsState.interval)} · Facilidade:{' '}
          {cardSrsState.ease}
        </div>
      )}

      {/* Rating buttons — only shown when card is flipped */}
      {isFlipped && (
        <div className="deck-rating-buttons">
          {RATING_BUTTONS.map(({ quality, label, className }) => (
            <button
              key={quality}
              className={`deck-rating-btn ${className}`}
              onClick={() => handleRate(quality)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Session stats bar */}
      <div className="deck-session-bar">
        <span>
          ✅ {sessionStats.correct} acertos
        </span>
        <span>
          ❌ {sessionStats.incorrect} erros
        </span>
        <span>
          📊 {sessionStats.reviewed} revisados
        </span>
      </div>
    </div>
  );
}

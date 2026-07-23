/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Card SRS state shape:
 *   { cardId, ease, interval, repetitions, nextReview, lastReview }
 *
 * Quality ratings:
 *   0 = Esqueci (forgot) — reset
 *   3 = Difícil (hard)
 *   4 = Bom (good)
 *   5 = Fácil (easy)
 */

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

/**
 * Calculate the next review date and updated SRS state after a review.
 * Implements the SM-2 algorithm by Piotr Wozniak.
 *
 * @param {object} card - Current SRS state for the card
 * @param {number} quality - Rating: 0 (forgot), 3 (hard), 4 (good), 5 (easy)
 * @returns {object} Updated SRS state
 */
export function calculateNextReview(card, quality) {
  const now = Date.now();
  let { ease, interval, repetitions } = card;

  if (quality < 3) {
    // Failed — reset to beginning
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall — advance
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  ease = Math.max(MIN_EASE, ease + delta);

  // Next review date (interval in days → ms)
  const nextReview = now + interval * 24 * 60 * 60 * 1000;

  return {
    cardId: card.cardId,
    ease: Math.round(ease * 100) / 100,
    interval,
    repetitions,
    nextReview,
    lastReview: now,
  };
}

/**
 * Get cards due for review plus new cards not yet in SRS state.
 *
 * @param {Array} allCards - Full list of card objects (must have .id)
 * @param {object} srsState - Map of cardId → SRS state
 * @returns {{ due: Array, newCards: Array }}
 */
export function getCardsForReview(allCards, srsState) {
  const now = Date.now();
  const due = [];
  const newCards = [];

  for (const card of allCards) {
    const state = srsState[card.id];

    if (!state) {
      newCards.push(card);
    } else if (state.nextReview <= now) {
      due.push(card);
    }
  }

  // Due cards first (oldest review first), then new cards
  due.sort((a, b) => srsState[a.id].nextReview - srsState[b.id].nextReview);

  return { due, newCards };
}

/**
 * Initialize SRS state for a card that hasn't been reviewed yet.
 *
 * @param {string} cardId
 * @returns {object} Initial SRS state
 */
export function initializeCardState(cardId) {
  return {
    cardId,
    ease: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    nextReview: 0,
    lastReview: null,
  };
}

/**
 * Compute aggregate SRS statistics.
 *
 * @param {object} srsState - Map of cardId → SRS state
 * @param {number} totalCards - Total number of available cards
 * @returns {object} Stats summary
 */
export function getSRSStats(srsState, totalCards = 0) {
  const now = Date.now();
  const entries = Object.values(srsState);
  const totalReviewed = entries.length;

  let dueToday = 0;
  let masteredCount = 0;
  let easeSum = 0;

  for (const entry of entries) {
    if (entry.nextReview <= now) {
      dueToday++;
    }
    // "Mastered" = interval >= 21 days (3 weeks)
    if (entry.interval >= 21) {
      masteredCount++;
    }
    easeSum += entry.ease;
  }

  const averageEase =
    totalReviewed > 0 ? Math.round((easeSum / totalReviewed) * 100) / 100 : DEFAULT_EASE;

  const newCards = totalCards > 0 ? totalCards - totalReviewed : 0;

  return {
    totalReviewed,
    dueToday,
    newCards,
    averageEase,
    masteredCount,
  };
}

/**
 * Format an interval (in days) to a human-readable Portuguese string.
 *
 * @param {number} days
 * @returns {string}
 */
export function formatInterval(days) {
  if (days === 0) return 'agora';
  if (days === 1) return '1 dia';
  if (days < 7) return `${days} dias`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 semana' : `${weeks} semanas`;
  }
  const months = Math.round(days / 30);
  return months === 1 ? '1 mês' : `${months} meses`;
}

/**
 * Gerenciamento de Study Streak (dias consecutivos de estudo).
 */
export function getStudyStreak(username) {
  if (typeof window === 'undefined') return { currentStreak: 0, bestStreak: 0, lastStudyDate: null };
  const key = `srs-streak-${username || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { currentStreak: 0, bestStreak: 0, lastStudyDate: null };
    const data = JSON.parse(raw);

    const todayStr = new Date().toISOString().slice(0, 10);
    if (data.lastStudyDate) {
      const lastDate = new Date(data.lastStudyDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        data.currentStreak = 0;
      }
    }

    return data;
  } catch {
    return { currentStreak: 0, bestStreak: 0, lastStudyDate: null };
  }
}

export function updateStudyStreak(username) {
  if (typeof window === 'undefined') return { currentStreak: 0, bestStreak: 0 };
  const key = `srs-streak-${username || 'guest'}`;
  const todayStr = new Date().toISOString().slice(0, 10);
  const current = getStudyStreak(username);

  if (current.lastStudyDate === todayStr) {
    return current;
  }

  let newCurrent = 1;
  if (current.lastStudyDate) {
    const lastDate = new Date(current.lastStudyDate);
    const todayDate = new Date(todayStr);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newCurrent = (current.currentStreak || 0) + 1;
    } else {
      newCurrent = 1;
    }
  }

  const newBest = Math.max(current.bestStreak || 0, newCurrent);
  const updated = {
    currentStreak: newCurrent,
    bestStreak: newBest,
    lastStudyDate: todayStr,
  };

  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}

  return updated;
}

/**
 * Funções de Backup e Restauração de dados do usuário (JSON)
 */
export function exportUserDataJSON(username) {
  if (typeof window === 'undefined') return;
  const user = username || 'guest';

  const srsState = localStorage.getItem(`srs-state-${user}`);
  const srsStreak = localStorage.getItem(`srs-streak-${user}`);
  const editalStatus = localStorage.getItem(`edital-status-${user}`);

  const backupObj = {
    app: 'SEDES Study',
    version: '1.0',
    exportDate: new Date().toISOString(),
    username: user,
    data: {
      srsState: srsState ? JSON.parse(srsState) : {},
      srsStreak: srsStreak ? JSON.parse(srsStreak) : {},
      editalStatus: editalStatus ? JSON.parse(editalStatus) : {},
    },
  };

  const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sedes-study-backup-${user}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importUserDataJSON(username, jsonString) {
  if (typeof window === 'undefined') return { success: false, error: 'Ambiente inválido' };
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) {
      return { success: false, error: 'Estrutura de arquivo de backup inválida.' };
    }

    const user = username || 'guest';
    const { srsState, srsStreak, editalStatus } = parsed.data;

    if (srsState) localStorage.setItem(`srs-state-${user}`, JSON.stringify(srsState));
    if (srsStreak) localStorage.setItem(`srs-streak-${user}`, JSON.stringify(srsStreak));
    if (editalStatus) localStorage.setItem(`edital-status-${user}`, JSON.stringify(editalStatus));

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Falha ao ler o arquivo JSON: ' + err.message };
  }
}


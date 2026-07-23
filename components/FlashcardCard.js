'use client';

import { useMemo } from 'react';

/**
 * Render cloze text. On the front, blanks replace {{c1::answer}}.
 * On the back, the answer is highlighted inline.
 */
function renderCloze(text, showAnswer) {
  const regex = /\{\{c\d+::(.+?)\}\}/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before the cloze
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    if (showAnswer) {
      parts.push(
        <span key={`a-${match.index}`} className="flashcard-cloze-answer">
          {match[1]}
        </span>
      );
    } else {
      parts.push(
        <span key={`b-${match.index}`} className="flashcard-cloze-blank">
          {'_'.repeat(Math.max(5, match[1].length))}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

const TYPE_BADGES = {
  cloze: { label: 'Cloze', icon: '📝' },
  reversed: { label: 'Reverso', icon: '🔄' },
  permanence: { label: 'Permanência', icon: '⭐' },
  basic: { label: 'Básico', icon: '📋' },
};

/**
 * FlashcardCard — a single flashcard with 3D flip animation.
 *
 * @param {object} props
 * @param {object} props.card - { id, tipo, frente, verso, contexto, tags }
 * @param {boolean} props.isFlipped
 * @param {function} props.onFlip
 */
export default function FlashcardCard({ card, isFlipped, onFlip }) {
  const badge = TYPE_BADGES[card.tipo] || TYPE_BADGES.basic;
  const isCloze = card.tipo === 'cloze';

  const frontContent = useMemo(() => {
    if (isCloze) return renderCloze(card.frente, false);
    return card.frente;
  }, [card.frente, isCloze]);

  const backContent = useMemo(() => {
    if (isCloze) return renderCloze(card.frente, true);
    return card.verso;
  }, [card.frente, card.verso, isCloze]);

  return (
    <div
      className={`flashcard${isFlipped ? ' flipped' : ''}`}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={`Flashcard: ${isFlipped ? 'verso' : 'frente'}. ${isFlipped ? 'Clique para ocultar' : 'Clique para revelar'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div className="flashcard-inner">
        {/* Front face */}
        <div className="flashcard-face flashcard-front">
          <div className="flashcard-badge">
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
          <div className="flashcard-content">{frontContent}</div>
          <div className="flashcard-hint">Clique para revelar</div>
        </div>

        {/* Back face */}
        <div className="flashcard-face flashcard-back">
          <div className="flashcard-badge">
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
          <div className="flashcard-content">{backContent}</div>

          {card.contexto && (
            <div className="flashcard-contexto">
              <span className="flashcard-contexto-label">Contexto:</span>
              <span>{card.contexto}</span>
            </div>
          )}

          {card.tags && card.tags.length > 0 && (
            <div className="flashcard-tags">
              {card.tags.map((tag) => (
                <span key={tag} className="flashcard-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

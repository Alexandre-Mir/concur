'use client';

import { useState } from 'react';

const TYPE_LABELS = {
  'multipla-escolha': { label: 'Múltipla Escolha', icon: '📝' },
  'julgamento': { label: 'Julgamento de Itens', icon: '⚖️' },
  'incorreta': { label: 'Assertiva Incorreta', icon: '❌' },
  'hipotetica': { label: 'Situação Hipotética', icon: '🎭' },
  'default': { label: 'Questão', icon: '📋' },
};

/**
 * QuizQuestion — interactive multiple-choice question card.
 *
 * @param {object} props
 * @param {object} props.question - { id, numero, tipo, tema, opcoes: [{letra, texto}], gabarito, fundamentacao }
 * @param {function} props.onAnswer - callback(questionId, letraEscolhida)
 * @param {boolean} props.showResult - whether to reveal correct/incorrect state
 * @param {string|null} props.userAnswer - the letter the user picked, or null
 */
export default function QuizQuestion({ question, onAnswer, showResult, userAnswer }) {
  const [expandFundamentacao, setExpandFundamentacao] = useState(false);

  const typeInfo = TYPE_LABELS[question.tipo] || TYPE_LABELS.default;
  const answered = userAnswer !== null && userAnswer !== undefined;

  function handleSelect(letra) {
    if (answered) return;
    onAnswer(question.id, letra);
  }

  function getOptionClass(letra) {
    let cls = 'quiz-option';

    if (answered && userAnswer === letra) {
      cls += ' quiz-option--selected';
    }

    if (showResult) {
      if (letra === question.gabarito) {
        cls += ' quiz-option--correct';
      } else if (userAnswer === letra && letra !== question.gabarito) {
        cls += ' quiz-option--incorrect';
      }
    }

    return cls;
  }

  return (
    <div className="quiz-question">
      {/* Header */}
      <div className="quiz-question-header">
        <span className="quiz-question-number">Questão {question.numero}</span>
        <span className="quiz-type-badge">
          {typeInfo.icon} {typeInfo.label}
        </span>
      </div>

      {/* Tema */}
      {question.tema && (
        <div className="quiz-tema-tag">{question.tema}</div>
      )}

      {/* Enunciado */}
      {question.enunciado && (
        <p className="quiz-enunciado">{question.enunciado}</p>
      )}

      {/* Opções */}
      <div className="quiz-options">
        {question.opcoes.map((opcao) => (
          <button
            key={opcao.letra}
            className={getOptionClass(opcao.letra)}
            onClick={() => handleSelect(opcao.letra)}
            disabled={answered}
            type="button"
          >
            <span className="quiz-option-letra">{opcao.letra}</span>
            <span className="quiz-option-texto">{opcao.texto}</span>
          </button>
        ))}
      </div>

      {/* Fundamentação (expandable, after answer) */}
      {showResult && question.fundamentacao && (
        <div className="quiz-fundamentacao">
          <button
            className="quiz-fundamentacao-toggle"
            onClick={() => setExpandFundamentacao((prev) => !prev)}
            type="button"
            aria-expanded={expandFundamentacao}
            aria-controls={`fundamentacao-${question.id}`}
          >
            {expandFundamentacao ? '▾' : '▸'} Fundamentação
          </button>
          {expandFundamentacao && (
            <div id={`fundamentacao-${question.id}`} className="quiz-fundamentacao-content">
              {question.fundamentacao}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

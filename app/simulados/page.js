import { getAllFlashcards } from '@/lib/content';
import SimuladoClient from './SimuladoClient';

/**
 * Converte flashcards em questões de múltipla escolha.
 * Para cada flashcard, a 'frente' é o enunciado e o 'verso' é a resposta correta.
 * Gera 3 distratores a partir de outros flashcards (priorizando mesmas tags).
 */
function buildQuizQuestions(allCards) {
  // Filtra cloze cards — não funcionam bem como múltipla escolha
  const eligible = allCards.filter((c) => c.tipo !== 'cloze' && c.verso.trim());

  if (eligible.length < 4) return [];

  // Agrupa por tags para distratores mais coerentes
  const byTag = {};
  for (const card of eligible) {
    for (const tag of card.tags) {
      if (!byTag[tag]) byTag[tag] = [];
      byTag[tag].push(card);
    }
  }

  const LETRAS = ['A', 'B', 'C', 'D', 'E'];

  return eligible.map((card, idx) => {
    // Coleta distratores: primeiro de tags similares, depois aleatórios
    const distractorPool = new Set();

    // Prioriza cards com tags em comum
    for (const tag of card.tags) {
      if (byTag[tag]) {
        for (const other of byTag[tag]) {
          if (other.id !== card.id) distractorPool.add(other);
        }
      }
    }

    // Se não tiver suficientes, pega de qualquer card
    if (distractorPool.size < 3) {
      for (const other of eligible) {
        if (other.id !== card.id) distractorPool.add(other);
        if (distractorPool.size >= 20) break;
      }
    }

    // Embaralha e pega 3 distratores únicos (sem duplicar o verso correto)
    const poolArr = Array.from(distractorPool);
    for (let i = poolArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolArr[i], poolArr[j]] = [poolArr[j], poolArr[i]];
    }

    const usedTexts = new Set([card.verso]);
    const distractors = [];
    for (const d of poolArr) {
      if (!usedTexts.has(d.verso)) {
        distractors.push(d.verso);
        usedTexts.add(d.verso);
      }
      if (distractors.length >= 3) break;
    }

    // Monta as opções usando objetos marcados para rastrear a correta
    const allOptions = [
      { texto: card.verso, isCorrect: true },
      ...distractors.map((t) => ({ texto: t, isCorrect: false })),
    ];

    // Embaralha
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    const correctIdx = allOptions.findIndex((o) => o.isCorrect);

    return {
      id: card.id,
      numero: idx + 1,
      tipo: 'multipla-escolha',
      tema: card.tags.join(', ') || 'Geral',
      enunciado: card.frente,
      opcoes: allOptions.map((o, i) => ({
        letra: LETRAS[i],
        texto: o.texto,
      })),
      gabarito: LETRAS[correctIdx],
      fundamentacao: card.contexto || null,
      tags: card.tags,
    };
  });
}

export default function SimuladosPage() {
  const allCards = getAllFlashcards();
  const questions = buildQuizQuestions(allCards);

  // Extrai tags únicas
  const tagSet = new Set();
  for (const q of questions) {
    if (q.tags) {
      for (const t of q.tags) tagSet.add(t);
    }
  }
  const allTags = Array.from(tagSet).sort();

  return <SimuladoClient questions={questions} allTags={allTags} />;
}

import { getAllFlashcards } from '@/lib/content';
import FlashcardDeck from '@/components/FlashcardDeck';

export const metadata = {
  title: 'Flashcards — SEDES Study',
};

export default function FlashcardsPage() {
  const flashcards = getAllFlashcards();

  return (
    <div className="page-content">
      <header className="page-header">
        <h1 className="page-title">
          🃏 Flashcards
          <span className="count-badge">{flashcards.length}</span>
        </h1>
        <p className="page-subtitle">Estudo inteligente com repetição espaçada</p>
      </header>

      <FlashcardDeck cards={flashcards} />
    </div>
  );
}

import { getEditalVerticalizado } from '@/lib/content';
import EditalClient from './EditalClient';

export const metadata = {
  title: 'Edital Verticalizado — SEDES Study',
};

export default function EditalPage() {
  const editalData = getEditalVerticalizado();

  return (
    <div className="page-content">
      <header className="page-header">
        <h1 className="page-title">📜 Edital Verticalizado & Metas</h1>
        <p className="page-subtitle">
          Acompanhamento individual de metas e domínio do edital
        </p>
      </header>

      <EditalClient disciplinas={editalData.disciplinas} />
    </div>
  );
}

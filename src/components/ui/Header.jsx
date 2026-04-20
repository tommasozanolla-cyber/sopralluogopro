import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header({ title, subtitle, backTo, actions }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-navy-800 text-white shadow-lg">
      <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Indietro"
            id="btn-back"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-navy-200 truncate">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

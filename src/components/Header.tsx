import type { ReactNode } from 'react';

export default function Header({ actions }: { actions?: ReactNode }) {
  return (
    <header className="bg-ink text-cream px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
      <span className="bg-clay text-white font-display font-bold text-sm px-3 py-1.5 rounded-lg shrink-0">
        Logo
      </span>

      <input
        placeholder="Buscar prendas..."
        className="flex-1 min-w-0 bg-cream/10 placeholder-cream/40 text-cream text-sm rounded-lg px-3 py-2 focus:outline-none focus:bg-cream/15"
      />

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
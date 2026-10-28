
import type { ReactNode } from 'react';
import NavMenu from './NavMenu';

interface HeaderProps {
  actions?: ReactNode;
  busqueda?: string;
  onBusquedaChange?: (valor: string) => void;
}

export default function Header({
  actions,
  busqueda,
  onBusquedaChange,
}: HeaderProps) {
  return (
    <header className="bg-[#10192E] text-[#E7ECF5] px-4 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-30 border-b border-[#253854]">
      <NavMenu />

      <div className="flex-1 min-w-0 relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B1C1D6] pointer-events-none"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>

        <input
          type="search"
          placeholder="Buscar prendas..."
          value={busqueda}
          onChange={(e) => onBusquedaChange?.(e.target.value)}
          readOnly={!onBusquedaChange}
          className="w-full bg-[#0B192D] border border-[#294768] placeholder-[#91A5BF] text-[#E7ECF5] text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#4B83D5] transition-colors"
        />
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

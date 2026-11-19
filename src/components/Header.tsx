
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NavMenu from './NavMenu';

interface HeaderProps {
  actions?: ReactNode;
  busqueda?: string;
  onBusquedaChange?: (valor: string) => void;
  mostrarBusqueda?: boolean;
  placeholderBusqueda?: string;
}

const LOGO_URL = `${import.meta.env.BASE_URL}pilched.png`;

export default function Header({
  actions,
  busqueda,
  onBusquedaChange,
  mostrarBusqueda = true,
  placeholderBusqueda = 'Buscar prendas...',
}: HeaderProps) {
  const location = useLocation();

  const rutaActual =
    location.pathname.replace(/\/+$/, '') || '/';

  const esMiPerfil = rutaActual === '/perfil';

  const mostrarBuscadorFinal =
    !esMiPerfil && mostrarBusqueda;

  const mostrarAccionesFinal =
    !esMiPerfil && Boolean(actions);

  return (
    <header
      className="
        bg-[#10192E]
        text-[#E7ECF5]
        w-full
        min-h-24
        px-4 sm:px-6
        py-3
        grid
        grid-cols-[auto_minmax(0,1fr)_auto]
        items-center
        gap-3 sm:gap-5
        sticky top-0 z-30
        border-b border-[#253854]
      "
    >

      {/* LOGO PILCHED - MISMO TAMAÑO EN TODAS LAS PÁGINAS */}
      <Link
        to="/"
        className="flex items-center shrink-0"
        aria-label="Ir al inicio de Pilched"
      >
        <img
          src={LOGO_URL}
          alt="Pilched"
          className="w-36 sm:w-44 lg:w-48 h-auto object-contain"
        />
      </Link>

      {/* BUSCADOR CENTRADO */}
      <div className="min-w-0 flex justify-center">
        {mostrarBuscadorFinal && (
          <div className="relative w-full max-w-[440px]">

            {/* ÍCONO DE BÚSQUEDA */}
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

            {/* INPUT DE BÚSQUEDA */}
            <input
              type="search"
              placeholder={placeholderBusqueda}
              value={busqueda ?? ''}
              onChange={(e) =>
                onBusquedaChange?.(e.target.value)
              }
              readOnly={!onBusquedaChange}
              aria-label={placeholderBusqueda}
              className="
                w-full min-w-0
                bg-[#0B192D]
                border border-[#294768]
                placeholder-[#91A5BF]
                text-[#E7ECF5]
                text-sm
                rounded-xl
                pl-11 pr-4 py-3
                focus:outline-none
                focus:border-[#4B83D5]
                transition-colors
              "
            />

          </div>
        )}
      </div>

      {/* ACCIONES Y MENÚ */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">

        {/* BOTONES DE ACCIONES */}
        {mostrarAccionesFinal && (
          <div className="flex items-center gap-2 sm:gap-3">
            {actions}
          </div>
        )}

        {/* MENÚ HAMBURGUESA */}
        <div className="shrink-0">
          <NavMenu />
        </div>

      </div>

    </header>
  );
}

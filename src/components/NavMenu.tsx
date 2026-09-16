import { useState } from 'react';
import { Link } from 'react-router-dom';

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/mis-publicaciones', label: 'Mis publicaciones' },
  { to: '/mis-pedidos', label: 'Mis pedidos' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/login', label: 'Iniciar sesión' },
  { to: '/crear-cuenta', label: 'Crear cuenta' },
];

export default function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full bg-cream/10 hover:bg-cream/15 flex items-center justify-center shrink-0"
        aria-label="Abrir menú"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 bg-ink/50 z-50" onClick={() => setOpen(false)}>
          <aside
            className="absolute top-0 left-0 h-full w-64 bg-forest text-cream p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-sm uppercase tracking-wide text-cream/70">Menú</span>
              <button onClick={() => setOpen(false)} className="text-cream/70" aria-label="Cerrar menú">
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="px-2 py-2 rounded-lg text-sm text-cream/90 hover:bg-cream/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

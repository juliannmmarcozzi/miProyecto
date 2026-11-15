
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const token = localStorage.getItem('token');
  const estaLogueado = Boolean(token);

  const rutaPerfil = estaLogueado ? '/perfil' : '/login';

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/mis-publicaciones', label: 'Mis publicaciones' },
    {
      to: estaLogueado ? '/mis-mensajes' : '/login',
      label: 'Mis mensajes',
    },
    { to: '/mis-pedidos', label: 'Mis pedidos' },
    { to: rutaPerfil, label: 'Perfil' },
  ];

  return (
    <>
      {/* BOTÓN HAMBURGUESA */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-11 h-11 rounded-full bg-[#1C2B49]/80 hover:bg-[#263652] text-white flex items-center justify-center transition-colors duration-150 cursor-pointer"
        aria-label="Abrir menú"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="w-5 h-5"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* MENÚ LATERAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute top-0 left-0 h-full w-64 bg-[#10182D] text-gray-200 px-5 py-6 font-sans border-r border-white/5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ENCABEZADO */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-normal text-gray-300">
                Menú
              </span>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar menú"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="w-5 h-5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* OPCIONES DEL MENÚ */}
            <nav className="flex flex-col gap-2">
              {links.map((link) => {
                const activo =
                  link.label === 'Perfil'
                    ? location.pathname === '/perfil' ||
                      location.pathname === '/login'
                    : link.label === 'Mis mensajes'
                      ? location.pathname === '/mis-mensajes' ||
                        location.pathname.startsWith('/mensajes/')
                      : location.pathname === link.to;

                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-3 rounded-md text-sm font-normal transition-colors duration-150 ${
                      activo
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000';

interface Notificacion {
  id: number;
  mensaje?: string;
  contenido?: string;
  titulo?: string;
  leida?: boolean;
}

export default function HeaderActions({
  onFilters,
  onCreate,
}: {
  onFilters: () => void;
  onCreate: () => void;
}) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function abrirNotificaciones() {
    if (!token) {
      navigate('/login');
      return;
    }

    if (notificacionesOpen) {
      setNotificacionesOpen(false);
      return;
    }

    setNotificacionesOpen(true);
    setCargando(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/mis_notificaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('No se pudieron cargar las notificaciones.');
      }

      const datos = await res.json();

      const lista = Array.isArray(datos)
        ? datos
        : datos.notificaciones;

      setNotificaciones(Array.isArray(lista) ? lista : []);
    } catch {
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onFilters}
        className="w-10 h-10 rounded-full bg-[#172A45] hover:bg-[#213C5D] flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Filtros"
      >
        <img
          src="/newpost.png"
          alt=""
          className="w-5 h-5 object-contain brightness-0 invert"
        />
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={abrirNotificaciones}
          className="w-10 h-10 rounded-full bg-[#172A45] hover:bg-[#213C5D] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Notificaciones"
          aria-expanded={notificacionesOpen}
        >
          <img
            src="/notification.png"
            alt=""
            className="w-5 h-5 object-contain brightness-0 invert"
          />
        </button>

        {notificacionesOpen && (
          <div className="absolute right-0 top-12 w-72 sm:w-80 max-w-[90vw] bg-[#0E1D32] border border-[#294768] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#294768] flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">
                Notificaciones
              </h3>

              <button
                type="button"
                onClick={() => setNotificacionesOpen(false)}
                className="text-[#A9BAD0] hover:text-white cursor-pointer"
                aria-label="Cerrar notificaciones"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {cargando ? (
                <p className="p-4 text-sm text-[#A9BAD0]">
                  Cargando...
                </p>
              ) : error ? (
                <p className="p-4 text-sm text-red-400">
                  {error}
                </p>
              ) : notificaciones.length === 0 ? (
                <p className="p-4 text-sm text-[#A9BAD0]">
                  No tenés notificaciones.
                </p>
              ) : (
                notificaciones.map((notificacion) => (
                  <div
                    key={notificacion.id}
                    className="px-4 py-3 border-b border-[#253854] last:border-0"
                  >
                    <p className="text-sm text-[#E7ECF5]">
                      {notificacion.mensaje ||
                        notificacion.contenido ||
                        notificacion.titulo ||
                        'Nueva notificación'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="w-10 h-10 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-2xl leading-none flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Crear publicación"
      >
        +
      </button>

      <Link
        to={token ? '/perfil' : '/login'}
        className="w-10 h-10 rounded-full bg-[#172A45] hover:bg-[#213C5D] flex items-center justify-center transition-colors"
        aria-label="Cuenta"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-[#E7ECF5]"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      </Link>
    </>
  );
}

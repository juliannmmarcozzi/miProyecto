
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Link, useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = import.meta.env.VITE_API_URL;

interface Conversacion {
  usuario_id: number;
  nombre_usuario: string;
  foto_perfil: string | null;
  ultimo_mensaje: string;
  fecha_ultimo_mensaje: string;
  ultimo_es_mio: boolean;
  sin_leer: number;
}

function formatearFecha(fecha: string): string {
  if (!fecha) return '';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '';
  }

  const ahora = new Date();

  if (valor.toDateString() === ahora.toDateString()) {
    return valor.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);

  if (valor.toDateString() === ayer.toDateString()) {
    return 'Ayer';
  }

  return valor.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    ...(valor.getFullYear() !== ahora.getFullYear()
      ? { year: 'numeric' as const }
      : {}),
  });
}

export default function MisMensajes() {
  const navigate = useNavigate();

  const [conversaciones, setConversaciones] =
    useState<Conversacion[]>([]);

  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const consultandoRef = useRef(false);

  const cargarConversaciones = useCallback(
    async (mostrarCarga = false) => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      if (consultandoRef.current) return;

      consultandoRef.current = true;

      if (mostrarCarga) {
        setCargando(true);
      }

      try {
        const res = await fetch(
          `${API_URL}/mis_conversaciones`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error(
            'No se pudieron cargar los mensajes.'
          );
        }

        const resultado = await res.json();

        if (!Array.isArray(resultado)) {
          throw new Error(
            'El servidor devolvió datos inválidos.'
          );
        }

        const datos: Conversacion[] = resultado.map(
          (item) => ({
            usuario_id: Number(item.usuario_id),
            nombre_usuario: String(
              item.nombre_usuario ?? 'Usuario'
            ),
            foto_perfil: item.foto_perfil ?? null,
            ultimo_mensaje: String(
              item.ultimo_mensaje ?? ''
            ),
            fecha_ultimo_mensaje: String(
              item.fecha_ultimo_mensaje ?? ''
            ),
            ultimo_es_mio: item.ultimo_es_mio === true,
            sin_leer: Number(item.sin_leer) || 0,
          })
        );

        setConversaciones(datos);
        setError('');
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los mensajes.'
        );
      } finally {
        consultandoRef.current = false;
        setCargando(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    void cargarConversaciones(true);

    const intervalo = window.setInterval(() => {
      if (!document.hidden) {
        void cargarConversaciones();
      }
    }, 10000);

    function actualizarAlVolver() {
      if (!document.hidden) {
        void cargarConversaciones();
      }
    }

    document.addEventListener(
      'visibilitychange',
      actualizarAlVolver
    );

    return () => {
      window.clearInterval(intervalo);

      document.removeEventListener(
        'visibilitychange',
        actualizarAlVolver
      );
    };
  }, [cargarConversaciones]);

  const termino = busqueda
    .trim()
    .toLocaleLowerCase('es-AR');

  const conversacionesFiltradas =
    conversaciones.filter((conversacion) => {
      if (!termino) return true;

      return [
        conversacion.nombre_usuario,
        conversacion.ultimo_mensaje,
      ].some((campo) =>
        campo
          .toLocaleLowerCase('es-AR')
          .includes(termino)
      );
    });

  const totalSinLeer = conversaciones.reduce(
    (total, conversacion) =>
      total + conversacion.sin_leer,
    0
  );

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5] flex flex-col" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>
      <Header mostrarBusqueda={false} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-5 sm:px-8 pt-10 pb-16">

        {/* TÍTULO Y NAVEGACIÓN */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-white">
              Mis mensajes
            </h1>

            {totalSinLeer > 0 && (
              <span className="min-w-6 h-6 px-2 rounded-full bg-[#2563EB] text-white text-xs font-semibold flex items-center justify-center">
                {totalSinLeer > 99 ? '99+' : totalSinLeer}
              </span>
            )}
          </div>

          <Link
            to="/"
            className="text-sm text-[#91A5BF] hover:text-white transition-colors shrink-0"
          >
            Volver al inicio
          </Link>
        </div>

        {/* BUSCADOR */}
        <div className="relative w-full sm:max-w-md mb-7">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8298B4] pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar mensajes"
            aria-label="Buscar mensajes"
            className="w-full h-11 bg-[#111F34] border border-[#263C59] rounded-lg pl-11 pr-4 text-sm text-white placeholder:text-[#8095AF] outline-none focus:border-[#4B83D5] transition-colors"
          />
        </div>

        {/* LISTA DE CHATS */}
        <div className="border-t border-[#294768]">

          {cargando ? (
            <p className="py-10 text-sm text-[#91A5BF]">
              Cargando mensajes...
            </p>
          ) : error ? (
            <div className="py-10">
              <p className="text-sm text-red-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void cargarConversaciones(true)}
                className="mt-4 text-sm text-[#93C5FD] hover:text-white cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : conversaciones.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-[#172A45] rounded-full flex items-center justify-center">
                <img
                  src="/mensajes.png"
                  alt=""
                  className="w-7 h-7 object-contain brightness-0 invert opacity-80"
                />
              </div>

              <h2 className="mt-5 text-base font-semibold text-white">
                No tenés mensajes todavía
              </h2>

              <p className="text-sm text-[#91A5BF] mt-2">
                Cuando hables con alguien, el chat va a aparecer acá.
              </p>
            </div>
          ) : conversacionesFiltradas.length === 0 ? (
            <div className="py-12">
              <p className="text-sm text-[#A9BAD0]">
                No se encontraron mensajes.
              </p>

              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="mt-3 text-sm text-[#93C5FD] hover:text-white cursor-pointer"
              >
                Borrar búsqueda
              </button>
            </div>
          ) : (
            conversacionesFiltradas.map((conversacion) => {
              const tieneSinLeer =
                conversacion.sin_leer > 0;

              return (
                <Link
                  key={conversacion.usuario_id}
                  to={`/mensajes/${conversacion.usuario_id}`}
                  state={{ from: '/mis-mensajes' }}
                  className="group flex items-center gap-4 px-2 sm:px-3 py-5 border-b border-[#253854] hover:bg-[#14243A] transition-colors"
                >
                  {/* FOTO DE PERFIL */}
                  <div className="w-14 h-14 shrink-0 rounded-full bg-[#294367] border border-[#36577A] flex items-center justify-center overflow-hidden">
                    {conversacion.foto_perfil ? (
                      <img
                        src={conversacion.foto_perfil}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-7 h-7 text-[#B7C9E2]"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20a8 8 0 0 1 16 0" />
                      </svg>
                    )}
                  </div>

                  {/* NOMBRE Y ÚLTIMO MENSAJE */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`text-base truncate ${
                          tieneSinLeer
                            ? 'font-semibold text-white'
                            : 'font-medium text-[#E7ECF5]'
                        }`}
                      >
                        {conversacion.nombre_usuario}
                      </span>

                      <span
                        className={`text-xs whitespace-nowrap ${
                          tieneSinLeer
                            ? 'text-[#93C5FD]'
                            : 'text-[#8196B0]'
                        }`}
                      >
                        {formatearFecha(
                          conversacion.fecha_ultimo_mensaje
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-1.5">
                      <p
                        className={`text-sm truncate ${
                          tieneSinLeer
                            ? 'font-medium text-[#E7ECF5]'
                            : 'text-[#91A5BF]'
                        }`}
                      >
                        {conversacion.ultimo_es_mio
                          ? 'Vos: '
                          : ''}
                        {conversacion.ultimo_mensaje}
                      </p>

                      {tieneSinLeer && (
                        <span className="min-w-6 h-6 px-1.5 bg-[#2563EB] rounded-full text-xs text-white font-semibold flex items-center justify-center shrink-0">
                          {conversacion.sin_leer > 99
                            ? '99+'
                            : conversacion.sin_leer}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}

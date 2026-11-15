
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Notificacion {
  id: number;
  contenido: string;
  a_donde_lleva: string | null;
  fecha_envio: string;
  leido: boolean;
}

interface Orden {
  id: number;
  producto_id: number;
  titulo: string;
  foto: string | null;
  precio_final: number | string;
  comprador_nombre_usuario: string;
  vendedor_nombre_usuario: string;
  mi_rol: 'comprador' | 'vendedor';
}

interface NotificacionVisual {
  texto: string;
  foto: string | null;
  tipo: 'venta' | 'compra' | 'oferta' | 'normal';
}

function precioAR(valor: number | string) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero.toLocaleString('es-AR', {
        maximumFractionDigits: 2,
      })
    : String(valor);
}

function interpretarPrecio(valor: string) {
  const limpio = valor.trim();

  if (limpio.includes('.') && limpio.includes(',')) {
    return Number(limpio.replace(/\./g, '').replace(',', '.'));
  }

  if (limpio.includes(',')) {
    return Number(limpio.replace(',', '.'));
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    return Number(limpio.replace(/\./g, ''));
  }

  return Number(limpio);
}

function esCompraRecibida(mensaje: string) {
  return /^(.+?) compró (?:tu prenda: )?"(.+?)" por \$[\d.,]+$/i.test(
    mensaje.trim()
  );
}

function esOfertaRecibida(mensaje: string) {
  // El backend: "usuario te ofertó $12000 por \"Prenda\""
  return /^(.+?) te ofertó \$[\d.,]+ por "(.+?)"/i.test(
    mensaje.trim()
  );
}

function esRecepcionDeVenta(mensaje: string, ordenes: Orden[]) {
  const coincidencia = mensaje.match(
    /^(.+?) confirmó que recibió "(.+?)"/i
  );

  if (!coincidencia) return false;

  return ordenes.some(
    (orden) =>
      orden.mi_rol === 'vendedor' &&
      orden.comprador_nombre_usuario.toLowerCase().trim() ===
        coincidencia[1].toLowerCase().trim() &&
      orden.titulo.toLowerCase().trim() ===
        coincidencia[2].toLowerCase().trim()
  );
}

function esNotificacionVendedor(
  notificacion: Notificacion,
  ordenes: Orden[]
) {
  const mensaje = notificacion.contenido || '';

  return (
    esCompraRecibida(mensaje) ||
    esOfertaRecibida(mensaje) ||
    esRecepcionDeVenta(mensaje, ordenes)
  );
}

function prepararNotificacion(
  notificacion: Notificacion,
  ordenes: Orden[]
): NotificacionVisual {
  const mensaje = notificacion.contenido || 'Nueva notificación';

  const oferta = mensaje.match(
    /^(.+?) te ofertó \$([\d.,]+) por "(.+?)"/i
  );

  if (oferta) {
    const [, comprador, monto, prenda] = oferta;

    return {
      texto: `${comprador} hizo una oferta por tu prenda "${prenda}" de $${precioAR(
        interpretarPrecio(monto)
      )}`,
      foto: null,
      tipo: 'oferta',
    };
  }

  const compra = mensaje.match(
    /^(.+?) compró (?:tu prenda: )?"(.+?)" por \$([\d.,]+)$/i
  );

  if (compra) {
    const [, comprador, titulo, precioOriginal] = compra;
    const precioNumero = interpretarPrecio(precioOriginal);

    const orden = ordenes.find(
      (item) =>
        item.mi_rol === 'vendedor' &&
        item.titulo.toLowerCase().trim() ===
          titulo.toLowerCase().trim() &&
        item.comprador_nombre_usuario.toLowerCase().trim() ===
          comprador.toLowerCase().trim() &&
        Number(item.precio_final) === precioNumero
    );

    return {
      texto: `${comprador} compró tu prenda: "${titulo}" por $${
        orden
          ? precioAR(orden.precio_final)
          : precioAR(precioNumero)
      }`,
      foto: orden?.foto || null,
      tipo: 'venta',
    };
  }

  if (esRecepcionDeVenta(mensaje, ordenes)) {
    const coincidencia = mensaje.match(
      /^(.+?) confirmó que recibió "(.+?)"/i
    );

    const orden = coincidencia
      ? ordenes.find(
          (item) =>
            item.mi_rol === 'vendedor' &&
            item.comprador_nombre_usuario.toLowerCase().trim() ===
              coincidencia[1].toLowerCase().trim() &&
            item.titulo.toLowerCase().trim() ===
              coincidencia[2].toLowerCase().trim()
        )
      : undefined;

    return {
      texto: mensaje,
      foto: orden?.foto || null,
      tipo: 'venta',
    };
  }

  const normalizado = mensaje.toLowerCase();

  const esCompra =
    normalizado.includes('compraste') ||
    normalizado.includes('realizaste una') ||
    normalizado.includes('tu pedido') ||
    normalizado.includes('tu compra') ||
    normalizado.includes('solicitud de compra') ||
    normalizado.includes('compra realizada') ||
    normalizado.includes('orden de compra') ||
    normalizado.includes('aceptó tu oferta');

  if (esCompra) {
    const orden = ordenes.find(
      (item) =>
        item.mi_rol === 'comprador' &&
        normalizado.includes(item.titulo.toLowerCase())
    );

    return {
      texto: mensaje,
      foto: orden?.foto || null,
      tipo: 'compra',
    };
  }

  return {
    texto: mensaje,
    foto: null,
    tipo: 'normal',
  };
}

function obtenerDestino(
  notificacion: Notificacion,
  ordenes: Orden[]
) {
  // Ventas y ofertas recibidas pertenecen al vendedor.
  if (esNotificacionVendedor(notificacion, ordenes)) {
    return '/mis-publicaciones';
  }

  let destino = notificacion.a_donde_lleva?.trim() || '';

  if (
    !destino.startsWith('/') ||
    destino.startsWith('//') ||
    destino.includes('\\')
  ) {
    return '/';
  }

  if (
    destino === '/mis_ordenes' ||
    destino === '/mis-ordenes'
  ) {
    return '/mis-pedidos';
  }

  // La compra aceptada aparece en Mis pedidos.
  if (
    destino === '/mis_contraofertas' ||
    destino === '/mis-contraofertas'
  ) {
    return '/mis-pedidos';
  }

  return destino;
}

function formatearFecha(fecha: string) {
  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return '';

  return valor.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

  const [notificacionesOpen, setNotificacionesOpen] =
    useState(false);
  const [notificaciones, setNotificaciones] =
    useState<Notificacion[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [marcandoId, setMarcandoId] =
    useState<number | null>(null);

  const consultandoRef = useRef(false);

  const sinLeer = notificaciones.filter(
    (notificacion) => !notificacion.leido
  ).length;

  const cargarNotificaciones = useCallback(
    async (mostrarCarga = false) => {
      const tokenActual = localStorage.getItem('token');

      if (!tokenActual) {
        setNotificaciones([]);
        setOrdenes([]);
        return;
      }

      if (consultandoRef.current) return;

      consultandoRef.current = true;
      if (mostrarCarga) setCargando(true);

      try {
        const [resNotificaciones, resOrdenes] =
          await Promise.all([
            fetch(`${API_URL}/mis_notificaciones`, {
              headers: {
                Authorization: `Bearer ${tokenActual}`,
              },
            }),
            fetch(`${API_URL}/mis_ordenes`, {
              headers: {
                Authorization: `Bearer ${tokenActual}`,
              },
            }),
          ]);

        if (!resNotificaciones.ok) {
          throw new Error('No se pudieron cargar las notificaciones.');
        }

        const datosNotificaciones =
          await resNotificaciones.json();

        const listaNotificaciones =
          Array.isArray(datosNotificaciones)
            ? datosNotificaciones
            : [];

        setNotificaciones(
          listaNotificaciones.map((notificacion: Notificacion) => ({
            id: Number(notificacion.id),
            contenido: notificacion.contenido,
            a_donde_lleva: notificacion.a_donde_lleva ?? null,
            fecha_envio: notificacion.fecha_envio,
            leido: notificacion.leido === true,
          }))
        );

        if (resOrdenes.ok) {
          const datosOrdenes = await resOrdenes.json();

          setOrdenes(
            Array.isArray(datosOrdenes) ? datosOrdenes : []
          );
        }

        setError('');
      } catch (err) {
        console.error(err);

        if (mostrarCarga) {
          setError('No se pudieron cargar las notificaciones.');
        }
      } finally {
        consultandoRef.current = false;
        if (mostrarCarga) setCargando(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!token) {
      setNotificaciones([]);
      setOrdenes([]);
      return;
    }

    void cargarNotificaciones();

    const intervalo = window.setInterval(() => {
      if (!document.hidden) void cargarNotificaciones();
    }, 15000);

    function actualizarAlVolver() {
      if (!document.hidden) void cargarNotificaciones();
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
  }, [token, cargarNotificaciones]);

  async function abrirNotificaciones() {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    if (notificacionesOpen) {
      setNotificacionesOpen(false);
      return;
    }

    setNotificacionesOpen(true);
    setError('');
    await cargarNotificaciones(true);
  }

  async function marcarNotificacionLeida(id: number) {
    const tokenActual = localStorage.getItem('token');

    if (!tokenActual) {
      throw new Error('Tenés que iniciar sesión.');
    }

    const respuesta = await fetch(
      `${API_URL}/notificaciones/${id}/leida`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenActual}`,
        },
      }
    );

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));

      throw new Error(
        datos.error || 'No se pudo marcar la notificación como leída.'
      );
    }

    setNotificaciones((anteriores) =>
      anteriores.map((notificacion) =>
        notificacion.id === id
          ? { ...notificacion, leido: true }
          : notificacion
      )
    );
  }

  async function seleccionarNotificacion(
    notificacion: Notificacion
  ) {
    if (marcandoId !== null) return;

    setMarcandoId(notificacion.id);
    setError('');

    try {
      if (!notificacion.leido) {
        await marcarNotificacionLeida(notificacion.id);
      }

      const destino = obtenerDestino(notificacion, ordenes);

      setNotificacionesOpen(false);
      navigate(destino);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo abrir la notificación.'
      );
    } finally {
      setMarcandoId(null);
    }
  }

  return (
    <>
      {/* FILTROS */}
      <button
        type="button"
        onClick={onFilters}
        className="w-10 h-10 rounded-full bg-[#172A45] hover:bg-[#213C5D] flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Filtros"
      >
        <img
          src="/filter.png"
          alt=""
          className="w-5 h-5 object-contain brightness-0 invert"
        />
      </button>

      {/* CAMPANITA */}
      <div className="relative">
        <button
          type="button"
          onClick={() => void abrirNotificaciones()}
          aria-label={
            sinLeer > 0
              ? `Notificaciones, ${sinLeer} sin leer`
              : 'Notificaciones'
          }
          aria-expanded={notificacionesOpen}
          aria-haspopup="dialog"
          className="relative w-10 h-10 rounded-full bg-[#172A45] hover:bg-[#213C5D] flex items-center justify-center transition-colors cursor-pointer"
        >
          <img
            src="/notification.png"
            alt=""
            className="w-5 h-5 object-contain brightness-0 invert"
          />

          {sinLeer > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#10192E]"
            >
              {sinLeer > 99 ? '99+' : sinLeer}
            </span>
          )}
        </button>

        {notificacionesOpen && (
          <div
            role="dialog"
            aria-label="Notificaciones"
            className="absolute right-0 top-12 w-72 sm:w-80 max-w-[90vw] bg-[#0E1D32] border border-[#294768] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[#294768] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-sm">
                  Notificaciones
                </h3>

                {sinLeer > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                    {sinLeer} sin leer
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setNotificacionesOpen(false)}
                className="text-[#A9BAD0] hover:text-white text-lg cursor-pointer"
                aria-label="Cerrar notificaciones"
              >
                ✕
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="px-4 py-3 text-xs text-red-400 border-b border-[#294768]"
              >
                {error}
              </p>
            )}

            <div className="max-h-80 overflow-y-auto">
              {cargando && notificaciones.length === 0 ? (
                <p className="p-4 text-sm text-[#A9BAD0]">
                  Cargando...
                </p>
              ) : notificaciones.length === 0 ? (
                <p className="p-4 text-sm text-[#A9BAD0]">
                  No tenés notificaciones.
                </p>
              ) : (
                notificaciones.map((notificacion) => {
                  const visual = prepararNotificacion(
                    notificacion,
                    ordenes
                  );

                  const textoAccion =
                    visual.tipo === 'venta' ||
                    visual.tipo === 'oferta'
                      ? 'Ver publicación'
                      : visual.tipo === 'compra'
                        ? 'Ver pedido'
                        : '';

                  return (
                    <button
                      type="button"
                      key={notificacion.id}
                      onClick={() =>
                        void seleccionarNotificacion(notificacion)
                      }
                      disabled={marcandoId !== null}
                      className={`w-full text-left px-4 py-3 border-b border-[#253854] last:border-0 transition-colors cursor-pointer disabled:cursor-wait ${
                        !notificacion.leido
                          ? 'bg-[#172A45] hover:bg-[#213C5D]'
                          : 'hover:bg-[#172A45]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {visual.foto ? (
                          <div className="w-14 h-14 shrink-0 rounded-lg bg-white overflow-hidden border border-[#36577A]">
                            <img
                              src={visual.foto}
                              alt="Prenda relacionada"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 shrink-0 rounded-lg bg-[#172A45] border border-[#36577A] flex items-center justify-center">
                            <img
                              src="/mensajes.png"
                              alt=""
                              className="w-6 h-6 object-contain brightness-0 invert opacity-85"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-relaxed ${
                              !notificacion.leido
                                ? 'text-white font-medium'
                                : 'text-[#B8C7D9]'
                            }`}
                          >
                            {visual.texto}
                          </p>

                          {textoAccion && (
                            <p className="text-xs text-[#93C5FD] mt-2">
                              {textoAccion}
                            </p>
                          )}

                          <p className="text-[11px] text-[#91A5BF] mt-2">
                            {formatearFecha(
                              notificacion.fecha_envio
                            )}
                          </p>
                        </div>

                        {!notificacion.leido && (
                          <span className="w-2.5 h-2.5 mt-1 rounded-full bg-[#3B82F6] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* NUEVA PUBLICACIÓN */}
      <button
        type="button"
        onClick={onCreate}
        className="w-10 h-10 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-2xl leading-none flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Crear publicación"
      >
        +
      </button>

      {/* CUENTA */}
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

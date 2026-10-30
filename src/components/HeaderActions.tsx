
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000';

interface Notificacion {
  id: number;
  mensaje?: string;
  contenido?: string;
  titulo?: string;
  leida?: boolean;
  link?: string;
}

interface Orden {
  id: number;
  producto_id: number;
  titulo: string;
  precio_final: number | string;
  comprador_nombre_usuario: string;
  vendedor_nombre_usuario: string;
  mi_rol: 'comprador' | 'vendedor';
}

function formatearPrecio(valor: number | string): string {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return String(valor);
  }

  return numero.toLocaleString('es-AR', {
    maximumFractionDigits: 2,
  });
}

function formatearNotificacion(
  notificacion: Notificacion,
  ordenes: Orden[]
): string {
  const mensaje =
    notificacion.mensaje ||
    notificacion.contenido ||
    notificacion.titulo ||
    'Nueva notificación';

  const compraVendedor = mensaje.match(
    /^(.+?) compró "(.+?)" por \$([\d.,]+)$/i
  );

  if (compraVendedor) {
    const [, usuario, nombrePrenda, precioOriginal] = compraVendedor;

    const precio = Number(precioOriginal.replace(/,/g, ''));

    return `${usuario} solicitó comprar tu prenda: "${nombrePrenda}" por $${formatearPrecio(precio)}`;
  }

  const mensajeNormalizado = mensaje.toLowerCase();

  const esNotificacionDeCompra =
    mensajeNormalizado.includes('compraste') ||
    mensajeNormalizado.includes('realizaste una') ||
    mensajeNormalizado.includes('tu pedido') ||
    mensajeNormalizado.includes('tu compra') ||
    mensajeNormalizado.includes('solicitud de compra') ||
    mensajeNormalizado.includes('compra realizada') ||
    mensajeNormalizado.includes('orden de compra');

  if (esNotificacionDeCompra) {
    const orden = ordenes.find(
      (orden) =>
        orden.mi_rol === 'comprador' &&
        mensajeNormalizado.includes(orden.titulo.toLowerCase())
    );

    if (orden) {
      return `Realizaste una nueva solicitud de compra por "${orden.titulo}" por $${formatearPrecio(orden.precio_final)} a ${orden.vendedor_nombre_usuario}. Comunicate con el vendedor para coordinar la entrega o envío.`;
    }
  }

  return mensaje;
}

function obtenerDestino(notificacion: Notificacion): string {
  let destino = notificacion.link || '/mis-pedidos';

  if (
    destino === '/mis_ordenes' ||
    destino === '/mis-ordenes'
  ) {
    destino = '/mis-pedidos';
  }

  if (
    destino === '/mis_contraofertas' ||
    destino === '/mis-contraofertas'
  ) {
    destino = '/mis-pedidos';
  }

  if (!destino.startsWith('/') || destino.startsWith('//')) {
    destino = '/mis-pedidos';
  }

  return destino;
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
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [marcando, setMarcando] = useState(false);

  const sinLeer = notificaciones.filter(
    (notificacion) => notificacion.leida === false
  ).length;

  async function cargarNotificaciones(mostrarCarga = false) {
    const tokenActual = localStorage.getItem('token');

    if (!tokenActual) {
      setNotificaciones([]);
      setOrdenes([]);
      return [];
    }

    if (mostrarCarga) {
      setCargando(true);
    }

    try {
      const [resNotificaciones, resOrdenes] = await Promise.all([
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

      const datosNotificaciones = await resNotificaciones.json();

      const listaNotificaciones = Array.isArray(datosNotificaciones)
        ? datosNotificaciones
        : datosNotificaciones.notificaciones;

      const notificacionesActuales: Notificacion[] =
        Array.isArray(listaNotificaciones)
          ? listaNotificaciones
          : [];

      setNotificaciones(notificacionesActuales);

      if (resOrdenes.ok) {
        const datosOrdenes = await resOrdenes.json();

        const listaOrdenes = Array.isArray(datosOrdenes)
          ? datosOrdenes
          : datosOrdenes.ordenes;

        setOrdenes(
          Array.isArray(listaOrdenes) ? listaOrdenes : []
        );
      }

      setError('');

      return notificacionesActuales;
    } catch (error) {
      console.error(error);

      if (mostrarCarga) {
        setError('No se pudieron cargar las notificaciones.');
      }

      return [];
    } finally {
      if (mostrarCarga) {
        setCargando(false);
      }
    }
  }

  async function marcarComoLeidas(lista: Notificacion[]) {
    const tokenActual = localStorage.getItem('token');

    if (!tokenActual || marcando) return;

    const pendientes = lista.filter(
      (notificacion) => notificacion.leida === false
    );

    if (pendientes.length === 0) return;

    setMarcando(true);

    try {
      const resultados = await Promise.allSettled(
        pendientes.map(async (notificacion) => {
          const res = await fetch(
            `${API_URL}/notificaciones/${notificacion.id}/leida`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${tokenActual}`,
              },
            }
          );

          if (!res.ok) {
            throw new Error(
              `No se pudo marcar la notificación ${notificacion.id}`
            );
          }

          return notificacion.id;
        })
      );

      const idsLeidos = new Set<number>();

      resultados.forEach((resultado) => {
        if (resultado.status === 'fulfilled') {
          idsLeidos.add(resultado.value);
        }
      });

      setNotificaciones((anteriores) =>
        anteriores.map((notificacion) =>
          idsLeidos.has(notificacion.id)
            ? { ...notificacion, leida: true }
            : notificacion
        )
      );

      if (
        resultados.some(
          (resultado) => resultado.status === 'rejected'
        )
      ) {
        setError(
          'Algunas notificaciones no se pudieron marcar como leídas.'
        );
      }
    } finally {
      setMarcando(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setNotificaciones([]);
      setOrdenes([]);
      return;
    }

    cargarNotificaciones();

    const intervalo = window.setInterval(() => {
      if (!notificacionesOpen && !marcando) {
        cargarNotificaciones();
      }
    }, 15000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [token, notificacionesOpen, marcando]);

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

    const lista = await cargarNotificaciones(true);

    await marcarComoLeidas(lista);
  }

  function seleccionarNotificacion(notificacion: Notificacion) {
    setNotificacionesOpen(false);
    navigate(obtenerDestino(notificacion));
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
          className="relative w-10 h-10 rounded-full bg-[#172A45] hover:bg-[#213C5D] flex items-center justify-center transition-colors cursor-pointer"
          aria-label={
            sinLeer > 0
              ? `Notificaciones, ${sinLeer} sin leer`
              : 'Notificaciones'
          }
          aria-expanded={notificacionesOpen}
        >
          <img
            src="/notification.png"
            alt=""
            className="w-5 h-5 object-contain brightness-0 invert"
          />

          {sinLeer > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#0D1628]">
              {sinLeer > 99 ? '99+' : sinLeer}
            </span>
          )}
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
                  <button
                    type="button"
                    key={notificacion.id}
                    onClick={() =>
                      seleccionarNotificacion(notificacion)
                    }
                    className={`w-full text-left px-4 py-3 border-b border-[#253854] last:border-0 transition-colors cursor-pointer ${
                      notificacion.leida === false
                        ? 'bg-[#172A45] hover:bg-[#213C5D]'
                        : 'hover:bg-[#172A45]'
                    }`}
                  >
                    <p className="text-sm text-[#E7ECF5] leading-relaxed">
                      {formatearNotificacion(notificacion, ordenes)}
                    </p>
                  </button>
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

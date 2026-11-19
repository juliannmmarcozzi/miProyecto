
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Pedido {
  id: number;
  producto_id: number;
  titulo: string;
  foto: string | null;
  precio_final: number | string;
  estado: string;
  fecha: string;
  comprador_id: number;
  comprador_nombre_usuario: string;
  vendedor_id: number;
  vendedor_nombre_usuario: string;
  mi_rol: 'comprador' | 'vendedor';
}

type TipoResena = 'producto' | 'vendedor';

function normalizarEstado(estado: string) {
  return String(estado ?? '').trim().toLowerCase();
}

function textoEstado(estado: string) {
  switch (normalizarEstado(estado)) {
    case 'confirmada':
      return 'Compra confirmada';
    case 'enviada':
      return 'Pendiente de recepción';
    case 'entregada':
      return 'Compra completada';
    case 'cancelada':
      return 'Compra cancelada';
    default:
      return estado;
  }
}

function formatearPrecio(precio: number | string) {
  return Number(precio).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatearFecha(fecha: string) {
  if (!fecha) return 'No especificada';

  const valor = new Date(fecha);

  return Number.isNaN(valor.getTime())
    ? 'No especificada'
    : valor.toLocaleDateString('es-AR');
}

function obtenerListaPedidos(datos: unknown): Pedido[] {
  if (Array.isArray(datos)) {
    return datos as Pedido[];
  }

  if (
    datos &&
    typeof datos === 'object' &&
    'ordenes' in datos &&
    Array.isArray(datos.ordenes)
  ) {
    return datos.ordenes as Pedido[];
  }

  return [];
}

export default function MisPedidos() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // CONFIRMACIÓN DE RECEPCIÓN
  const [pedidoPorConfirmar, setPedidoPorConfirmar] =
    useState<Pedido | null>(null);

  const [confirmandoId, setConfirmandoId] =
    useState<number | null>(null);

  const [errorConfirmacion, setErrorConfirmacion] =
    useState('');

  const [mensajeAccion, setMensajeAccion] = useState('');

  // RESEÑAS
  const [pedidoResena, setPedidoResena] =
    useState<Pedido | null>(null);

  const [tipoResena, setTipoResena] =
    useState<TipoResena>('producto');

  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');

  const [enviandoResena, setEnviandoResena] =
    useState(false);

  const [errorResena, setErrorResena] = useState('');
  const [exitoResena, setExitoResena] = useState('');

  const [resenasEnviadas, setResenasEnviadas] =
    useState<Record<string, boolean>>({});

  // CARGAR ÚNICAMENTE COMPRAS
  const cargarPedidos = useCallback(
    async (mostrarCarga = true) => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      if (mostrarCarga) {
        setCargando(true);
      }

      setError('');

      try {
        const respuesta = await fetch(
          `${API_URL}/mis_ordenes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

        if (respuesta.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        if (!respuesta.ok) {
          throw new Error(
            'No se pudieron cargar tus pedidos.'
          );
        }

        const datos = await respuesta.json();

        // IMPORTANTE: no se muestran las ventas.
        setPedidos(
          obtenerListaPedidos(datos).filter(
            (pedido) => pedido.mi_rol === 'comprador'
          )
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar tus pedidos.'
        );
      } finally {
        setCargando(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    void cargarPedidos();
  }, [cargarPedidos]);

  // CERRAR POPUPS CON ESCAPE
  useEffect(() => {
    if (!pedidoPorConfirmar && !pedidoResena) return;

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return;

      if (confirmandoId !== null || enviandoResena) {
        return;
      }

      setPedidoPorConfirmar(null);
      setPedidoResena(null);
      setErrorConfirmacion('');
      setErrorResena('');
    }

    window.addEventListener('keydown', cerrarConEscape);

    return () => {
      window.removeEventListener(
        'keydown',
        cerrarConEscape
      );
    };
  }, [
    pedidoPorConfirmar,
    pedidoResena,
    confirmandoId,
    enviandoResena,
  ]);

  // ABRIR POPUP DE RECEPCIÓN
  function abrirConfirmacion(pedido: Pedido) {
    if (
      pedido.mi_rol !== 'comprador' ||
      normalizarEstado(pedido.estado) !== 'enviada'
    ) {
      return;
    }

    setErrorConfirmacion('');
    setMensajeAccion('');
    setPedidoPorConfirmar(pedido);
  }

  function cerrarConfirmacion() {
    if (confirmandoId !== null) return;

    setPedidoPorConfirmar(null);
    setErrorConfirmacion('');
  }

  // CONFIRMAR QUE RECIBÍ LA PRENDA
  async function confirmarRecepcion() {
    if (!pedidoPorConfirmar || confirmandoId !== null) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const pedido = pedidoPorConfirmar;

    setConfirmandoId(pedido.id);
    setErrorConfirmacion('');
    setMensajeAccion('');

    try {
      const respuesta = await fetch(
        `${API_URL}/ordenes/${pedido.id}/entregada`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const datos = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            'No se pudo confirmar la recepción.'
        );
      }

      setPedidos((anteriores) =>
        anteriores.map((actual) =>
          actual.id === pedido.id
            ? { ...actual, estado: 'entregada' }
            : actual
        )
      );

      setPedidoPorConfirmar(null);

      setMensajeAccion(
        `Confirmaste la recepción de "${pedido.titulo}". La compra está completada y ya podés dejar tu calificación.`
      );

      await cargarPedidos(false);
    } catch (err) {
      setErrorConfirmacion(
        err instanceof Error
          ? err.message
          : 'No se pudo confirmar la recepción.'
      );
    } finally {
      setConfirmandoId(null);
    }
  }

  // RESEÑAS
  function claveResena(
    pedidoId: number,
    tipo: TipoResena
  ) {
    return `${pedidoId}-${tipo}`;
  }

  function puedeCalificarProducto(pedido: Pedido) {
    return (
      pedido.mi_rol === 'comprador' &&
      normalizarEstado(pedido.estado) === 'entregada'
    );
  }

  function puedeResenarVendedor(pedido: Pedido) {
    return (
      pedido.mi_rol === 'comprador' &&
      ['enviada', 'entregada', 'cancelada'].includes(
        normalizarEstado(pedido.estado)
      )
    );
  }

  function abrirResena(
    pedido: Pedido,
    tipo: TipoResena
  ) {
    const permitido =
      tipo === 'producto'
        ? puedeCalificarProducto(pedido)
        : puedeResenarVendedor(pedido);

    if (!permitido) return;

    setPedidoResena(pedido);
    setTipoResena(tipo);
    setEstrellas(5);
    setComentario('');
    setErrorResena('');
    setExitoResena('');
  }

  function cerrarResena() {
    if (enviandoResena) return;

    setPedidoResena(null);
    setErrorResena('');
    setExitoResena('');
  }

  async function enviarResena(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!pedidoResena || enviandoResena) return;

    const permitido =
      tipoResena === 'producto'
        ? puedeCalificarProducto(pedidoResena)
        : puedeResenarVendedor(pedidoResena);

    if (!permitido) {
      setErrorResena(
        'El estado de este pedido todavía no permite publicar esa reseña.'
      );
      return;
    }

    if (
      tipoResena === 'vendedor' &&
      comentario.trim() === ''
    ) {
      setErrorResena(
        'Escribí un comentario sobre tu experiencia.'
      );
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setEnviandoResena(true);
    setErrorResena('');
    setExitoResena('');

    try {
      const endpoint =
        tipoResena === 'producto'
          ? '/resenas_producto'
          : '/resenas_vendedor';

      const cuerpo =
        tipoResena === 'producto'
          ? {
              orden_id: pedidoResena.id,
              estrellas,
              comentario: comentario.trim(),
            }
          : {
              orden_id: pedidoResena.id,
              comentario: comentario.trim(),
            };

      const respuesta = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cuerpo),
        }
      );

      const datos = await respuesta
        .json()
        .catch(() => ({}));

      if (respuesta.status === 401) {
        throw new Error(
          'Tu sesión venció. Iniciá sesión nuevamente.'
        );
      }

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            'No se pudo publicar la reseña.'
        );
      }

      setResenasEnviadas((anteriores) => ({
        ...anteriores,
        [claveResena(
          pedidoResena.id,
          tipoResena
        )]: true,
      }));

      setExitoResena(
        tipoResena === 'producto'
          ? 'La calificación de la prenda se publicó correctamente.'
          : 'Tu experiencia con el vendedor se publicó correctamente.'
      );
    } catch (err) {
      setErrorResena(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al publicar la reseña.'
      );
    } finally {
      setEnviandoResena(false);
    }
  }

  // BUSCADOR
  const termino = busqueda
    .trim()
    .toLocaleLowerCase('es-AR');

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (!termino) return true;

    const campos = [
      pedido.titulo,
      pedido.vendedor_nombre_usuario,
      pedido.estado,
      textoEstado(pedido.estado),
      String(pedido.id),
      `Pedido #${pedido.id}`,
      formatearFecha(pedido.fecha),
    ];

    return campos.some((campo) =>
      String(campo ?? '')
        .toLocaleLowerCase('es-AR')
        .includes(termino)
    );
  });

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5] flex flex-col" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>
      <Header
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        placeholderBusqueda="Buscar en mis pedidos..."
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* ENCABEZADO */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-semibold text-white">
              Mis pedidos
            </h1>

            <p className="text-sm text-[#A9BAD0] mt-2">
              Consultá tus compras, confirmá la recepción
              de las prendas y compartí tu experiencia.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!cargando && !error && (
              <span className="bg-[#172A45] border border-[#294768] rounded-full px-4 py-2 text-xs text-[#D5E3F4]">
                {pedidos.length}{' '}
                {pedidos.length === 1
                  ? 'pedido'
                  : 'pedidos'}
              </span>
            )}

            <Link
              to="/perfil"
              className="text-sm text-[#A9BAD0] hover:text-white transition-colors"
            >
              Volver a mi perfil
            </Link>
          </div>
        </div>

        {/* MENSAJE DESPUÉS DE CONFIRMAR */}
        {mensajeAccion && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-[#256D58] bg-[#10372F] px-5 py-4 text-sm text-emerald-300"
          >
            {mensajeAccion}
          </div>
        )}

        {/* RESULTADOS DE BÚSQUEDA */}
        {!cargando && !error && termino && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-[#A9BAD0]">
              {pedidosFiltrados.length}{' '}
              {pedidosFiltrados.length === 1
                ? 'resultado encontrado'
                : 'resultados encontrados'}
            </p>

            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="text-sm text-[#93C5FD] hover:text-white cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* CONTENIDO */}
        {cargando ? (
          <p className="text-[#A9BAD0] text-center py-12">
            Cargando pedidos...
          </p>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-12">
            {error}
          </p>
        ) : pedidos.length === 0 ? (
          <div className="bg-[#1C293E] border border-[#294768] rounded-xl p-10 text-center">
            <h2 className="text-lg font-semibold text-white">
              Todavía no realizaste ningún pedido
            </h2>

            <p className="text-sm text-[#A9BAD0] mt-2 mb-6">
              Cuando compres una prenda, tu pedido
              va a aparecer acá.
            </p>

            <Link
              to="/"
              className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-3 rounded-lg text-sm font-medium"
            >
              Explorar prendas
            </Link>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="bg-[#1C293E] border border-[#294768] rounded-xl p-10 text-center">
            <h2 className="text-lg font-semibold text-white">
              No se encontraron pedidos
            </h2>

            <p className="text-sm text-[#A9BAD0] mt-2">
              No hay pedidos que coincidan con tu búsqueda.
            </p>

            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-3 rounded-lg text-sm cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pedidosFiltrados.map((pedido) => {
              const estado = normalizarEstado(pedido.estado);

              const puedeConfirmar =
                estado === 'enviada';

              const puedeProducto =
                puedeCalificarProducto(pedido);

              const puedeVendedor =
                puedeResenarVendedor(pedido);

              const productoEnviado =
                !!resenasEnviadas[
                  claveResena(pedido.id, 'producto')
                ];

              const vendedorEnviado =
                !!resenasEnviadas[
                  claveResena(pedido.id, 'vendedor')
                ];

              return (
                <article
                  key={pedido.id}
                  className="bg-[#1C293E] border border-[#294768] rounded-xl overflow-hidden flex flex-col"
                >
                  {/* FOTO */}
                  <div className="bg-[#102039] h-64 overflow-hidden">
                    {pedido.foto ? (
                      <img
                        src={pedido.foto}
                        alt={pedido.titulo}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#91A5BF] text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* INFORMACIÓN */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-[#91A5BF]">
                        Pedido #{pedido.id}
                      </p>

                      <span
                        className={`text-xs rounded-full px-3 py-1 ${
                          estado === 'entregada'
                            ? 'bg-emerald-950 text-emerald-300'
                            : estado === 'cancelada'
                              ? 'bg-red-950 text-red-300'
                              : 'bg-[#213B5D] text-[#D5E3F4]'
                        }`}
                      >
                        {textoEstado(pedido.estado)}
                      </span>
                    </div>

                    <h2 className="text-[14px] font-medium tracking-[-0.01em] text-white mt-3">
                      {pedido.titulo}
                    </h2>

                    {/* VENDEDOR */}
                    <div className="mt-4">
                      <p className="text-xs text-[#91A5BF]">
                        Vendedor
                      </p>

                      <Link
                        to={`/usuario/${encodeURIComponent(
                          pedido.vendedor_nombre_usuario
                        )}`}
                        className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-white hover:text-[#93C5FD]"
                      >
                        <span className="w-8 h-8 rounded-full bg-[#294367] flex items-center justify-center">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 text-[#A9BAD0]"
                          >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20a8 8 0 0 1 16 0" />
                          </svg>
                        </span>

                        {pedido.vendedor_nombre_usuario}
                      </Link>
                    </div>

                    {/* PRECIO */}
                    <div className="mt-5">
                      <p className="text-xs text-[#91A5BF]">
                        Precio de la prenda
                      </p>

                      <p className="text-2xl font-bold text-white mt-1">
                        ${formatearPrecio(pedido.precio_final)}
                      </p>
                    </div>

                    {/* FECHA */}
                    <div className="border-t border-[#34465F] mt-5 pt-4">
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-[#91A5BF]">
                          Fecha del pedido
                        </span>

                        <span className="text-[#E7ECF5]">
                          {formatearFecha(pedido.fecha)}
                        </span>
                      </div>
                    </div>

                    {/* ESTADO Y PRÓXIMO PASO */}
                    <div className="mt-5 rounded-lg border border-[#294768] bg-[#14243B] p-4">
                      <p className="text-xs font-semibold text-[#93C5FD] mb-2">
                        Estado de tu compra
                      </p>

                      {estado === 'confirmada' && (
                        <p className="text-sm text-[#D5E3F4] leading-relaxed">
                          Tu compra está registrada.
                          Coordiná el pago y la entrega
                          con el vendedor por mensaje.
                          Cuando marque la prenda como
                          lista para entregar, podrás
                          confirmar su recepción.
                        </p>
                      )}

                      {estado === 'enviada' && (
                        <p className="text-sm text-[#D5E3F4] leading-relaxed">
                          El vendedor marcó la prenda
                          como lista para entregar.
                          Cuando la recibas, confirmá
                          la recepción para completar
                          tu compra.
                        </p>
                      )}

                      {estado === 'entregada' && (
                        <p className="text-sm text-emerald-300 leading-relaxed">
                          ¡Compra completada!
                          Confirmaste que recibiste
                          la prenda. Ya podés calificar
                          tu experiencia.
                        </p>
                      )}

                      {estado === 'cancelada' && (
                        <p className="text-sm text-[#D5E3F4] leading-relaxed">
                          Esta compra fue cancelada.
                          No podés calificar la prenda,
                          pero podés contar tu
                          experiencia con el vendedor.
                        </p>
                      )}
                    </div>

                    {/* ENVIAR MENSAJE */}
                    <Link
                      to={`/chat/${pedido.producto_id}?usuario=${encodeURIComponent(
                        pedido.vendedor_nombre_usuario
                      )}`}
                      className="block w-full text-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3 font-semibold text-sm mt-5 transition-colors"
                    >
                      Enviar mensaje
                    </Link>

                    {/* CONFIRMAR RECEPCIÓN */}
                    {puedeConfirmar && (
                      <button
                        type="button"
                        onClick={() => abrirConfirmacion(pedido)}
                        className="mt-3 w-full rounded-lg border border-emerald-500/60 bg-emerald-700 hover:bg-emerald-600 px-4 py-3 text-sm font-semibold text-white cursor-pointer transition-colors"
                      >
                        Confirmar que recibí la prenda
                      </button>
                    )}

                    {/* RESEÑAS */}
                    <div className="mt-5 pt-5 border-t border-[#34465F]">
                      <h3 className="text-sm font-semibold text-white">
                        Tu experiencia de compra
                      </h3>

                      <p className="text-xs text-[#91A5BF] mt-2">
                        {estado === 'entregada'
                          ? 'Compra completada. Ya podés publicar tus reseñas.'
                          : 'Las calificaciones se habilitan según el estado de tu pedido.'}
                      </p>

                      <button
                        type="button"
                        disabled={
                          !puedeProducto || productoEnviado
                        }
                        onClick={() =>
                          abrirResena(pedido, 'producto')
                        }
                        className="w-full mt-4 border border-[#36577A] rounded-lg px-4 py-3 text-sm text-white hover:bg-[#172A45] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {productoEnviado
                          ? 'Prenda calificada'
                          : 'Calificar prenda'}
                      </button>

                      <button
                        type="button"
                        disabled={
                          !puedeVendedor || vendedorEnviado
                        }
                        onClick={() =>
                          abrirResena(pedido, 'vendedor')
                        }
                        className="w-full mt-2 border border-[#36577A] rounded-lg px-4 py-3 text-sm text-white hover:bg-[#172A45] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {vendedorEnviado
                          ? 'Experiencia publicada'
                          : 'Contar experiencia con el vendedor'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* POPUP PERSONALIZADO: CONFIRMAR RECEPCIÓN */}
      {pedidoPorConfirmar && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarConfirmacion();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmar-recepcion"
            className="w-full max-w-md rounded-2xl border border-[#36577A] bg-[#14243B] shadow-2xl overflow-hidden"
          >
            {/* ICONO Y CERRAR */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div className="w-12 h-12 rounded-xl bg-[#213B5D] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#93C5FD"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7"
                >
                  <path d="M3 7h18v12H3z" />
                  <path d="m8 13 3 3 5-5" />
                </svg>
              </div>

              <button
                type="button"
                onClick={cerrarConfirmacion}
                disabled={confirmandoId !== null}
                aria-label="Cerrar"
                className="text-[#A9BAD0] hover:text-white text-xl disabled:opacity-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* CONTENIDO */}
            <div className="px-6 pt-5 pb-6">
              <h2
                id="titulo-confirmar-recepcion"
                className="text-xl font-bold text-white"
              >
                ¿Recibiste la prenda?
              </h2>

              <p className="mt-3 text-sm text-[#B9C9DC] leading-relaxed">
                Vas a confirmar que recibiste{' '}
                <span className="font-semibold text-white">
                  {pedidoPorConfirmar.titulo}
                </span>{' '}
                del vendedor{' '}
                <span className="font-semibold text-white">
                  {pedidoPorConfirmar.vendedor_nombre_usuario}
                </span>.
              </p>

              <div className="mt-5 rounded-lg border border-[#294768] bg-[#0E1D32] p-4">
                <p className="text-sm text-[#D5E3F4] leading-relaxed">
                  Confirmá solamente si la prenda
                  ya está en tus manos.
                </p>

                <p className="text-xs text-[#91A5BF] mt-3 leading-relaxed">
                  Esto completará la compra,
                  notificará al vendedor y te
                  permitirá calificar la prenda.
                </p>
              </div>

              {errorConfirmacion && (
                <p
                  role="alert"
                  className="mt-4 text-sm text-red-400"
                >
                  {errorConfirmacion}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarConfirmacion}
                  disabled={confirmandoId !== null}
                  className="rounded-lg border border-[#36577A] bg-[#172A45] hover:bg-[#213B5D] py-3 text-sm font-semibold text-[#D5E3F4] disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void confirmarRecepcion()}
                  disabled={confirmandoId !== null}
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                >
                  {confirmandoId !== null
                    ? 'Confirmando...'
                    : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DE RESEÑAS */}
      {pedidoResena && (
        <div
          className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarResena();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-resena"
            className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#14243B] border border-[#36577A] rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="titulo-resena"
                  className="text-xl font-bold text-white"
                >
                  {tipoResena === 'producto'
                    ? 'Calificar prenda'
                    : 'Tu experiencia con el vendedor'}
                </h2>

                <p className="text-sm text-[#A9BAD0] mt-2">
                  {pedidoResena.titulo}
                  {' · '}
                  Pedido #{pedidoResena.id}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarResena}
                disabled={enviandoResena}
                className="text-[#A9BAD0] hover:text-white text-xl disabled:opacity-50 cursor-pointer"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {exitoResena ? (
              <div className="mt-6">
                <p
                  role="status"
                  className="text-emerald-300 text-sm"
                >
                  {exitoResena}
                </p>

                <button
                  type="button"
                  onClick={cerrarResena}
                  className="mt-6 w-full bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg py-3 text-sm font-semibold text-white cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form
                onSubmit={enviarResena}
                className="mt-6"
              >
                {tipoResena === 'producto' && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-white mb-3">
                      ¿Cuántas estrellas le das?
                    </p>

                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((numero) => (
                        <button
                          key={numero}
                          type="button"
                          onClick={() => setEstrellas(numero)}
                          disabled={enviandoResena}
                          aria-label={`${numero} estrellas`}
                          aria-pressed={estrellas === numero}
                          className={`text-3xl cursor-pointer transition-transform hover:scale-110 ${
                            numero <= estrellas
                              ? 'text-amber-400'
                              : 'text-[#63748E]'
                          }`}
                        >
                          {numero <= estrellas
                            ? '★'
                            : '☆'}
                        </button>
                      ))}

                      <span className="text-sm text-[#A9BAD0] ml-2">
                        {estrellas}/5
                      </span>
                    </div>
                  </div>
                )}

                <label
                  htmlFor="comentario-resena"
                  className="block text-sm font-medium text-white mb-2"
                >
                  {tipoResena === 'producto'
                    ? 'Comentario (opcional)'
                    : 'Contá cómo fue tu experiencia'}
                </label>

                <textarea
                  id="comentario-resena"
                  value={comentario}
                  onChange={(evento) =>
                    setComentario(evento.target.value)
                  }
                  required={tipoResena === 'vendedor'}
                  rows={4}
                  disabled={enviandoResena}
                  placeholder={
                    tipoResena === 'producto'
                      ? '¿La prenda era como esperabas?'
                      : '¿Cómo fue la comunicación y la experiencia de compra?'
                  }
                  className="w-full bg-[#0B192D] border border-[#294768] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5] resize-y"
                />

                {errorResena && (
                  <p
                    role="alert"
                    className="text-red-400 text-sm mt-4"
                  >
                    {errorResena}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    type="button"
                    onClick={cerrarResena}
                    disabled={enviandoResena}
                    className="border border-[#36577A] bg-[#172A45] rounded-lg py-3 text-sm text-white hover:bg-[#213B5D] disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={enviandoResena}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {enviandoResena
                      ? 'Publicando...'
                      : 'Publicar reseña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

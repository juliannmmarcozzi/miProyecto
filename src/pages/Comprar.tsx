
import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  getPrenda,
  type Prenda,
} from '../features/browse/api/prendas';

const API_URL =
  import.meta.env.VITE_API_URL ;

type MetodoEntrega = 'retiro' | 'envio';

interface RespuestaCompra {
  id?: number;
  orden?: {
    id: number;
  };
  error?: string;
  mensaje?: string;
}

function precioAR(valor: number | string): string {
  return Number(valor).toLocaleString('es-AR', {
    maximumFractionDigits: 2,
  });
}

export default function Comprar() {
  const [parametros] = useSearchParams();
  const navigate = useNavigate();
  const id = parametros.get('id');

  const [prenda, setPrenda] = useState<Prenda | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [metodoEntrega, setMetodoEntrega] =
    useState<MetodoEntrega>('retiro');

  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);

  const [comprando, setComprando] = useState(false);
  const [errorCompra, setErrorCompra] = useState('');

  // CARGAR PRENDA
  useEffect(() => {
    let activo = true;

    if (!id) {
      setPrenda(null);
      setError('No se seleccionó ninguna prenda.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');
    setErrorCompra('');
    setPrenda(null);
    setMostrarConfirmacion(false);

    getPrenda(id)
      .then((datos) => {
        if (activo) {
          setPrenda(datos ?? null);
        }
      })
      .catch(() => {
        if (activo) {
          setError('No se pudo cargar la prenda.');
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [id]);

  // CERRAR POPUP CON ESCAPE
  useEffect(() => {
    if (!mostrarConfirmacion || comprando) return;

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setMostrarConfirmacion(false);
      }
    }

    window.addEventListener(
      'keydown',
      cerrarConEscape
    );

    return () => {
      window.removeEventListener(
        'keydown',
        cerrarConEscape
      );
    };
  }, [mostrarConfirmacion, comprando]);

  function abrirConfirmacion() {
    if (!prenda || comprando) return;

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setErrorCompra('');
    setMostrarConfirmacion(true);
  }

  function cerrarConfirmacion() {
    if (comprando) return;

    setMostrarConfirmacion(false);
    setErrorCompra('');
  }

  // CREAR COMPRA CON EL BACKEND ACTUAL
  async function confirmarCompra() {
    if (!prenda || comprando) return;

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setComprando(true);
    setErrorCompra('');

    try {
      const respuesta = await fetch(
        `${API_URL}/comprar_ahora`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            producto_id: Number(prenda.id),
          }),
        }
      );

      const datos: RespuestaCompra =
        await respuesta.json().catch(() => ({}));

      if (respuesta.status === 401) {
        setMostrarConfirmacion(false);
        navigate('/login');
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            datos.mensaje ||
            'No se pudo registrar la compra.'
        );
      }

      setMostrarConfirmacion(false);

      navigate('/mis-pedidos', {
        replace: true,
        state: {
          compraRealizada: true,
          ordenId: datos.orden?.id ?? datos.id ?? null,
        },
      });
    } catch (err) {
      console.error('Error al registrar la compra:', err);

      setErrorCompra(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al registrar la compra.'
      );
    } finally {
      setComprando(false);
    }
  }

  const precio = prenda ? Number(prenda.precio) : 0;

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5]">
      {/* HEADER */}
      <header className="bg-[#0B1528] border-b border-[#243754]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center">
          <Link
            to={prenda ? `/prenda/${prenda.id}` : '/'}
            className="flex items-center gap-2 text-sm text-[#A9BAD0] hover:text-white transition-colors"
          >
            <span className="text-xl">←</span>
            Volver al producto
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Confirmar compra
        </h1>

        <p className="text-sm text-[#A9BAD0] mb-8">
          Revisá los datos de la prenda antes de registrar tu compra.
        </p>

        {cargando ? (
          <p className="text-[#A9BAD0] py-12">
            Cargando información de la prenda...
          </p>
        ) : error || !prenda ? (
          <div className="bg-[#172A45] border border-[#294768] rounded-xl p-6">
            <p className="text-red-400">
              {error || 'Prenda no encontrada.'}
            </p>

            <Link
              to="/"
              className="inline-block mt-4 text-[#75A7F8] hover:text-white"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-5 items-start">
            {/* COLUMNA IZQUIERDA */}
            <div className="flex flex-col gap-5">
              {/* PRODUCTO */}
              <section className="bg-[#1C293E] border border-[#294768] rounded-xl p-5">
                <h2 className="text-base font-semibold text-white mb-4">
                  Tu pedido
                </h2>

                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-full sm:w-36 h-44 sm:h-36 shrink-0 bg-[#102039] rounded-lg overflow-hidden">
                    {prenda.imagenes[0] ? (
                      <img
                        src={prenda.imagenes[0]}
                        alt={prenda.titulo}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#91A5BF] text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">
                      {prenda.titulo}
                    </h3>

                    <p className="text-sm text-[#A9BAD0] mt-1">
                      {prenda.marca}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="bg-[#294367] text-[#D8E6F7] text-xs rounded-full px-4 py-1.5">
                        Talle {prenda.talle}
                      </span>

                      <span className="bg-[#294367] text-[#D8E6F7] text-xs rounded-full px-4 py-1.5">
                        {prenda.estado}
                      </span>
                    </div>

                    <p className="text-xs text-[#A9BAD0] mt-4">
                      Publicado por {prenda.usuario}
                    </p>
                  </div>

                  <div className="sm:border-l border-[#34465F] sm:pl-6 flex flex-col justify-center shrink-0">
                    <p className="text-xs text-[#91A5BF]">
                      Precio de la prenda
                    </p>

                    <p className="text-2xl font-bold text-white mt-1">
                      ${precioAR(precio)}
                    </p>
                  </div>
                </div>
              </section>

              {/* MÉTODO DE ENTREGA */}
              <section className="bg-[#1C293E] border border-[#294768] rounded-xl p-5">
                <h2 className="text-lg font-semibold text-white mb-5">
                  Método de entrega
                </h2>

                <div className="flex flex-col gap-3">
                  <label
                    className={`flex items-center gap-4 border rounded-lg p-4 cursor-pointer transition-colors ${
                      metodoEntrega === 'retiro'
                        ? 'border-[#3B82F6] bg-[#122746]'
                        : 'border-[#34465F] bg-[#101D31] hover:border-[#52739D]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="entrega"
                      checked={metodoEntrega === 'retiro'}
                      onChange={() => setMetodoEntrega('retiro')}
                      disabled={comprando}
                      className="accent-[#2563EB] w-4 h-4"
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Retiro en persona
                      </p>

                      <p className="text-xs text-[#A9BAD0] mt-1">
                        Coordiná con el vendedor un lugar y horario
                        para retirar la prenda.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-4 border rounded-lg p-4 cursor-pointer transition-colors ${
                      metodoEntrega === 'envio'
                        ? 'border-[#3B82F6] bg-[#122746]'
                        : 'border-[#34465F] bg-[#101D31] hover:border-[#52739D]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="entrega"
                      checked={metodoEntrega === 'envio'}
                      onChange={() => setMetodoEntrega('envio')}
                      disabled={comprando}
                      className="accent-[#2563EB] w-4 h-4"
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Envío a coordinar con el vendedor
                      </p>

                      <p className="text-xs text-[#A9BAD0] mt-1">
                        Puede tener un costo adicional acordado
                        con el vendedor.
                      </p>
                    </div>
                  </label>
                </div>

                <p className="mt-4 text-xs text-[#91A5BF]">
                  La modalidad elegida sirve como referencia.
                  Coordiná los detalles por mensaje, ya que
                  el backend todavía no guarda esta elección.
                </p>
              </section>

              {/* FORMA DE PAGO */}
              <section className="bg-[#1C293E] border border-[#294768] rounded-xl p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Forma de pago
                </h2>

                <div className="bg-[#122746] border border-[#3B82F6] rounded-lg p-4">
                  <p className="text-sm font-semibold text-white">
                    Transferencia bancaria o Mercado Pago
                  </p>

                  <p className="text-xs text-[#A9BAD0] mt-3 leading-relaxed">
                    Después de registrar la compra, comunicate
                    con el vendedor para coordinar el pago.
                    La aplicación todavía no procesa transferencias
                    ni verifica comprobantes.
                  </p>
                </div>
              </section>
            </div>

            {/* RESUMEN DE COMPRA */}
            <aside className="bg-[#1C293E] border border-[#294768] rounded-xl p-6 lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold text-white">
                Resumen de compra
              </h2>

              <div className="mt-8 border-t border-[#34465F] pt-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#E7ECF5]">
                      {prenda.titulo}
                    </p>

                    <p className="text-xs text-[#91A5BF] mt-1">
                      Talle {prenda.talle} · {prenda.estado}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-white whitespace-nowrap">
                    ${precioAR(precio)}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#34465F] mt-6 pt-5 space-y-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#A9BAD0]">
                    Subtotal
                  </span>

                  <span className="text-white">
                    ${precioAR(precio)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#A9BAD0]">
                    Entrega
                  </span>

                  <span className="text-[#A9BAD0] text-right">
                    {metodoEntrega === 'retiro'
                      ? 'A coordinar'
                      : 'Costo a coordinar'}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#34465F] mt-6 pt-5 flex justify-between items-center gap-3">
                <span className="font-semibold text-white">
                  Total de la prenda
                </span>

                <span className="text-2xl font-bold text-white">
                  ${precioAR(precio)}
                </span>
              </div>

              <button
                type="button"
                onClick={abrirConfirmacion}
                disabled={comprando}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3.5 font-semibold mt-8 transition-colors cursor-pointer disabled:opacity-50"
              >
                Solicitar compra
              </button>

              {errorCompra && !mostrarConfirmacion && (
                <p
                  role="alert"
                  className="text-sm text-red-400 mt-5 leading-relaxed"
                >
                  {errorCompra}
                </p>
              )}

              <p className="text-xs text-[#91A5BF] text-center mt-5 leading-relaxed">
                Al confirmar, se registra tu compra
                inmediatamente. Después podés coordinar
                el pago y la entrega con el vendedor.
              </p>

              <div className="border-t border-[#34465F] mt-8 pt-6">
                <Link
                  to={`/prenda/${prenda.id}`}
                  className="text-sm text-[#75A7F8] hover:text-white transition-colors"
                >
                  Volver al producto
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* POPUP DE CONFIRMACIÓN */}
      {mostrarConfirmacion && prenda && (
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
            aria-labelledby="titulo-confirmar-compra"
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#36577A] bg-[#14243B] shadow-2xl"
          >
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
                  <path d="M3 5h2l2.5 11h11l2-8H6" />
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                </svg>
              </div>

              <button
                type="button"
                onClick={cerrarConfirmacion}
                disabled={comprando}
                aria-label="Cerrar"
                className="text-[#A9BAD0] hover:text-white text-xl disabled:opacity-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pt-5 pb-6">
              <h2
                id="titulo-confirmar-compra"
                className="text-xl font-bold text-white"
              >
                ¿Confirmás tu compra?
              </h2>

              <p className="mt-3 text-sm text-[#B9C9DC] leading-relaxed">
                Vas a comprar{' '}
                <span className="font-semibold text-white">
                  {prenda.titulo}
                </span>{' '}
                por{' '}
                <span className="font-semibold text-white">
                  ${precioAR(precio)}
                </span>.
              </p>

              <div className="mt-5 rounded-lg border border-[#294768] bg-[#0E1D32] p-4">
                <p className="text-sm text-[#D5E3F4] leading-relaxed">
                  La compra se registrará inmediatamente
                  y el vendedor recibirá la notificación.
                </p>

                <p className="text-xs text-[#91A5BF] mt-3 leading-relaxed">
                  Luego deberán coordinar el pago y la entrega
                  por mensaje. Confirmar la compra no significa
                  que ya se haya realizado una transferencia.
                </p>
              </div>

              {errorCompra && (
                <p
                  role="alert"
                  className="mt-4 text-sm text-red-400"
                >
                  {errorCompra}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarConfirmacion}
                  disabled={comprando}
                  className="rounded-lg border border-[#36577A] bg-[#172A45] hover:bg-[#213B5D] py-3 text-sm font-semibold text-[#D5E3F4] disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void confirmarCompra()}
                  disabled={comprando}
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                >
                  {comprando
                    ? 'Registrando...'
                    : 'Confirmar compra'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

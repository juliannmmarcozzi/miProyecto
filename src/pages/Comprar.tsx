
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getPrenda, type Prenda } from '../features/browse/api/prendas';

type MetodoEntrega = 'retiro' | 'envio';

const API_URL = 'http://localhost:3000';

export default function Comprar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');

  const [prenda, setPrenda] = useState<Prenda | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [metodoEntrega, setMetodoEntrega] =
    useState<MetodoEntrega>('retiro');

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorCompra, setErrorCompra] = useState('');

  useEffect(() => {
    let activo = true;

    if (!id) {
      setError('No se seleccionó ninguna prenda.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');
    setPrenda(null);

    getPrenda(id)
      .then((datos) => {
        if (activo) setPrenda(datos ?? null);
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar la prenda.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  async function confirmarCompra() {
    if (!prenda || enviando) return;

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setEnviando(true);
    setErrorCompra('');

    try {
      const res = await fetch(`${API_URL}/comprar_ahora`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          producto_id: Number(prenda.id),
        }),
      });

      const resultado = await res.json();

      if (!res.ok) {
        throw new Error(
          resultado.error || 'No se pudo realizar la solicitud.'
        );
      }

      navigate('/mis-pedidos', {
        replace: true,
        state: {
          compraRealizada: true,
          ordenId: resultado.orden?.id,
        },
      });
    } catch (error) {
      setErrorCompra(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al crear la orden.'
      );
    } finally {
      setEnviando(false);
    }
  }

  const precio = prenda
    ? Number(prenda.precio).toLocaleString('es-AR')
    : '0';

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5]">
      <header className="bg-[#0B1528] border-b border-[#243754]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-[#A9BAD0] hover:text-white transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Volver a publicaciones
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-10">
          Completá tu solicitud de compra
        </h1>

        {cargando ? (
          <p className="text-[#A9BAD0]">
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
            <div className="flex flex-col gap-5">

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
                      {prenda.usuario}
                    </p>
                  </div>

                  <div className="sm:border-l border-[#34465F] sm:pl-6 flex flex-col justify-center shrink-0">
                    <p className="text-xs text-[#91A5BF]">
                      Precio de la prenda
                    </p>

                    <p className="text-2xl font-bold text-white mt-1">
                      ${precio}
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-[#1C293E] border border-[#294768] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#75A7F8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>

                  <h2 className="text-lg font-semibold text-white">
                    Método de entrega
                  </h2>
                </div>

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
                      value="retiro"
                      checked={metodoEntrega === 'retiro'}
                      onChange={() => setMetodoEntrega('retiro')}
                      className="accent-[#2563EB] w-4 h-4"
                    />

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#75A7F8"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6 shrink-0"
                    >
                      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Retiro en persona
                      </p>

                      <p className="text-xs text-[#A9BAD0] mt-1">
                        Coordiná con el vendedor un lugar y horario para retirar la prenda.
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
                      value="envio"
                      checked={metodoEntrega === 'envio'}
                      onChange={() => setMetodoEntrega('envio')}
                      className="accent-[#2563EB] w-4 h-4"
                    />

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#75A7F8"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6 shrink-0"
                    >
                      <path d="M3 7h11v10H3z" />
                      <path d="M14 10h4l3 4v3h-7" />
                      <circle cx="7.5" cy="18" r="2" />
                      <circle cx="17.5" cy="18" r="2" />
                    </svg>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Envío a coordinar con el vendedor
                      </p>

                      <p className="text-xs text-[#A9BAD0] mt-1">
                        Puede incluir costos extras a coordinar con el vendedor.
                      </p>
                    </div>
                  </label>
                </div>
              </section>

              <section className="bg-[#1C293E] border border-[#294768] rounded-xl p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Forma de pago
                </h2>

                <div className="bg-[#122746] border border-[#3B82F6] rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#2563EB] border-4 border-[#75A7F8]" />

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#75A7F8"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <path d="M2 10h20" />
                    </svg>

                    <p className="text-sm font-semibold text-white">
                      Transferencia por Mercado Pago
                    </p>
                  </div>

                  <p className="text-xs text-[#A9BAD0] mt-3 ml-7 leading-relaxed">
                    El vendedor te proporcionará sus datos de pago una vez confirmado el pedido.
                  </p>
                </div>
              </section>

            </div>

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
                    ${precio}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#34465F] mt-6 pt-5 space-y-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#A9BAD0]">Subtotal</span>
                  <span className="text-white">${precio}</span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#A9BAD0]">Entrega</span>
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
                  ${precio}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorCompra('');
                  setMostrarConfirmacion(true);
                }}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3.5 font-semibold mt-8 transition-colors cursor-pointer"
              >
                Solicitar compra
              </button>

              <p className="text-xs text-[#91A5BF] text-center mt-4 leading-relaxed">
                Al confirmar se genera una orden y la prenda deja de estar disponible.
                El pago no se realiza automáticamente.
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

      {mostrarConfirmacion && prenda && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-compra"
            className="w-full max-w-md bg-[#1C293E] border border-[#294768] rounded-2xl p-6 shadow-2xl"
          >
            <h2
              id="confirmar-compra"
              className="text-xl font-bold text-white"
            >
              Confirmar solicitud de compra
            </h2>

            <p className="text-sm text-[#B8C7D9] leading-relaxed mt-4">
              Vas a generar una orden por{' '}
              <span className="font-semibold text-white">
                {prenda.titulo}
              </span>{' '}
              de ${precio}.
            </p>

            <p className="text-sm text-[#B8C7D9] leading-relaxed mt-3">
              La publicación se marcará como vendida.
              El pago por Mercado Pago y la entrega quedan pendientes
              de coordinación con el vendedor.
            </p>

            <p className="text-sm text-[#B8C7D9] mt-3">
              Entrega preferida:{' '}
              <span className="text-white">
                {metodoEntrega === 'retiro'
                  ? 'Retiro en persona'
                  : 'Envío a coordinar'}
              </span>
            </p>

            <p className="text-xs text-[#91A5BF] mt-2">
              Esta preferencia todavía no se guarda en la orden.
              Tendrás que acordarla con el vendedor.
            </p>

            {errorCompra && (
              <p role="alert" className="text-red-400 text-sm mt-4">
                {errorCompra}
              </p>
            )}

            <div className="flex gap-3 mt-7">
              <button
                type="button"
                disabled={enviando}
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 border border-[#34465F] hover:bg-[#263952] rounded-lg py-3 text-sm text-white disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={enviando}
                onClick={confirmarCompra}
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
              >
                {enviando ? 'Procesando...' : 'Confirmar orden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

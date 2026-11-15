
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
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OfertaExistente {
  producto_id: number;
  estado: string;
  me_toca_responder?: boolean;
}

interface RespuestaOferta {
  error?: string;
  mensaje?: string;
}

function precioAR(valor: number | string): string {
  return Number(valor).toLocaleString('es-AR', {
    maximumFractionDigits: 2,
  });
}

export default function Ofertar() {
  const [parametros] = useSearchParams();
  const navigate = useNavigate();
  const id = parametros.get('id');

  const [prenda, setPrenda] = useState<Prenda | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [montoOferta, setMontoOferta] = useState('');
  const [comentario, setComentario] = useState('');

  const [comprobandoOfertas, setComprobandoOfertas] =
    useState(true);
  const [ofertaPendiente, setOfertaPendiente] =
    useState(false);
  const [errorComprobacion, setErrorComprobacion] =
    useState('');

  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);
  const [mostrarComoFunciona, setMostrarComoFunciona] =
    useState(false);

  const [enviando, setEnviando] = useState(false);
  const [ofertaEnviada, setOfertaEnviada] = useState(false);
  const [errorOferta, setErrorOferta] = useState('');

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
    setPrenda(null);
    setOfertaPendiente(false);
    setOfertaEnviada(false);
    setErrorOferta('');
    setErrorComprobacion('');
    setComentario('');
    setMostrarConfirmacion(false);
    setMostrarComoFunciona(false);

    getPrenda(id)
      .then((datos) => {
        if (!activo) return;

        setPrenda(datos ?? null);

        if (datos) {
          const precio = Number(datos.precio);
          const sugerido = Math.max(
            1,
            Math.floor(precio * 0.85)
          );

          setMontoOferta(String(sugerido));
        }
      })
      .catch(() => {
        if (activo) {
          setError('No se pudo cargar la prenda.');
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  // COMPROBAR OFERTAS EXISTENTES
  useEffect(() => {
    if (!prenda) {
      setComprobandoOfertas(false);
      return;
    }

    const prendaId = Number(prenda.id);
    const token = localStorage.getItem('token');

    if (!token) {
      setComprobandoOfertas(false);
      return;
    }

    let activo = true;

    async function revisarOfertas() {
      setComprobandoOfertas(true);
      setErrorComprobacion('');

      try {
        const respuesta = await fetch(
          `${API_URL}/mis_contraofertas`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

        if (!respuesta.ok) {
          throw new Error(
            'No se pudieron consultar tus ofertas.'
          );
        }

        const datos = await respuesta.json();

        const lista: OfertaExistente[] =
          Array.isArray(datos)
            ? datos
            : Array.isArray(datos.ofertas)
              ? datos.ofertas
              : [];

        if (!activo) return;

        const pendiente = lista.some(
          (oferta) =>
            Number(oferta.producto_id) === prendaId &&
            oferta.estado === 'pendiente' &&
            oferta.me_toca_responder === false
        );

        setOfertaPendiente(pendiente);
      } catch (err) {
        if (activo) {
          setErrorComprobacion(
            err instanceof Error
              ? err.message
              : 'No se pudieron consultar tus ofertas.'
          );
        }
      } finally {
        if (activo) setComprobandoOfertas(false);
      }
    }

    void revisarOfertas();

    return () => {
      activo = false;
    };
  }, [prenda]);

  // CERRAR POPUPS CON ESCAPE
  useEffect(() => {
    if (!mostrarConfirmacion && !mostrarComoFunciona) {
      return;
    }

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return;

      if (!enviando) {
        setMostrarConfirmacion(false);
        setMostrarComoFunciona(false);
      }
    }

    window.addEventListener('keydown', cerrarConEscape);

    return () => {
      window.removeEventListener(
        'keydown',
        cerrarConEscape
      );
    };
  }, [
    mostrarConfirmacion,
    mostrarComoFunciona,
    enviando,
  ]);

  const precioPublicado = prenda
    ? Number(prenda.precio)
    : 0;

  // Límite interno: 50% más que el precio publicado.
  const maximoOferta = Math.max(
    1,
    Math.floor(precioPublicado * 1.5)
  );

  const monto = Number(montoOferta);

  const montoValido =
    montoOferta.trim() !== '' &&
    Number.isFinite(monto) &&
    Number.isInteger(monto) &&
    monto >= 1 &&
    monto <= maximoOferta;

  const diferencia = montoValido
    ? monto - precioPublicado
    : 0;

  const porcentajeDiferencia =
    montoValido && precioPublicado > 0
      ? Math.round(
          (Math.abs(diferencia) / precioPublicado) * 100
        )
      : 0;

  const controlesDeshabilitados =
    enviando || ofertaEnviada || ofertaPendiente;

  function abrirConfirmacion() {
    if (
      !prenda ||
      controlesDeshabilitados ||
      comprobandoOfertas ||
      errorComprobacion
    ) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    if (!montoValido) {
      setErrorOferta(
        'Ingresá un precio válido para tu oferta.'
      );
      return;
    }

    setErrorOferta('');
    setMostrarConfirmacion(true);
  }

  function cerrarConfirmacion() {
    if (enviando) return;

    setMostrarConfirmacion(false);
    setErrorOferta('');
  }

  async function confirmarOferta() {
    if (
      !prenda ||
      !montoValido ||
      controlesDeshabilitados
    ) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setEnviando(true);
    setErrorOferta('');

    try {
      const respuesta = await fetch(
        `${API_URL}/contraofertas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            producto_id: Number(prenda.id),
            nuevo_precio: monto,
            comentario: comentario.trim(),
          }),
        }
      );

      const datos: RespuestaOferta =
        await respuesta.json().catch(() => ({}));

      if (respuesta.status === 401) {
        setMostrarConfirmacion(false);
        navigate('/login');
        return;
      }

      if (!respuesta.ok) {
        if (
          datos.error?.toLowerCase().includes(
            'oferta pendiente'
          )
        ) {
          setOfertaPendiente(true);
        }

        throw new Error(
          datos.error || 'No se pudo enviar la oferta.'
        );
      }

      setMostrarConfirmacion(false);
      setOfertaEnviada(true);
      setOfertaPendiente(true);
    } catch (err) {
      console.error('Error al enviar oferta:', err);

      setErrorOferta(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al enviar la oferta.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#0D1628] text-[#E7ECF5] flex flex-col">
      {/* HEADER */}
      <header className="bg-[#0B1528] border-b border-[#243754] shrink-0">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center">
          <Link
            to={prenda ? `/prenda/${prenda.id}` : '/'}
            className="flex items-center gap-2 text-sm text-[#A9BAD0] hover:text-white transition-colors"
          >
            <span className="text-xl">←</span>
            Volver al producto
          </Link>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-5 flex-1">
        {/* TÍTULO */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Hacer una oferta
            </h1>

            <p className="text-sm text-[#A9BAD0] mt-2">
              Elegí el precio que querés ofrecer por la prenda.
            </p>
          </div>

          {/* BOTÓN CÓMO FUNCIONA */}
          <button
            type="button"
            onClick={() => setMostrarComoFunciona(true)}
            className="shrink-0 flex items-center gap-2 bg-[#172A45] hover:bg-[#213C5D] border border-[#36577A] rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-white cursor-pointer transition-colors"
          >
            <img
              src="/comofunciona.png"
              alt=""
              className="w-5 h-5 object-contain brightness-0 invert"
            />
            ¿Cómo funciona?
          </button>
        </div>

        {cargando ? (
          <p className="text-[#A9BAD0] py-12">
            Cargando información...
          </p>
        ) : error || !prenda ? (
          <div className="bg-[#172A45] border border-[#294768] rounded-xl p-6">
            <p className="text-red-400">
              {error || 'Prenda no encontrada.'}
            </p>

            <Link
              to="/"
              className="inline-block mt-4 text-[#93C5FD]"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-4 items-start">
            {/* COLUMNA IZQUIERDA */}
            <div className="flex flex-col gap-4">
              {/* PRENDA */}
              <section className="bg-[#1C293E] border border-[#294768] rounded-xl p-4">
                <h2 className="text-sm font-semibold text-white mb-3">
                  Prenda seleccionada
                </h2>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-[#102039] rounded-lg overflow-hidden">
                    {prenda.imagenes[0] ? (
                      <img
                        src={prenda.imagenes[0]}
                        alt={prenda.titulo}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#91A5BF]">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white">
                      {prenda.titulo}
                    </h3>

                    <p className="text-xs text-[#A9BAD0] mt-1">
                      {prenda.marca}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-[#294367] rounded-full px-3 py-1 text-xs">
                        Talle {prenda.talle}
                      </span>

                      <span className="bg-[#294367] rounded-full px-3 py-1 text-xs">
                        {prenda.estado}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-[#A9BAD0]">
                      Publicado por {prenda.usuario}
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end border-l border-[#34465F] pl-4">
                    <p className="text-xs text-[#91A5BF]">
                      Precio publicado
                    </p>

                    <p className="text-xl font-bold text-white mt-1">
                      ${precioAR(precioPublicado)}
                    </p>
                  </div>
                </div>
              </section>

              {/* FORMULARIO */}
              <section className="bg-[#1C293E] border border-[#294768] rounded-xl p-4 sm:p-5">
                <h2 className="text-base font-semibold text-white">
                  Tu propuesta
                </h2>

                <label
                  htmlFor="monto-oferta"
                  className="block text-sm text-[#D5E3F4] mt-4 mb-2"
                >
                  ¿Cuánto querés ofrecer?
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-[#A9BAD0]">
                    $
                  </span>

                  <input
                    id="monto-oferta"
                    type="number"
                    min={1}
                    max={maximoOferta}
                    step={1}
                    value={montoOferta}
                    disabled={controlesDeshabilitados}
                    onChange={(evento) => {
                      setMontoOferta(evento.target.value);
                      setErrorOferta('');
                    }}
                    className="w-full rounded-lg border border-[#36577A] bg-[#0B192D] pl-10 pr-4 py-3 text-lg font-bold text-white outline-none focus:border-[#3B82F6] disabled:opacity-50"
                  />
                </div>

                {/* DESLIZADOR */}
                <input
                  type="range"
                  min={1}
                  max={maximoOferta}
                  step={1}
                  value={Math.min(
                    Math.max(1, monto || 1),
                    maximoOferta
                  )}
                  disabled={controlesDeshabilitados}
                  onChange={(evento) =>
                    setMontoOferta(evento.target.value)
                  }
                  aria-label="Ajustar precio ofertado"
                  className="w-full mt-4 accent-[#2563EB] cursor-pointer disabled:opacity-50"
                />

                {/* DIFERENCIA DE PRECIO */}
                {montoValido && (
                  <div className="mt-3 rounded-lg bg-[#14243B] border border-[#36577A] px-4 py-3 flex flex-wrap justify-between items-center gap-2">
                    <span className="text-xs text-[#A9BAD0]">
                      {diferencia > 0
                        ? 'Por encima del precio publicado'
                        : diferencia < 0
                          ? 'Por debajo del precio publicado'
                          : 'Igual al precio publicado'}
                    </span>

                    <span
                      className={`text-sm font-semibold ${
                        diferencia > 0
                          ? 'text-amber-300'
                          : diferencia < 0
                            ? 'text-emerald-300'
                            : 'text-white'
                      }`}
                    >
                      {diferencia > 0
                        ? `+$${precioAR(diferencia)} (+${porcentajeDiferencia}%)`
                        : diferencia < 0
                          ? `-$${precioAR(Math.abs(diferencia))} (-${porcentajeDiferencia}%)`
                          : 'Sin diferencia'}
                    </span>
                  </div>
                )}

                {/* COMENTARIO SIN TEXTO DE EJEMPLO */}
                <label
                  htmlFor="comentario-oferta"
                  className="block text-sm text-[#D5E3F4] mt-4 mb-2"
                >
                  Mensaje para el vendedor (opcional)
                </label>

                <textarea
                  id="comentario-oferta"
                  rows={3}
                  value={comentario}
                  disabled={controlesDeshabilitados}
                  onChange={(evento) =>
                    setComentario(evento.target.value)
                  }
                  className="w-full rounded-lg border border-[#36577A] bg-[#0B192D] px-4 py-3 text-sm text-white outline-none focus:border-[#3B82F6] resize-none disabled:opacity-50"
                />
              </section>
            </div>

            {/* COLUMNA DERECHA */}
            <aside className="bg-[#1C293E] border border-[#294768] rounded-xl p-5 lg:sticky lg:top-5">
              <h2 className="text-lg font-semibold text-white">
                Resumen de tu oferta
              </h2>

              <div className="border-t border-[#34465F] mt-5 pt-4">
                <p className="text-sm font-medium text-white">
                  {prenda.titulo}
                </p>

                <p className="text-xs text-[#91A5BF] mt-1">
                  {prenda.marca} · Talle {prenda.talle}
                </p>
              </div>

              <div className="border-t border-[#34465F] mt-5 pt-4 space-y-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-[#A9BAD0]">
                    Precio publicado
                  </span>

                  <span className="text-white">
                    ${precioAR(precioPublicado)}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    Tu oferta
                  </span>

                  <span className="text-2xl font-bold text-white">
                    {montoValido
                      ? `$${precioAR(monto)}`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* RESULTADO */}
              {ofertaEnviada ? (
                <div
                  role="status"
                  className="mt-6 rounded-lg border border-[#256D58] bg-[#10372F] p-4"
                >
                  <p className="text-sm font-semibold text-emerald-300">
                    ¡Oferta enviada!
                  </p>

                  <p className="text-xs text-[#C4D8D2] mt-2">
                    El vendedor recibió tu propuesta.
                    Si la acepta, se creará una orden de compra.
                  </p>

                  <Link
                    to="/"
                    className="block mt-4 w-full rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-center py-3 text-sm font-semibold text-white"
                  >
                    Volver al catálogo
                  </Link>
                </div>
              ) : ofertaPendiente ? (
                <div className="mt-6 rounded-lg border border-[#36577A] bg-[#14243B] p-4">
                  <p className="text-sm font-semibold text-white">
                    Ya tenés una oferta pendiente
                  </p>

                  <p className="text-xs text-[#A9BAD0] mt-2">
                    No podés enviar otra hasta que se resuelva.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={abrirConfirmacion}
                  disabled={
                    !montoValido ||
                    enviando ||
                    comprobandoOfertas ||
                    Boolean(errorComprobacion)
                  }
                  className="mt-6 w-full rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] py-3.5 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {comprobandoOfertas
                    ? 'Verificando...'
                    : 'Enviar oferta'}
                </button>
              )}

              {errorComprobacion && (
                <p role="alert" className="mt-3 text-xs text-red-400">
                  {errorComprobacion}
                </p>
              )}

              {errorOferta && !mostrarConfirmacion && (
                <p role="alert" className="mt-3 text-sm text-red-400">
                  {errorOferta}
                </p>
              )}

              <p className="text-xs text-[#91A5BF] mt-5 leading-relaxed">
                La oferta no reserva la prenda ni genera
                una compra automáticamente. El vendedor
                debe aceptarla primero.
              </p>

              <div className="border-t border-[#34465F] mt-5 pt-4">
                <Link
                  to={`/prenda/${prenda.id}`}
                  className="text-sm text-[#75A7F8] hover:text-white"
                >
                  Volver al producto
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* POPUP: CÓMO FUNCIONA */}
      {mostrarComoFunciona && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              setMostrarComoFunciona(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-como-funciona-oferta"
            className="w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-2xl border border-[#36577A] bg-[#14243B] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-[#294768]">
              <div className="flex items-center gap-3">
                <img
                  src="/comofunciona.png"
                  alt=""
                  className="w-7 h-7 object-contain brightness-0 invert"
                />

                <h2
                  id="titulo-como-funciona-oferta"
                  className="text-lg font-bold text-white"
                >
                  ¿Cómo funciona?
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMostrarComoFunciona(false)}
                aria-label="Cerrar"
                className="text-[#A9BAD0] hover:text-white text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="space-y-5">
                {[
                  {
                    titulo: 'Elegís tu precio',
                    descripcion:
                      'Ingresás cuánto querés ofrecer por la prenda y, si querés, agregás un mensaje.',
                  },
                  {
                    titulo: 'Enviás la oferta',
                    descripcion:
                      'El vendedor recibe una notificación con tu propuesta.',
                  },
                  {
                    titulo: 'El vendedor responde',
                    descripcion:
                      'Puede aceptar o rechazar la oferta desde Mis publicaciones.',
                  },
                  {
                    titulo: 'Si acepta, se genera una compra',
                    descripcion:
                      'Se registra una orden al precio acordado, que aparece en Mis pedidos.',
                  },
                  {
                    titulo: 'Coordinan el pago y la entrega',
                    descripcion:
                      'Una vez aceptada, pueden coordinar los detalles por mensaje.',
                  },
                ].map((paso, indice) => (
                  <div
                    key={paso.titulo}
                    className="flex items-start gap-3"
                  >
                    <span className="w-8 h-8 shrink-0 rounded-full bg-[#2563EB] text-white text-sm font-bold flex items-center justify-center">
                      {indice + 1}
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        {paso.titulo}
                      </p>

                      <p className="text-sm text-[#A9BAD0] mt-1 leading-relaxed">
                        {paso.descripcion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMostrarComoFunciona(false)}
                className="mt-7 w-full rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-semibold text-white cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DE CONFIRMACIÓN DE OFERTA */}
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
            aria-labelledby="titulo-confirmar-oferta"
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#36577A] bg-[#14243B] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5">
              <div className="w-12 h-12 rounded-xl bg-[#213B5D] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#93C5FD"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7"
                >
                  <path d="M12 2v20" />
                  <path d="M17 6H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H7" />
                </svg>
              </div>

              <button
                type="button"
                onClick={cerrarConfirmacion}
                disabled={enviando}
                aria-label="Cerrar"
                className="text-[#A9BAD0] hover:text-white text-xl disabled:opacity-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pt-4 pb-6">
              <h2
                id="titulo-confirmar-oferta"
                className="text-xl font-bold text-white"
              >
                ¿Confirmás tu oferta?
              </h2>

              <p className="mt-3 text-sm text-[#B9C9DC] leading-relaxed">
                Vas a ofrecer{' '}
                <span className="font-semibold text-white">
                  ${precioAR(monto)}
                </span>{' '}
                por{' '}
                <span className="font-semibold text-white">
                  {prenda.titulo}
                </span>.
              </p>

              <div className="mt-5 rounded-lg border border-[#294768] bg-[#0E1D32] p-4">
                <p className="text-sm text-[#D5E3F4]">
                  El vendedor recibirá tu propuesta
                  y podrá aceptarla o rechazarla.
                </p>

                <p className="text-xs text-[#91A5BF] mt-3 leading-relaxed">
                  Enviar una oferta no reserva la prenda.
                  Si el vendedor la acepta, se creará
                  una orden al precio ofrecido.
                </p>
              </div>

              {comentario.trim() && (
                <div className="mt-4 rounded-lg border border-[#294768] p-4">
                  <p className="text-xs text-[#91A5BF] mb-2">
                    Mensaje para el vendedor
                  </p>

                  <p className="text-sm text-[#D5E3F4] whitespace-pre-line">
                    {comentario.trim()}
                  </p>
                </div>
              )}

              {errorOferta && (
                <p role="alert" className="mt-4 text-sm text-red-400">
                  {errorOferta}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarConfirmacion}
                  disabled={enviando}
                  className="rounded-lg border border-[#36577A] bg-[#172A45] py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void confirmarOferta()}
                  disabled={enviando}
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                >
                  {enviando
                    ? 'Enviando...'
                    : 'Confirmar oferta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

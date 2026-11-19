
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getPrenda,
  type Prenda,
} from '../features/browse/api/prendas';
import ReportarModal from '../components/ReportarModal';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ResenaProducto {
  id: number;
  estrellas: number;
  comentario: string | null;
  fecha: string;
  nombre_usuario: string;
  foto_perfil: string | null;
}

interface ResumenResenas {
  cantidad: number;
  promedio: number | null;
  resenas: ResenaProducto[];
}

interface UsuarioPublico {
  id: number;
  nombre_usuario: string;
}

function formatearFecha(fecha: string) {
  const valor = new Date(fecha);

  return Number.isNaN(valor.getTime())
    ? 'Fecha no disponible'
    : valor.toLocaleDateString('es-AR');
}

export default function VistaArticulo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prenda, setPrenda] = useState<Prenda | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  const [resenas, setResenas] =
    useState<ResumenResenas | null>(null);
  const [cargandoResenas, setCargandoResenas] =
    useState(true);
  const [errorResenas, setErrorResenas] = useState('');

  const [mostrarReporte, setMostrarReporte] =
    useState(false);
  const [usuarioVendedorId, setUsuarioVendedorId] =
    useState<number | null>(null);
  const [cargandoVendedor, setCargandoVendedor] =
    useState(false);
  const [errorReporte, setErrorReporte] = useState('');

  // CARGAR INFORMACIÓN DE LA PRENDA
  useEffect(() => {
    if (!id) {
      setPrenda(null);
      setCargando(false);
      return;
    }

    let activo = true;

    setCargando(true);
    setError('');
    setPrenda(null);
    setMostrarDetalles(false);
    setUsuarioVendedorId(null);
    setMostrarReporte(false);
    setErrorReporte('');

    getPrenda(id)
      .then((datos) => {
        if (activo) setPrenda(datos ?? null);
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

  // CARGAR CALIFICACIONES PÚBLICAS
  useEffect(() => {
    if (!id) {
      setCargandoResenas(false);
      return;
    }

    let activo = true;

    async function cargarResenas() {
      try {
        setCargandoResenas(true);
        setErrorResenas('');
        setResenas(null);

        const respuesta = await fetch(
          `${API_URL}/productos/${encodeURIComponent(id!)}/resenas`
        );

        if (!respuesta.ok) {
          throw new Error(
            'No se pudieron cargar las calificaciones.'
          );
        }

        const datos: ResumenResenas =
          await respuesta.json();

        if (activo) {
          setResenas(datos);
        }
      } catch (err) {
        if (activo) {
          setErrorResenas(
            err instanceof Error
              ? err.message
              : 'Error al cargar las reseñas.'
          );
        }
      } finally {
        if (activo) {
          setCargandoResenas(false);
        }
      }
    }

    void cargarResenas();

    return () => {
      activo = false;
    };
  }, [id]);

  // REPORTAR PUBLICACIÓN
  async function abrirReporte() {
    if (!prenda || cargandoVendedor) return;

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setErrorReporte('');

    if (usuarioVendedorId !== null) {
      setMostrarReporte(true);
      return;
    }

    setCargandoVendedor(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/usuarios/${encodeURIComponent(
          prenda.usuario
        )}`
      );

      if (!respuesta.ok) {
        throw new Error(
          'No se pudo identificar al vendedor.'
        );
      }

      const datos: UsuarioPublico =
        await respuesta.json();

      if (!Number.isInteger(Number(datos.id))) {
        throw new Error(
          'El servidor no devolvió un ID de vendedor válido.'
        );
      }

      const vendedorId = Number(datos.id);

      const respuestaYo = await fetch(
        `${API_URL}/yo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (respuestaYo.ok) {
        const datosYo = await respuestaYo.json();

        if (
          Number(datosYo.usuario?.id) === vendedorId
        ) {
          throw new Error(
            'No podés reportar tu propia publicación.'
          );
        }
      }

      setUsuarioVendedorId(vendedorId);
      setMostrarReporte(true);
    } catch (err) {
      setErrorReporte(
        err instanceof Error
          ? err.message
          : 'No se pudo abrir el reporte.'
      );
    } finally {
      setCargandoVendedor(false);
    }
  }

  function irAComprar() {
    if (!prenda) return;

    navigate(
      `/comprar?id=${encodeURIComponent(prenda.id)}`
    );
  }

  function irAOfertar() {
    if (!prenda) return;

    navigate(
      `/ofertar?id=${encodeURIComponent(prenda.id)}`
    );
  }

  if (cargando || error || !prenda) {
    return (
      <div className="min-h-screen bg-[#0D1628] flex flex-col items-center justify-center gap-4">
        <p className="text-[#A9BAD0]">
          {cargando
            ? 'Cargando prenda...'
            : error || 'Prenda no encontrada.'}
        </p>

        {!cargando && (
          <Link
            to="/"
            className="bg-[#2563EB] text-white rounded-lg px-5 py-2.5"
          >
            Volver al inicio
          </Link>
        )}
      </div>
    );
  }

  const precioFormateado = Number(
    prenda.precio
  ).toLocaleString('es-AR');

  const fecha = prenda.fechaPublicacion
    ? new Date(
        prenda.fechaPublicacion
      ).toLocaleDateString('es-AR')
    : 'No especificada';

  const detalles = [
    {
      nombre: 'Tipo de prenda',
      valor: prenda.tipoPrenda,
    },
    {
      nombre: 'Color',
      valor: prenda.color,
    },
    {
      nombre: 'Género',
      valor: prenda.genero,
    },
    {
      nombre: 'Stock',
      valor: prenda.stock > 0 ? prenda.stock : null,
    },
    {
      nombre: 'Fecha de publicación',
      valor: fecha,
    },
  ];

  return (
    <div className="min-h-dvh bg-[#0D1628] text-[#E7ECF5]">
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-6">

        {/* VOLVER */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#A9BAD0] hover:text-white transition-colors mb-6"
        >
          <span className="w-9 h-9 rounded-full bg-[#172A45] flex items-center justify-center">
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
          </span>

          Volver a publicaciones
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* IMAGEN */}
          <div className="w-full aspect-square max-h-[65vh] bg-[#102039] border border-[#294768] rounded-xl overflow-hidden flex items-center justify-center">
            {prenda.imagenes[0] ? (
              <img
                src={prenda.imagenes[0]}
                alt={prenda.titulo}
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-[#8195AE] text-sm">
                Sin imagen
              </p>
            )}
          </div>

          {/* DATOS DE LA PRENDA */}
          <div className="flex flex-col min-w-0">

            {/* TÍTULO CON INTER */}
            <h1
              className="text-[22px] sm:text-2xl text-white leading-snug"
              style={{
                fontFamily: "'Inter', Arial, sans-serif",
                fontWeight: 600,
                letterSpacing: '-0.015em',
              }}
            >
              {prenda.titulo}
            </h1>

            <p className="text-[#A9BAD0] mt-2">
              {prenda.marca}
            </p>

            <p className="text-white font-bold text-3xl sm:text-4xl mt-4">
              ${precioFormateado}
            </p>

            {/* RESUMEN DE CALIFICACIONES */}
            {resenas && resenas.cantidad > 0 && (
              <a
                href="#resenas-prenda"
                className="inline-flex items-center gap-2 mt-3 text-sm text-[#D5E3F4] hover:text-white"
              >
                <span className="text-amber-400">
                  ★
                </span>

                <span className="font-semibold">
                  {resenas.promedio?.toLocaleString('es-AR') ??
                    '-'}
                </span>

                <span className="text-[#91A5BF]">
                  ({resenas.cantidad}{' '}
                  {resenas.cantidad === 1
                    ? 'calificación'
                    : 'calificaciones'})
                </span>
              </a>
            )}

            {/* CARACTERÍSTICAS PRINCIPALES */}
            <div className="bg-[#0E1D32] border border-[#294768] rounded-xl mt-5 px-5">
              <div className="flex items-center gap-4 py-3.5 border-b border-[#253854]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#75A7F8"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7 shrink-0"
                >
                  <path d="m16 4 4 3-3 5-3-2v11H6V10l-3 2-2-5 5-3 3 2Z" />
                </svg>

                <div>
                  <p className="text-xs text-[#91A5BF]">
                    Talle
                  </p>

                  <p className="text-sm font-semibold text-white">
                    {prenda.talle || 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-3.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#75A7F8"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7 shrink-0"
                >
                  <path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5l-8-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>

                <div>
                  <p className="text-xs text-[#91A5BF]">
                    Estado de la prenda
                  </p>

                  <p className="text-sm font-semibold text-white">
                    {prenda.estado || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* ACCIONES DE COMPRA */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={irAComprar}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl py-3.5 font-semibold transition-colors cursor-pointer"
              >
                Solicitá tu compra
              </button>

              <button
                type="button"
                onClick={irAOfertar}
                className="border border-[#3B82F6] hover:bg-[#172A45] text-[#E7ECF5] rounded-xl py-3.5 font-semibold transition-colors cursor-pointer"
              >
                Ofertar
              </button>
            </div>

            {/* MENSAJES */}
            <button
              type="button"
              onClick={() =>
                navigate(`/chat/${prenda.id}`)
              }
              className="mt-3 w-full border border-[#294768] bg-[#172A45] hover:bg-[#213C5D] text-[#E7ECF5] rounded-xl py-3 font-medium transition-colors cursor-pointer"
            >
              Enviar mensaje
            </button>

            {/* CALIFICACIONES DE COMPRADORES */}
            <section
              id="resenas-prenda"
              className="mt-6 bg-[#0E1D32] border border-[#294768] rounded-xl p-4 sm:p-5 scroll-mt-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-base sm:text-lg font-semibold text-white">
                  Calificaciones de compradores
                </h2>

                {resenas && resenas.cantidad > 0 && (
                  <span className="text-sm text-[#D5E3F4]">
                    <span className="text-amber-400">
                      ★
                    </span>{' '}
                    {resenas.promedio?.toLocaleString('es-AR')}{' '}
                    · {resenas.cantidad}
                  </span>
                )}
              </div>

              {cargandoResenas ? (
                <p className="text-sm text-[#A9BAD0]">
                  Cargando calificaciones...
                </p>
              ) : errorResenas ? (
                <p className="text-sm text-red-400">
                  {errorResenas}
                </p>
              ) : !resenas || resenas.resenas.length === 0 ? (
                <p className="text-sm text-[#A9BAD0]">
                  Esta prenda todavía no tiene calificaciones
                  de compradores.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {resenas.resenas.map((resena) => (
                    <article
                      key={resena.id}
                      className="bg-[#152943] border border-[#294768] rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#172A45] border border-[#294768] overflow-hidden flex items-center justify-center shrink-0">
                          {resena.foto_perfil ? (
                            <img
                              src={resena.foto_perfil}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[#A9BAD0]">
                              {resena.nombre_usuario
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-white">
                            {resena.nombre_usuario}
                          </p>

                          <p className="text-xs text-[#91A5BF]">
                            {formatearFecha(resena.fecha)}
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 text-amber-400 text-lg mt-3"
                        aria-label={`${resena.estrellas} de 5 estrellas`}
                      >
                        {[1, 2, 3, 4, 5].map((numero) => (
                          <span key={numero}>
                            {numero <= resena.estrellas
                              ? '★'
                              : '☆'}
                          </span>
                        ))}
                      </div>

                      {resena.comentario && (
                        <p className="text-sm text-[#D5E3F4] mt-2 whitespace-pre-line">
                          {resena.comentario}
                        </p>
                      )}

                      <span className="inline-block mt-3 text-xs text-[#93C5FD] bg-[#172A45] rounded-full px-3 py-1">
                        Compra verificada
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* MÁS INFORMACIÓN */}
            <div className="mt-6 border-t border-[#294768] pt-4">
              <button
                type="button"
                onClick={() =>
                  setMostrarDetalles(!mostrarDetalles)
                }
                aria-expanded={mostrarDetalles}
                className="w-full flex items-center justify-between text-sm text-[#B9C9DC] hover:text-white transition-colors cursor-pointer"
              >
                <span className="font-medium">
                  Más información de la prenda
                </span>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-4 h-4 transition-transform ${
                    mostrarDetalles ? 'rotate-180' : ''
                  }`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {mostrarDetalles && (
                <div className="mt-4 space-y-3">
                  {detalles.map((detalle) => (
                    <div
                      key={detalle.nombre}
                      className="flex justify-between items-start gap-4 text-sm"
                    >
                      <span className="text-[#91A5BF]">
                        {detalle.nombre}
                      </span>

                      <span className="text-[#E7ECF5] text-right">
                        {detalle.valor || 'No especificado'}
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-[#253854]">
                    <p className="text-[#91A5BF] text-sm mb-2">
                      Descripción
                    </p>

                    <p className="text-[#D1DCEB] text-sm leading-relaxed whitespace-pre-line">
                      {prenda.descripcion ||
                        'Sin descripción.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* VENDEDOR */}
            <div className="flex items-center gap-3 mt-7">
              <div className="w-11 h-11 rounded-full bg-[#172A45] border border-[#294768] flex items-center justify-center text-[#A9BAD0]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </div>

              <div>
                <p className="text-xs text-[#91A5BF]">
                  Publicado por
                </p>

                <Link
                  to={`/usuario/${encodeURIComponent(
                    prenda.usuario
                  )}`}
                  className="text-white font-semibold text-sm hover:text-[#75A7F8] transition-colors"
                >
                  {prenda.usuario}
                </Link>
              </div>
            </div>

            {/* REPORTAR PUBLICACIÓN */}
            <div className="mt-5">
              <button
                type="button"
                onClick={abrirReporte}
                disabled={cargandoVendedor}
                className="text-sm text-red-300 hover:text-red-200 underline underline-offset-4 disabled:opacity-50 cursor-pointer"
              >
                {cargandoVendedor
                  ? 'Cargando...'
                  : 'Reportar publicación'}
              </button>

              {errorReporte && (
                <p
                  role="alert"
                  className="mt-2 text-xs text-red-400"
                >
                  {errorReporte}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE REPORTE */}
      {usuarioVendedorId !== null && (
        <ReportarModal
          abierto={mostrarReporte}
          onCerrar={() => setMostrarReporte(false)}
          usuarioReportadoId={usuarioVendedorId}
          nombreUsuario={prenda.usuario}
          tipo="publicacion"
          publicacionId={Number(prenda.id)}
          tituloPublicacion={prenda.titulo}
        />
      )}
    </div>
  );
}


import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ReportarModal from './../components/ReportarModal';

interface Perfil {
  id: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  instagram?: string;
  verificado: boolean;
  foto_perfil?: string;
  publicaciones_disponibles: number;
  ventas_entregadas: number;
  relatos_recibidos: number;
}

interface Publicacion {
  id: number;
  titulo: string;
  precio: number;
  foto: string;
  marca: string;
  talle: string;
  estado_condicion: string;
  color?: string;
  tipo_prenda?: string;
  subtipo_prenda?: string;
  fecha_publicacion: string;
}

interface ResenaVendedor {
  id: number;
  comentario: string;
  fecha: string;
  titulo: string;
  comprador_nombre_usuario: string;
  comprador_foto_perfil: string | null;
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PerfilUsuario() {
  const { id } = useParams();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [publicaciones, setPublicaciones] =
    useState<Publicacion[]>([]);
  const [resenas, setResenas] =
    useState<ResenaVendedor[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorResenas, setErrorResenas] = useState('');
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [esMiPerfil, setEsMiPerfil] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Usuario no encontrado.');
      setCargando(false);
      return;
    }

    let activo = true;

    async function cargarPerfil() {
      try {
        setCargando(true);
        setError('');
        setErrorResenas('');
        setPerfil(null);
        setPublicaciones([]);
        setResenas([]);
        setEsMiPerfil(false);

        const respuestaPerfil = await fetch(
          `${API_URL}/usuarios/${encodeURIComponent(id!)}`
        );

        if (!respuestaPerfil.ok) {
          throw new Error('No se pudo encontrar el usuario.');
        }

        const datosPerfil: Perfil =
          await respuestaPerfil.json();

        if (!activo) return;
        setPerfil(datosPerfil);

        const token = localStorage.getItem('token');

        // Saber si estamos viendo nuestro propio perfil.
        if (token) {
          try {
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

              if (activo) {
                setEsMiPerfil(
                  Number(datosYo.usuario?.id) ===
                    Number(datosPerfil.id)
                );
              }
            }
          } catch {
            // El perfil público debe seguir funcionando
            // aunque no se pueda consultar la sesión.
          }
        }

        const respuestaPublicaciones = await fetch(
          `${API_URL}/publicaciones/${datosPerfil.id}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {},
          }
        );

        if (!respuestaPublicaciones.ok) {
          throw new Error(
            'No se pudieron cargar las publicaciones.'
          );
        }

        const datosPublicaciones: Publicacion[] =
          await respuestaPublicaciones.json();

        if (activo) {
          setPublicaciones(datosPublicaciones);
        }

        // EXPERIENCIAS DE COMPRADORES VERIFICADOS
        try {
          const respuestaResenas = await fetch(
            `${API_URL}/usuarios/${encodeURIComponent(
              datosPerfil.nombre_usuario
            )}/resenas`
          );

          if (!respuestaResenas.ok) {
            throw new Error(
              'No se pudieron cargar las reseñas.'
            );
          }

          const datosResenas = await respuestaResenas.json();

          if (activo) {
            setResenas(
              Array.isArray(datosResenas)
                ? datosResenas
                : []
            );
          }
        } catch {
          if (activo) {
            setErrorResenas(
              'No se pudieron cargar las experiencias de compra.'
            );
          }
        }
      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : 'Ocurrió un error al cargar el perfil.'
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargarPerfil();

    return () => {
      activo = false;
    };
  }, [id]);

  function formatearFecha(fecha: string) {
    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return 'Fecha no disponible';
    }

    return valor.toLocaleDateString('es-AR');
  }

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5] flex flex-col">
      <Header mostrarBusqueda={false} />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-[#A9BAD0]">
              Cargando perfil...
            </p>
          </div>
        ) : error || !perfil ? (
          <div className="flex flex-col items-center justify-center gap-5 py-20">
            <p className="text-red-400">
              {error || 'Usuario no encontrado.'}
            </p>

            <Link
              to="/"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <>
            {/* INFORMACIÓN DEL USUARIO */}
            <section className="border-b border-[#253854] pb-6 mb-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* FOTO DE PERFIL */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#172A45] border border-[#294768] overflow-hidden flex items-center justify-center shrink-0">
                    {perfil.foto_perfil ? (
                      <img
                        src={perfil.foto_perfil}
                        alt={`Foto de ${perfil.nombre_usuario}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-8 h-8 text-[#A9BAD0]"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21a8 8 0 0 1 16 0Z" />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-xl sm:text-2xl font-bold text-white truncate">
                        {perfil.nombre_usuario}
                      </h1>

                      {perfil.verificado && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="#3B82F6"
                          className="w-5 h-5 shrink-0"
                          aria-label="Usuario verificado"
                        >
                          <path d="M12 2 15 4l4-.3.3 4L22 11l-2 4 .3 4-4 .3L12 22l-4-2.7-4 .3-.3-4L2 12l2.7-4-.3-4 4 .3L12 2Z" />
                          <path
                            d="m8 12 2.5 2.5L16 9"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    <p className="text-sm text-[#A9BAD0] mt-1">
                      {publicaciones.length}{' '}
                      {publicaciones.length === 1
                        ? 'publicación'
                        : 'publicaciones'}
                    </p>
                  </div>
                </div>

                {/* REPORTAR USUARIO */}
                {!esMiPerfil && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!localStorage.getItem('token')) {
                        window.location.assign('/login');
                        return;
                      }
                      setMostrarReporte(true);
                    }}
                    className="border border-red-400/40 text-red-300 hover:bg-red-500/10 rounded-lg px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors"
                  >
                    Reportar usuario
                  </button>
                )}
              </div>
            </section>

            {/* PUBLICACIONES */}
            <section>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-white mb-5">
                Publicaciones
              </h2>

              {publicaciones.length === 0 ? (
                <div className="bg-[#0E1D32] border border-[#294768] rounded-xl p-8 text-center">
                  <h3 className="text-lg font-semibold text-white">
                    Todavía no tiene publicaciones
                  </h3>

                  <p className="text-[#A9BAD0] text-sm mt-2">
                    Cuando publique prendas, van a aparecer acá.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {publicaciones.map((prenda) => (
                    <article
                      key={prenda.id}
                      className="w-full max-w-[340px] bg-[#0E1D32] border border-[#294768] rounded-xl overflow-hidden flex flex-col hover:border-[#3B82F6] transition-colors"
                    >
                      {/* FOTO */}
                      <div className="relative">
                        <Link
                          to={`/prenda/${prenda.id}`}
                          className="block aspect-[4/3] bg-[#102039] overflow-hidden"
                        >
                          {prenda.foto ? (
                            <img
                              src={prenda.foto}
                              alt={prenda.titulo}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#91A5BF] text-sm">
                              Sin imagen
                            </div>
                          )}
                        </Link>

                        {/* CORAZÓN DECORATIVO */}
                        <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#0D1628]/90 border border-[#52647D] flex items-center justify-center pointer-events-none">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5 text-white"
                          >
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                          </svg>
                        </div>
                      </div>

                      {/* INFORMACIÓN */}
                      <div className="p-4 flex flex-col flex-1">
                        <Link
                          to={`/prenda/${prenda.id}`}
                          className="font-display font-semibold text-white hover:text-[#93C5FD] transition-colors truncate"
                        >
                          {prenda.titulo}
                        </Link>

                        <p className="text-xs text-[#A9BAD0] mt-1">
                          {prenda.marca || 'Sin marca'}
                          {prenda.talle
                            ? ` · Talle ${prenda.talle}`
                            : ''}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {prenda.estado_condicion && (
                            <span className="bg-[#213B5D] text-[#DAE7F6] text-xs rounded-full px-3 py-1">
                              {prenda.estado_condicion}
                            </span>
                          )}

                          {prenda.color && (
                            <span className="bg-[#213B5D] text-[#DAE7F6] text-xs rounded-full px-3 py-1">
                              {prenda.color}
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-xl text-white mt-4">
                          ${Number(prenda.precio).toLocaleString('es-AR')}
                        </p>

                        <div className="mt-auto pt-5">
                          <Link
                            to={`/prenda/${prenda.id}`}
                            className="block w-full text-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                          >
                            Ver publicación
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* RESEÑAS DEL VENDEDOR */}
            <section className="mt-12 border-t border-[#253854] pt-7">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-white">
                  Experiencias de compradores
                </h2>

                <span className="text-xs text-[#A9BAD0]">
                  {resenas.length}{' '}
                  {resenas.length === 1
                    ? 'reseña'
                    : 'reseñas'}
                </span>
              </div>

              {errorResenas ? (
                <p className="text-red-400 text-sm">
                  {errorResenas}
                </p>
              ) : resenas.length === 0 ? (
                <div className="bg-[#0E1D32] border border-[#294768] rounded-xl p-6">
                  <p className="text-sm text-[#A9BAD0]">
                    Este vendedor todavía no tiene experiencias
                    de compra publicadas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resenas.map((resena) => (
                    <article
                      key={resena.id}
                      className="bg-[#0E1D32] border border-[#294768] rounded-xl p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#172A45] border border-[#294768] flex items-center justify-center shrink-0">
                          {resena.comprador_foto_perfil ? (
                            <img
                              src={resena.comprador_foto_perfil}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[#A9BAD0]">
                              {resena.comprador_nombre_usuario
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {resena.comprador_nombre_usuario}
                          </p>

                          <p className="text-xs text-[#91A5BF]">
                            {formatearFecha(resena.fecha)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-[#D5E3F4] whitespace-pre-line">
                        {resena.comentario}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[#93C5FD] bg-[#172A45] rounded-full px-3 py-1">
                          Compra verificada
                        </span>

                        <span className="text-xs text-[#91A5BF]">
                          {resena.titulo}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />

      {perfil && (
        <ReportarModal
          abierto={mostrarReporte}
          onCerrar={() => setMostrarReporte(false)}
          usuarioReportadoId={perfil.id}
          nombreUsuario={perfil.nombre_usuario}
          tipo="usuario"
        />
      )}
    </div>
  );
}


import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  getPrenda,
  type Prenda,
} from '../features/browse/api/prendas';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_LARGO_MENSAJE = 2000;

interface Mensaje {
  id: number;
  usuario_emisor_id: number;
  usuario_receptor_id: number;
  texto: string;
  fecha_envio: string;
  leido: boolean;
  es_mio: boolean;
}

interface UsuarioChat {
  id: number;
  nombre_usuario: string;
  foto_perfil?: string | null;
}

interface ConversacionBackend {
  usuario_id: number;
  nombre_usuario: string;
  foto_perfil: string | null;
}

interface EstadoChat {
  from?: string;
}

async function pedirAPI(
  ruta: string,
  opciones: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Tenés que iniciar sesión.');
  }

  const res = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      ...opciones.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error(
      'Tu sesión venció. Volvé a iniciar sesión.'
    );
  }

  return res;
}

async function obtenerMensajes(
  usuarioId: number
): Promise<Mensaje[]> {
  const res = await pedirAPI(
    `/mensajes/${usuarioId}`
  );

  if (!res.ok) {
    throw new Error(
      'No se pudieron cargar los mensajes.'
    );
  }

  const datos = await res.json();

  if (!Array.isArray(datos)) {
    throw new Error(
      'El servidor devolvió mensajes inválidos.'
    );
  }

  return datos;
}

async function marcarMensajesLeidos(
  usuarioId: number
): Promise<void> {
  const res = await pedirAPI(
    `/mensajes/${usuarioId}/leidos`,
    {
      method: 'PATCH',
    }
  );

  if (!res.ok) {
    throw new Error(
      'No se pudieron marcar los mensajes como leídos.'
    );
  }
}

async function obtenerConversaciones():
  Promise<ConversacionBackend[]> {
  const res = await pedirAPI(
    '/mis_conversaciones'
  );

  if (!res.ok) {
    throw new Error(
      'No se pudieron obtener las conversaciones.'
    );
  }

  const datos = await res.json();

  return Array.isArray(datos) ? datos : [];
}

function formatearHora(fecha: string): string {
  if (!fecha) return '';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return '';
  }

  return valor.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Chat() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const nombreUsuarioURL =
    searchParams.get('usuario');

  const esRutaMensajes =
    location.pathname.startsWith('/mensajes/');

  const estadoNavegacion =
    location.state as EstadoChat | null;

  const vieneDeMisMensajes =
    estadoNavegacion?.from === '/mis-mensajes';

  const [prenda, setPrenda] =
    useState<Prenda | null>(null);

  const [otroUsuario, setOtroUsuario] =
    useState<UsuarioChat | null>(null);

  const [miUsuarioId, setMiUsuarioId] =
    useState<number | null>(null);

  const [mensajes, setMensajes] =
    useState<Mensaje[]>([]);

  const [texto, setTexto] = useState('');

  const [cargando, setCargando] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] =
    useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [errorMensaje, setErrorMensaje] =
    useState('');

  const finalChat = useRef<HTMLDivElement>(null);

  // IDENTIFICAR USUARIO Y CARGAR CHAT
  useEffect(() => {
    let activo = true;

    async function iniciarChat() {
      setCargando(true);
      setError('');
      setErrorMensaje('');
      setPrenda(null);
      setOtroUsuario(null);
      setMensajes([]);
      setMiUsuarioId(null);

      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      if (!id) {
        setError('No se encontró la conversación.');
        setCargando(false);
        return;
      }

      try {
        // OBTENER USUARIO LOGUEADO
        const resPerfil = await pedirAPI(
          '/mi_perfil'
        );

        if (!resPerfil.ok) {
          throw new Error(
            'No se pudo obtener tu perfil.'
          );
        }

        const miPerfil = await resPerfil.json();
        const miId = Number(miPerfil.id);

        if (
          !Number.isInteger(miId) ||
          miId <= 0
        ) {
          throw new Error(
            'No se pudo identificar tu usuario.'
          );
        }

        if (!activo) return;

        setMiUsuarioId(miId);

        let destino: UsuarioChat;

        if (esRutaMensajes) {
          // /mensajes/:id
          // El ID es el del otro usuario.
          const otroId = Number(id);

          if (
            !Number.isInteger(otroId) ||
            otroId <= 0
          ) {
            throw new Error(
              'El ID del usuario no es válido.'
            );
          }

          const conversaciones =
            await obtenerConversaciones();

          const conversacion = conversaciones.find(
            (item) =>
              Number(item.usuario_id) === otroId
          );

          destino = {
            id: otroId,
            nombre_usuario:
              conversacion?.nombre_usuario ||
              nombreUsuarioURL ||
              `Usuario ${otroId}`,
            foto_perfil:
              conversacion?.foto_perfil ?? null,
          };
        } else {
          // /chat/:id
          // El ID corresponde a una publicación.
          let datosPrenda: Prenda | undefined;

          try {
            datosPrenda = await getPrenda(id);
          } catch (err) {
            console.error(
              'No se pudo cargar la publicación:',
              err
            );
          }

          if (activo && datosPrenda) {
            setPrenda(datosPrenda);
          }

          const nombreVendedor =
            nombreUsuarioURL ||
            datosPrenda?.usuario;

          if (!nombreVendedor) {
            throw new Error(
              'No se pudo identificar al vendedor.'
            );
          }

          const resUsuario = await fetch(
            `${API_URL}/usuarios/${encodeURIComponent(
              nombreVendedor
            )}`
          );

          if (!resUsuario.ok) {
            throw new Error(
              'No se pudo encontrar al vendedor.'
            );
          }

          const usuario = await resUsuario.json();
          const vendedorId = Number(usuario.id);

          if (
            !Number.isInteger(vendedorId) ||
            vendedorId <= 0
          ) {
            throw new Error(
              'El vendedor no tiene un ID válido.'
            );
          }

          destino = {
            id: vendedorId,
            nombre_usuario:
              usuario.nombre_usuario ||
              nombreVendedor,
            foto_perfil:
              usuario.foto_perfil ?? null,
          };
        }

        if (!activo) return;

        if (destino.id === miId) {
          throw new Error(
            'No podés enviarte mensajes a vos mismo.'
          );
        }

        setOtroUsuario(destino);
      } catch (err) {
        if (!activo) return;

        const mensaje =
          err instanceof Error
            ? err.message
            : 'No se pudo abrir el chat.';

        if (mensaje.includes('sesión venció')) {
          navigate('/login', { replace: true });
          return;
        }

        setError(mensaje);
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    iniciarChat();

    return () => {
      activo = false;
    };
  }, [
    id,
    esRutaMensajes,
    nombreUsuarioURL,
    navigate,
  ]);

  // CARGAR MENSAJES Y ACTUALIZAR CADA 5 SEGUNDOS
  useEffect(() => {
    if (!otroUsuario) return;

    let activo = true;
    let consultando = false;

    const usuarioId = otroUsuario.id;

    async function actualizarMensajes(
      primeraCarga = false
    ) {
      if (consultando) return;

      consultando = true;

      if (primeraCarga) {
        setCargandoMensajes(true);
      }

      try {
        const nuevos = await obtenerMensajes(
          usuarioId
        );

        if (!activo) return;

        setMensajes(nuevos);

        const haySinLeer = nuevos.some(
          (mensaje) =>
            !mensaje.es_mio &&
            !mensaje.leido
        );

        if (haySinLeer) {
          try {
            await marcarMensajesLeidos(
              usuarioId
            );

            if (activo) {
              setMensajes((anteriores) =>
                anteriores.map((mensaje) =>
                  mensaje.es_mio
                    ? mensaje
                    : {
                        ...mensaje,
                        leido: true,
                      }
                )
              );
            }
          } catch (err) {
            console.error(
              'No se pudieron marcar mensajes:',
              err
            );
          }
        }

        if (primeraCarga) {
          setErrorMensaje('');
        }
      } catch (err) {
        if (activo && primeraCarga) {
          setErrorMensaje(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar la conversación.'
          );
        }
      } finally {
        consultando = false;

        if (activo && primeraCarga) {
          setCargandoMensajes(false);
        }
      }
    }

    actualizarMensajes(true);

    const intervalo = window.setInterval(() => {
      if (!document.hidden) {
        actualizarMensajes();
      }
    }, 5000);

    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, [otroUsuario?.id]);

  // DESPLAZAR AL ÚLTIMO MENSAJE
  useEffect(() => {
    finalChat.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [mensajes.length]);

  // ENVIAR MENSAJE
  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !otroUsuario ||
      !miUsuarioId ||
      enviando
    ) {
      return;
    }

    const mensajeTexto = texto.trim();

    if (!mensajeTexto) return;

    if (
      mensajeTexto.length > MAX_LARGO_MENSAJE
    ) {
      setErrorMensaje(
        `El mensaje no puede superar los ${MAX_LARGO_MENSAJE} caracteres.`
      );
      return;
    }

    setEnviando(true);
    setErrorMensaje('');

    try {
      const res = await pedirAPI('/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receptor_id: otroUsuario.id,
          texto: mensajeTexto,
        }),
      });

      const resultado = await res.json().catch(
        () => ({})
      );

      if (!res.ok) {
        throw new Error(
          resultado.error ||
          'No se pudo enviar el mensaje.'
        );
      }

      const mensajeNuevo: Mensaje = {
        id: Number(resultado.id),
        texto: resultado.texto ?? mensajeTexto,
        usuario_emisor_id:
          resultado.usuario_emisor_id ??
          miUsuarioId,
        usuario_receptor_id:
          otroUsuario.id,
        fecha_envio:
          resultado.fecha_envio ??
          new Date().toISOString(),
        leido: resultado.leido ?? false,
        es_mio: true,
      };

      setMensajes((anteriores) => {
        if (
          anteriores.some(
            (mensaje) =>
              mensaje.id === mensajeNuevo.id
          )
        ) {
          return anteriores;
        }

        return [
          ...anteriores,
          mensajeNuevo,
        ];
      });

      setTexto('');
    } catch (err) {
      setErrorMensaje(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar el mensaje.'
      );
    } finally {
      setEnviando(false);
    }
  }

  const precioFormateado = prenda
    ? Number(prenda.precio).toLocaleString('es-AR')
    : '';

  // DESDE MIS MENSAJES → MIS MENSAJES
  // DESDE NOTIFICACIONES → INICIO
  // DESDE PUBLICACIÓN → PUBLICACIÓN
  const rutaVolver = vieneDeMisMensajes
    ? '/mis-mensajes'
    : esRutaMensajes
      ? '/'
      : prenda
        ? `/prenda/${prenda.id}`
        : '/';

  return (
    <div className="h-dvh bg-[#0D1628] text-[#E7ECF5] flex flex-col overflow-hidden">

      {/* HEADER DEL CHAT */}
      <header className="bg-[#10192E] border-b border-[#253854] px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">

        <Link
          to={rutaVolver}
          aria-label="Volver"
          className="w-10 h-10 rounded-full bg-[#172A45] hover:bg-[#213C5D] flex items-center justify-center shrink-0 transition-colors"
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
        </Link>

        {/* FOTO DE PERFIL */}
        <div className="w-11 h-11 rounded-full bg-[#172A45] border border-[#36577A] overflow-hidden flex items-center justify-center shrink-0">

          {otroUsuario?.foto_perfil ? (
            <img
              src={otroUsuario.foto_perfil}
              alt={otroUsuario.nombre_usuario}
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
              className="w-6 h-6 text-[#A9BAD0]"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20a8 8 0 0 1 16 0" />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display font-semibold text-base text-white truncate">
            {otroUsuario?.nombre_usuario ?? 'Chat'}
          </h1>

          <p className="text-xs text-[#91A5BF]">
            {prenda
              ? 'Conversación sobre una publicación'
              : 'Mensajes privados'}
          </p>
        </div>

        {otroUsuario && (
          <Link
            to={`/usuario/${encodeURIComponent(
              otroUsuario.nombre_usuario
            )}`}
            className="hidden sm:inline-flex text-xs text-[#93C5FD] hover:text-white transition-colors"
          >
            Ver perfil
          </Link>
        )}
      </header>

      {/* INFORMACIÓN DE LA PRENDA */}
      {prenda && (
        <Link
          to={`/prenda/${prenda.id}`}
          className="bg-[#0E1D32] border-b border-[#253854] px-4 sm:px-6 py-3 flex items-center gap-3 hover:bg-[#172A45] transition-colors shrink-0"
        >
          <div className="w-14 h-14 rounded-lg bg-[#102039] border border-[#294768] overflow-hidden shrink-0 flex items-center justify-center">

            {prenda.imagenes[0] ? (
              <img
                src={prenda.imagenes[0]}
                alt={prenda.titulo}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-[#91A5BF]">
                Sin imagen
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {prenda.titulo}
            </p>

            <p className="text-sm font-bold text-[#93C5FD] mt-1">
              ${precioFormateado}
            </p>
          </div>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-[#91A5BF] ml-auto shrink-0"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      )}

      {/* MENSAJES */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 min-h-full">

          {cargando || cargandoMensajes ? (
            <p className="text-center text-sm text-[#91A5BF]">
              Cargando conversación...
            </p>
          ) : error ? (
            <p className="text-center text-sm text-red-400">
              {error}
            </p>
          ) : errorMensaje && mensajes.length === 0 ? (
            <p className="text-center text-sm text-red-400">
              {errorMensaje}
            </p>
          ) : mensajes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">

              <div className="w-16 h-16 rounded-full bg-[#172A45] flex items-center justify-center">
                <img
                  src="/mensajes.png"
                  alt=""
                  className="w-8 h-8 object-contain brightness-0 invert opacity-85"
                />
              </div>

              <p className="text-white font-medium">
                Todavía no hay mensajes
              </p>

              <p className="text-sm text-[#91A5BF] max-w-xs">
                Escribí el primer mensaje para iniciar
                la conversación.
              </p>
            </div>
          ) : (
            mensajes.map((mensaje) => {
              const esMio =
                mensaje.es_mio ||
                mensaje.usuario_emisor_id ===
                  miUsuarioId;

              return (
                <div
                  key={mensaje.id}
                  className={`flex ${
                    esMio
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                      esMio
                        ? 'bg-[#2563EB] text-white rounded-br-sm'
                        : 'bg-[#1B2E48] border border-[#294768] text-[#E7ECF5] rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {mensaje.texto}
                    </p>

                    <div
                      className={`flex items-center justify-end gap-2 mt-2 text-[10px] ${
                        esMio
                          ? 'text-blue-100'
                          : 'text-[#91A5BF]'
                      }`}
                    >
                      <span>
                        {formatearHora(
                          mensaje.fecha_envio
                        )}
                      </span>

                      {esMio && (
                        <span>
                          {mensaje.leido ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={finalChat} />
        </div>
      </main>

      {/* ENVIAR MENSAJES */}
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-[#10192E] border-t border-[#253854] px-4 sm:px-6 py-4 shrink-0"
      >
        <div className="max-w-5xl mx-auto">

          {errorMensaje && (
            <p
              role="alert"
              className="text-red-400 text-xs mb-3"
            >
              {errorMensaje}
            </p>
          )}

          <div className="flex items-center gap-3 bg-[#0B192D] border border-[#294768] rounded-xl p-2 focus-within:border-[#3B82F6] transition-colors">

            <input
              name="mensaje"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={MAX_LARGO_MENSAJE}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setErrorMensaje('');
              }}
              placeholder="Escribí un mensaje..."
              disabled={
                !otroUsuario ||
                cargando ||
                enviando
              }
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-[#E7ECF5] placeholder:text-[#91A5BF] outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={
                !texto.trim() ||
                !otroUsuario ||
                cargando ||
                enviando
              }
              aria-label="Enviar mensaje"
              className="w-10 h-10 shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {enviando ? (
                <span className="text-xs">...</span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

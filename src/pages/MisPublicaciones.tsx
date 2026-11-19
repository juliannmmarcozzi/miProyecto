
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { subirImagen } from '../lib/subirImagen';
import {
  editarPublicacion,
  eliminarPublicacion,
  type PublicacionBackend,
} from '../features/browse/api/prendas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type Publicacion = PublicacionBackend & {
  estado_publicacion?: string;
  stock?: number;
  alias_transferencia?: string | null;
};

type OrdenVenta = {
  id: number;
  producto_id: number;
  estado: string;
  comprador_id: number;
  comprador_nombre_usuario: string;
  mi_rol: 'comprador' | 'vendedor';
};

type Oferta = {
  id: number;
  producto_id: number;
  titulo: string;
  nuevo_precio: number | string;
  responde_a: number | null;
  comentario: string | null;
  estado: string;
  autor_id: number;
  autor_nombre_usuario: string;
  me_toca_responder: boolean;
};

type AccionOferta = 'aceptar' | 'rechazar';

const inputClass =
  'w-full min-w-0 bg-[#0B192D] border border-[#294768] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5]';

function normalizar(valor: string | undefined | null) {
  return String(valor ?? '').trim().toLowerCase();
}

function estaVendida(publicacion: Publicacion) {
  return ['vendida', 'vendido'].includes(
    normalizar(publicacion.estado_publicacion)
  );
}

function precioAR(precio: number | string) {
  return Number(precio).toLocaleString('es-AR', {
    maximumFractionDigits: 2,
  });
}

function textoEstado(estado: string) {
  switch (normalizar(estado)) {
    case 'confirmada':
      return 'Compra registrada';
    case 'enviada':
      return 'Lista para entregar';
    case 'entregada':
      return 'Entregada';
    case 'cancelada':
      return 'Cancelada';
    default:
      return estado;
  }
}

function extraerArray<T,>(datos: unknown, campo: string): T[] {
  if (Array.isArray(datos)) return datos as T[];

  if (
    datos &&
    typeof datos === 'object' &&
    campo in datos
  ) {
    const valor = (datos as Record<string, unknown>)[campo];
    if (Array.isArray(valor)) return valor as T[];
  }

  return [];
}

export default function MisPublicaciones() {
  const navigate = useNavigate();

  const [publicaciones, setPublicaciones] =
    useState<Publicacion[]>([]);
  const [ordenesVenta, setOrdenesVenta] =
    useState<OrdenVenta[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);

  const [cargando, setCargando] = useState(true);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(true);
  const [cargandoOfertas, setCargandoOfertas] = useState(true);

  const [error, setError] = useState('');
  const [errorOperaciones, setErrorOperaciones] = useState('');
  const [mensajeOperacion, setMensajeOperacion] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [mostrarComoFunciona, setMostrarComoFunciona] =
    useState(false);

  const [ordenPorConfirmar, setOrdenPorConfirmar] =
    useState<OrdenVenta | null>(null);

  const [ofertaPorResponder, setOfertaPorResponder] =
    useState<{
      oferta: Oferta;
      accion: AccionOferta;
    } | null>(null);

  const [procesando, setProcesando] = useState(false);
  const [errorPopup, setErrorPopup] = useState('');

  const [editando, setEditando] =
    useState<Publicacion | null>(null);
  const [eliminando, setEliminando] =
    useState<Publicacion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const [archivoImagen, setArchivoImagen] =
    useState<File | null>(null);
  const [imagenEditada, setImagenEditada] =
    useState<string | null>(null);

  const cargarOperaciones = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setCargandoOrdenes(true);
    setCargandoOfertas(true);
    setErrorOperaciones('');

    try {
      const [resOrdenes, resOfertas] = await Promise.all([
        fetch(`${API_URL}/mis_ordenes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/mis_contraofertas`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }),
      ]);

      if (!resOrdenes.ok) {
        throw new Error('No se pudieron cargar las compras recibidas.');
      }

      if (!resOfertas.ok) {
        throw new Error('No se pudieron cargar las ofertas recibidas.');
      }

      const datosOrdenes = await resOrdenes.json();
      const datosOfertas = await resOfertas.json();

      setOrdenesVenta(
        extraerArray<OrdenVenta>(datosOrdenes, 'ordenes').filter(
          (orden) => orden.mi_rol === 'vendedor'
        )
      );

      setOfertas(extraerArray<Oferta>(datosOfertas, 'ofertas'));
    } catch (err) {
      setErrorOperaciones(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las operaciones.'
      );
    } finally {
      setCargandoOrdenes(false);
      setCargandoOfertas(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargarPublicaciones() {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const perfil = await fetch(`${API_URL}/mi_perfil`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (perfil.status === 401) {
          navigate('/login', { replace: true });
          return;
        }

        if (!perfil.ok) {
          throw new Error('No se pudo obtener tu perfil.');
        }

        const usuario = await perfil.json();

        if (!usuario.id) {
          throw new Error('No se pudo identificar tu usuario.');
        }

        const respuesta = await fetch(
          `${API_URL}/publicaciones/${usuario.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

        if (!respuesta.ok) {
          throw new Error('No se pudieron obtener tus publicaciones.');
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error('El servidor devolvió publicaciones inválidas.');
        }

        if (activo) setPublicaciones(datos);
      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar tus publicaciones.'
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargarPublicaciones();
    void cargarOperaciones();

    return () => {
      activo = false;
    };
  }, [navigate, cargarOperaciones]);

  useEffect(() => {
    return () => {
      if (imagenEditada) URL.revokeObjectURL(imagenEditada);
    };
  }, [imagenEditada]);

  useEffect(() => {
    function escape(evento: KeyboardEvent) {
      if (evento.key !== 'Escape' || procesando) return;

      if (ofertaPorResponder) {
        setOfertaPorResponder(null);
        setErrorPopup('');
      } else if (ordenPorConfirmar) {
        setOrdenPorConfirmar(null);
        setErrorPopup('');
      } else {
        setMostrarComoFunciona(false);
      }
    }

    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [procesando, ofertaPorResponder, ordenPorConfirmar]);

  function obtenerOrdenes(productoId: number) {
    return ordenesVenta.filter(
      (orden) => Number(orden.producto_id) === Number(productoId)
    );
  }

  function obtenerOfertas(productoId: number) {
    return ofertas.filter(
      (oferta) => Number(oferta.producto_id) === Number(productoId)
    );
  }

  function esOfertaPendiente(oferta: Oferta) {
    return normalizar(oferta.estado) === 'pendiente';
  }

  // Solo las ofertas iniciales de compradores se muestran como recibidas.
  // Las contraofertas del vendedor no son ofertas entrantes.
  function esOfertaDeComprador(oferta: Oferta) {
    return oferta.responde_a === null;
  }

  const publicacionesConCompras = publicaciones.filter(
    (publicacion) =>
      obtenerOrdenes(publicacion.id).some((orden) =>
        ['confirmada', 'enviada'].includes(normalizar(orden.estado))
      )
  ).length;

  const publicacionesEntregadas = publicaciones.filter(
    (publicacion) =>
      obtenerOrdenes(publicacion.id).some(
        (orden) => normalizar(orden.estado) === 'entregada'
      )
  ).length;

  const cantidadOfertasPendientes = ofertas.filter((oferta) => {
    const publicacion = publicaciones.find(
      (item) => Number(item.id) === Number(oferta.producto_id)
    );

    return (
      !!publicacion &&
      esOfertaDeComprador(oferta) &&
      esOfertaPendiente(oferta) &&
      oferta.me_toca_responder &&
      !estaVendida(publicacion)
    );
  }).length;

  const termino = busqueda.trim().toLocaleLowerCase('es-AR');

  const publicacionesFiltradas = publicaciones.filter((publicacion) => {
    if (!termino) return true;

    const campos = [
      publicacion.titulo,
      publicacion.marca,
      publicacion.talle,
      publicacion.color,
      publicacion.estado_condicion,
      ...obtenerOrdenes(publicacion.id).map(
        (orden) => orden.comprador_nombre_usuario
      ),
      ...obtenerOfertas(publicacion.id).map(
        (oferta) => oferta.autor_nombre_usuario
      ),
    ];

    return campos.some((campo) =>
      String(campo ?? '').toLocaleLowerCase('es-AR').includes(termino)
    );
  });

  function abrirConfirmacionEntrega(orden: OrdenVenta) {
    if (procesando || normalizar(orden.estado) !== 'confirmada') return;

    setErrorPopup('');
    setOrdenPorConfirmar(orden);
  }

  async function confirmarListaParaEntregar() {
    if (!ordenPorConfirmar || procesando) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const orden = ordenPorConfirmar;
    setProcesando(true);
    setErrorPopup('');
    setErrorOperaciones('');
    setMensajeOperacion('');

    try {
      const respuesta = await fetch(
        `${API_URL}/ordenes/${orden.id}/enviada`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se pudo actualizar la compra.'
        );
      }

      setOrdenesVenta((anteriores) =>
        anteriores.map((actual) =>
          actual.id === orden.id
            ? { ...actual, estado: 'enviada' }
            : actual
        )
      );

      setOrdenPorConfirmar(null);
      setMensajeOperacion(
        `El pedido #${orden.id} quedó listo para entregar. El comprador ya puede confirmar la recepción.`
      );

      await cargarOperaciones();
    } catch (err) {
      setErrorPopup(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el pedido.'
      );
    } finally {
      setProcesando(false);
    }
  }

  function abrirRespuestaOferta(oferta: Oferta, accion: AccionOferta) {
    if (procesando || !esOfertaPendiente(oferta)) return;

    setErrorPopup('');
    setOfertaPorResponder({ oferta, accion });
  }

  async function responderOferta() {
    if (!ofertaPorResponder || procesando) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const { oferta, accion } = ofertaPorResponder;

    setProcesando(true);
    setErrorPopup('');
    setErrorOperaciones('');
    setMensajeOperacion('');

    try {
      const respuesta = await fetch(
        `${API_URL}/contraofertas/${oferta.id}/responder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ accion }),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se pudo responder la oferta.'
        );
      }

      setOfertas((anteriores) =>
        anteriores.map((actual) =>
          actual.id === oferta.id
            ? {
                ...actual,
                estado: accion === 'aceptar'
                  ? 'cerrada_localmente'
                  : 'rechazada',
              }
            : actual
        )
      );

      setOfertaPorResponder(null);

      setMensajeOperacion(
        accion === 'aceptar'
          ? `Aceptaste la oferta de ${oferta.autor_nombre_usuario} por $${precioAR(oferta.nuevo_precio)}. Se creó una orden de compra.`
          : `Rechazaste la oferta de ${oferta.autor_nombre_usuario}.`
      );

      // Las ofertas aceptadas generan órdenes nuevas.
      // Consultamos nuevamente para mostrar la compra.
      await cargarOperaciones();

      // Al aceptar el backend marca la publicación como vendida.
      // Actualizar ese estado en las tarjetas visibles.
      if (accion === 'aceptar') {
        setPublicaciones((anteriores) =>
          anteriores.map((publicacion) =>
            Number(publicacion.id) === Number(oferta.producto_id)
              ? { ...publicacion, estado_publicacion: 'vendido' }
              : publicacion
          )
        );
      }
    } catch (err) {
      setErrorPopup(
        err instanceof Error
          ? err.message
          : 'No se pudo responder la oferta.'
      );
    } finally {
      setProcesando(false);
    }
  }

  function tieneCompraActiva(publicacion: Publicacion) {
    return obtenerOrdenes(publicacion.id).some(
      (orden) => normalizar(orden.estado) !== 'cancelada'
    );
  }

  function tieneOfertasPendientes(publicacion: Publicacion) {
    return obtenerOfertas(publicacion.id).some(
      (oferta) =>
        esOfertaDeComprador(oferta) &&
        esOfertaPendiente(oferta) &&
        !estaVendida(publicacion)
    );
  }

  function abrirEdicion(publicacion: Publicacion) {
    if (
      estaVendida(publicacion) ||
      tieneCompraActiva(publicacion) ||
      tieneOfertasPendientes(publicacion)
    ) return;

    setEditando(publicacion);
    setArchivoImagen(null);
    setImagenEditada(null);
    setErrorModal('');
  }

  function cerrarEdicion() {
    if (guardando) return;
    setEditando(null);
    setArchivoImagen(null);
    setImagenEditada(null);
    setErrorModal('');
  }

  function abrirEliminacion(publicacion: Publicacion) {
    if (
      estaVendida(publicacion) ||
      obtenerOrdenes(publicacion.id).length > 0 ||
      obtenerOfertas(publicacion.id).length > 0
    ) return;

    setEliminando(publicacion);
    setErrorModal('');
  }

  function cambiarImagen(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)
    ) {
      setErrorModal('Solo se permiten imágenes JPG, PNG o WebP.');
      evento.target.value = '';
      return;
    }

    if (archivo.size <= 0 || archivo.size > 6 * 1024 * 1024) {
      setErrorModal('La imagen debe tener un tamaño máximo de 6 MB.');
      evento.target.value = '';
      return;
    }

    setArchivoImagen(archivo);
    setImagenEditada(URL.createObjectURL(archivo));
    setErrorModal('');
  }

  async function guardarCambios(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!editando || guardando) return;

    const datos = new FormData(evento.currentTarget);
    const precio = Number(datos.get('precio'));

    if (!Number.isFinite(precio) || precio <= 0) {
      setErrorModal('Ingresá un precio válido.');
      return;
    }

    setGuardando(true);
    setErrorModal('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Iniciá sesión para editar.');

      const perfilActual = await fetch(
        `${API_URL}/publicaciones/${editando.usuario_publicador_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      );

      if (!perfilActual.ok) {
        throw new Error('No se pudo verificar el estado de la publicación.');
      }

      const publicacionesActuales = await perfilActual.json();

      const actual: Publicacion | undefined =
        Array.isArray(publicacionesActuales)
          ? publicacionesActuales.find(
              (item: Publicacion) =>
                Number(item.id) === Number(editando.id)
            )
          : undefined;

      if (!actual || estaVendida(actual)) {
        throw new Error(
          'Esta publicación ya no está disponible para editar.'
        );
      }

      const [resOrdenes, resOfertas] = await Promise.all([
        fetch(`${API_URL}/mis_ordenes`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`${API_URL}/mis_contraofertas`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
      ]);

      if (!resOrdenes.ok || !resOfertas.ok) {
        throw new Error('No se pudo verificar si hay operaciones activas.');
      }

      const listaOrdenes = extraerArray<OrdenVenta>(
        await resOrdenes.json(),
        'ordenes'
      );

      const listaOfertas = extraerArray<Oferta>(
        await resOfertas.json(),
        'ofertas'
      );

      const compraActiva = listaOrdenes.some(
        (orden) =>
          orden.mi_rol === 'vendedor' &&
          Number(orden.producto_id) === Number(editando.id) &&
          normalizar(orden.estado) !== 'cancelada'
      );

      const ofertaActiva = listaOfertas.some(
        (oferta) =>
          Number(oferta.producto_id) === Number(editando.id) &&
          normalizar(oferta.estado) === 'pendiente'
      );

      if (compraActiva || ofertaActiva) {
        setOrdenesVenta(
          listaOrdenes.filter((orden) => orden.mi_rol === 'vendedor')
        );
        setOfertas(listaOfertas);
        throw new Error(
          'No podés editar una publicación con una compra u oferta pendiente.'
        );
      }

      let fotoNueva: string | undefined;

      if (archivoImagen) {
        fotoNueva = await subirImagen(archivoImagen);
      }

      const aliasTransferencia = String(
        datos.get('alias_transferencia') ?? ''
      ).trim();

      const cambios = {
        titulo: String(datos.get('titulo') ?? '').trim(),
        descripcion: String(datos.get('descripcion') ?? '').trim(),
        precio,
        marca: String(datos.get('marca') ?? '').trim(),
        color: String(datos.get('color') ?? '').trim(),
        talle: String(datos.get('talle') ?? '').trim(),
        estado_condicion: String(datos.get('estado') ?? ''),
        ...(aliasTransferencia
          ? { alias_transferencia: aliasTransferencia }
          : {}),
        ...(fotoNueva ? { foto: fotoNueva } : {}),
      };

      const resultado = await editarPublicacion(editando.id, cambios);

      setPublicaciones((anteriores) =>
        anteriores.map((publicacion) =>
          publicacion.id === editando.id
            ? { ...publicacion, ...resultado }
            : publicacion
        )
      );

      setEditando(null);
      setArchivoImagen(null);
      setImagenEditada(null);
    } catch (err) {
      setErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar los cambios.'
      );
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion() {
    if (!eliminando || borrando) return;

    if (
      estaVendida(eliminando) ||
      obtenerOrdenes(eliminando.id).length > 0 ||
      obtenerOfertas(eliminando.id).length > 0
    ) {
      setErrorModal(
        'No podés eliminar una publicación con compras u ofertas registradas.'
      );
      return;
    }

    setBorrando(true);
    setErrorModal('');

    try {
      await eliminarPublicacion(eliminando.id);

      setPublicaciones((anteriores) =>
        anteriores.filter(
          (publicacion) => publicacion.id !== eliminando.id
        )
      );
      setEliminando(null);
    } catch (err) {
      setErrorModal(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar la publicación.'
      );
    } finally {
      setBorrando(false);
    }
  }

  const operacionesCargando = cargandoOrdenes || cargandoOfertas;

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5] flex flex-col" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>
      <Header
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        placeholderBusqueda="Buscar en mis publicaciones..."
      />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Mis publicaciones
            </h1>

            {!cargando && !error && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[#A9BAD0]">
                <span>
                  {publicaciones.length}{' '}
                  {publicaciones.length === 1
                    ? 'publicación'
                    : 'publicaciones'}
                </span>

                <span className="text-[#52647D]">·</span>

                <span>
                  {operacionesCargando || errorOperaciones
                    ? '—'
                    : publicacionesConCompras}{' '}
                  con compras registradas
                </span>

                <span className="text-[#52647D]">·</span>

                <span>
                  {operacionesCargando || errorOperaciones
                    ? '—'
                    : publicacionesEntregadas}{' '}
                  entregadas
                </span>

                {!operacionesCargando && cantidadOfertasPendientes > 0 && (
                  <>
                    <span className="text-[#52647D]">·</span>
                    <span className="text-[#93C5FD]">
                      {cantidadOfertasPendientes}{' '}
                      {cantidadOfertasPendientes === 1
                        ? 'oferta pendiente'
                        : 'ofertas pendientes'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setMostrarComoFunciona(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#36577A] bg-[#172A45] hover:bg-[#223956] px-4 py-2.5 text-sm text-white cursor-pointer"
            >
              <img
                src="/comofunciona.png"
                alt=""
                className="w-5 h-5 object-contain brightness-0 invert"
              />
              ¿Cómo funciona?
            </button>

            <Link
              to="/perfil"
              className="text-sm text-[#A9BAD0] hover:text-white"
            >
              Volver a mi perfil
            </Link>
          </div>
        </div>

        {operacionesCargando && !cargando && (
          <p className="text-sm text-[#A9BAD0] mb-5">
            Cargando ventas y ofertas...
          </p>
        )}

        {errorOperaciones && (
          <p role="alert" className="text-sm text-red-400 mb-5">
            {errorOperaciones}
          </p>
        )}

        {mensajeOperacion && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-[#256D58] bg-[#10372F] px-4 py-3 text-sm text-emerald-300"
          >
            {mensajeOperacion}
          </div>
        )}

        {cargando ? (
          <p className="text-center text-[#A9BAD0] py-12">
            Cargando publicaciones...
          </p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : publicaciones.length === 0 ? (
          <div className="bg-[#0E1D32] border border-[#294768] rounded-xl p-8 text-center">
            <p className="text-white font-semibold">
              Todavía no tenés publicaciones
            </p>
            <Link to="/" className="inline-block mt-4 text-[#93C5FD]">
              Ir al inicio
            </Link>
          </div>
        ) : publicacionesFiltradas.length === 0 ? (
          <div className="bg-[#0E1D32] border border-[#294768] rounded-xl p-8 text-center">
            <p className="text-white font-semibold">
              No se encontraron publicaciones
            </p>
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="mt-4 text-[#93C5FD] cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {publicacionesFiltradas.map((publicacion) => {
              const vendida = estaVendida(publicacion);
              const ordenes = obtenerOrdenes(publicacion.id);
              const ofertasPublicacion = obtenerOfertas(
                publicacion.id
              ).filter(esOfertaDeComprador);

              const compraActiva = tieneCompraActiva(publicacion);
              const ofertaPendiente = tieneOfertasPendientes(publicacion);
              const bloqueado = operacionesCargando ||
                !!errorOperaciones;

              const puedeEditar = !vendida &&
                !compraActiva &&
                !ofertaPendiente &&
                !bloqueado;

              const puedeEliminar = !vendida &&
                ordenes.length === 0 &&
                ofertasPublicacion.length === 0 &&
                !bloqueado;

              return (
                <article
                  key={publicacion.id}
                  className="bg-[#0E1D32] border border-[#294768] rounded-xl overflow-hidden flex flex-col"
                >
                  {/* FOTO */}
                  <div className="relative aspect-[4/3] bg-[#102039] overflow-hidden">
                    {publicacion.foto ? (
                      <img
                        src={publicacion.foto}
                        alt={publicacion.titulo}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#91A5BF]">
                        Sin imagen
                      </div>
                    )}

                    {vendida && (
                      <span className="absolute top-3 left-3 bg-[#0D1628] border border-[#6984A5] rounded-md px-3 py-1.5 text-xs font-semibold text-white">
                        Vendida
                      </span>
                    )}
                  </div>

                  {/* DETALLES */}
                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="text-[14px] font-medium tracking-[-0.01em] text-white truncate">
                      {publicacion.titulo}
                    </h2>

                    <p className="text-xs text-[#A9BAD0] mt-1">
                      {publicacion.marca} · Talle {publicacion.talle}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-[#213B5D] text-[#DAE7F6] text-xs rounded-full px-3 py-1">
                        {publicacion.estado_condicion}
                      </span>

                      {publicacion.color && (
                        <span className="bg-[#213B5D] text-[#DAE7F6] text-xs rounded-full px-3 py-1">
                          {publicacion.color}
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-xl text-white mt-4">
                      ${precioAR(publicacion.precio)}
                    </p>

                    {/* OFERTAS DE COMPRADORES */}
                    {ofertasPublicacion.length > 0 && (
                      <div className="mt-5 border-t border-[#294768] pt-4">
                        <h3 className="text-sm font-semibold text-white mb-3">
                          Ofertas recibidas
                        </h3>

                        <div className="space-y-3">
                          {ofertasPublicacion.map((oferta) => {
                            const vigente =
                              esOfertaPendiente(oferta) &&
                              oferta.me_toca_responder &&
                              !vendida &&
                              !compraActiva;

                            return (
                              <div
                                key={oferta.id}
                                className="rounded-lg border border-[#36577A] bg-[#172A45] p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs text-[#91A5BF]">
                                    Oferta #{oferta.id}
                                  </p>

                                  <span className="text-xs font-semibold text-[#93C5FD]">
                                    {vigente
                                      ? 'Pendiente'
                                      : esOfertaPendiente(oferta)
                                        ? 'No vigente'
                                        : normalizar(oferta.estado) === 'rechazada'
                                          ? 'Rechazada'
                                          : 'Respondida'}
                                  </span>
                                </div>

                                <p className="mt-3 text-sm text-[#D5E3F4]">
                                  {oferta.autor_nombre_usuario} ofreció
                                </p>

                                <p className="mt-1 text-xl font-bold text-white">
                                  ${precioAR(oferta.nuevo_precio)}
                                </p>

                                {oferta.comentario && (
                                  <p className="mt-2 text-xs text-[#A9BAD0] whitespace-pre-line">
                                    {oferta.comentario}
                                  </p>
                                )}

                                {vigente && (
                                  <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirRespuestaOferta(
                                          oferta,
                                          'aceptar'
                                        )
                                      }
                                      disabled={procesando}
                                      className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-2 py-2.5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                                    >
                                      Aceptar
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirRespuestaOferta(
                                          oferta,
                                          'rechazar'
                                        )
                                      }
                                      disabled={procesando}
                                      className="rounded-lg border border-red-500/50 text-red-300 hover:bg-red-500/10 px-2 py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                )}

                                {!vigente && esOfertaPendiente(oferta) && (
                                  <p className="mt-3 text-xs text-[#91A5BF]">
                                    Esta oferta no se puede aceptar
                                    con el estado actual de la publicación.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* COMPRAS REGISTRADAS */}
                    {ordenes.length > 0 && (
                      <div className="mt-5 border-t border-[#294768] pt-4">
                        <h3 className="text-sm font-semibold text-white mb-3">
                          Compras de esta publicación
                        </h3>

                        <div className="space-y-3">
                          {ordenes.map((orden) => {
                            const estado = normalizar(orden.estado);

                            return (
                              <div
                                key={orden.id}
                                className="rounded-lg border border-[#36577A] bg-[#172A45] p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs text-[#91A5BF]">
                                    Pedido #{orden.id}
                                  </p>

                                  <span className={`text-xs font-semibold ${
                                    estado === 'entregada'
                                      ? 'text-emerald-300'
                                      : estado === 'cancelada'
                                        ? 'text-red-300'
                                        : 'text-[#93C5FD]'
                                  }`}>
                                    {textoEstado(orden.estado)}
                                  </span>
                                </div>

                                {/* COMPRADOR: ENLACE A SU PERFIL */}
                                <p className="mt-3 text-sm text-[#D5E3F4]">
                                  Comprador:{' '}
                                  <Link
                                    to={`/usuario/${encodeURIComponent(
                                      orden.comprador_nombre_usuario
                                    )}`}
                                    className="font-semibold text-[#93C5FD] hover:text-white hover:underline"
                                  >
                                    {orden.comprador_nombre_usuario}
                                  </Link>
                                </p>

                                {/* ENVIAR MENSAJE AL COMPRADOR */}
                                <Link
                                  to={`/mensajes/${orden.comprador_id}?usuario=${encodeURIComponent(
                                    orden.comprador_nombre_usuario
                                  )}`}
                                  state={{ from: '/mis-publicaciones' }}
                                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#4B83D5] bg-[#213B5D] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#2A4B73]"
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
                                    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
                                  </svg>
                                  Enviar mensaje al comprador
                                </Link>

                                {estado === 'confirmada' && (
                                  <>
                                    <p className="mt-3 text-xs text-[#A9BAD0]">
                                      Coordiná el pago y la entrega
                                      con el comprador.
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirConfirmacionEntrega(orden)
                                      }
                                      disabled={procesando}
                                      className="mt-4 w-full rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                                    >
                                      Marcar como lista para entregar
                                    </button>
                                  </>
                                )}

                                {estado === 'enviada' && (
                                  <p className="mt-3 text-xs text-[#A9BAD0]">
                                    Falta que el comprador confirme
                                    que recibió la prenda.
                                  </p>
                                )}

                                {estado === 'entregada' && (
                                  <p className="mt-3 text-xs text-emerald-300">
                                    El comprador confirmó la recepción.
                                    Compra completada.
                                  </p>
                                )}

                                {estado === 'cancelada' && (
                                  <p className="mt-3 text-xs text-[#91A5BF]">
                                    Esta compra fue cancelada.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {ordenes.length === 0 &&
                      ofertasPublicacion.length === 0 &&
                      !operacionesCargando &&
                      !errorOperaciones && (
                        <p className="mt-5 text-xs text-[#91A5BF]">
                          Todavía no recibiste compras ni ofertas
                          de esta publicación.
                        </p>
                      )}

                    {/* ACCIONES */}
                    <div className="flex flex-wrap gap-2 mt-auto pt-5">
                      <Link
                        to={`/prenda/${publicacion.id}`}
                        className="flex-1 text-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg px-3 py-2.5 text-sm"
                      >
                        Ver publicación
                      </Link>

                      <button
                        type="button"
                        onClick={() => abrirEdicion(publicacion)}
                        disabled={!puedeEditar}
                        className={`border rounded-lg px-3 py-2.5 text-sm ${
                          puedeEditar
                            ? 'border-[#36577A] hover:bg-[#172A45] text-white cursor-pointer'
                            : 'border-[#34465F] bg-[#17243A] text-[#71839A] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirEliminacion(publicacion)}
                        disabled={!puedeEliminar}
                        className={`border rounded-lg px-3 py-2.5 text-sm ${
                          puedeEliminar
                            ? 'border-red-500/40 text-red-400 hover:bg-red-500/10 cursor-pointer'
                            : 'border-[#34465F] bg-[#17243A] text-[#71839A] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        Eliminar
                      </button>
                    </div>

                    {vendida && (
                      <p className="mt-3 text-xs text-[#91A5BF]">
                        Esta publicación figura como vendida y no
                        puede editarse ni eliminarse.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* POPUP: CÓMO FUNCIONA */}
      {mostrarComoFunciona && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMostrarComoFunciona(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-como-funciona"
            className="w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-2xl border border-[#36577A] bg-[#14243B] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#294768] px-6 py-5">
              <div className="flex items-center gap-3">
                <img
                  src="/comofunciona.png"
                  alt=""
                  className="w-7 h-7 brightness-0 invert"
                />
                <h2
                  id="titulo-como-funciona"
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
              <ol className="space-y-5">
                {[
                  {
                    titulo: 'Publicás una prenda',
                    descripcion:
                      'Tu publicación aparece en el catálogo de otras personas.',
                  },
                  {
                    titulo: 'Recibís compras u ofertas',
                    descripcion:
                      'Las compras y ofertas se muestran debajo de la publicación correspondiente.',
                  },
                  {
                    titulo: 'Respondés las ofertas',
                    descripcion:
                      'Podés aceptar o rechazar. Si aceptás, se registra una orden al precio ofertado.',
                  },
                  {
                    titulo: 'Coordinás la entrega',
                    descripcion:
                      'Cuando la prenda esté lista, marcala para entregar. El comprador confirmará la recepción.',
                  },
                  {
                    titulo: 'Compra completada',
                    descripcion:
                      'El comprador podrá calificar la prenda y contar su experiencia.',
                  },
                ].map((paso, indice) => (
                  <li key={paso.titulo} className="flex items-start gap-3">
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
                  </li>
                ))}
              </ol>

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

      {/* POPUP: RESPONDER OFERTA */}
      {ofertaPorResponder && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !procesando) {
              setOfertaPorResponder(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-responder-oferta"
            className="w-full max-w-md rounded-2xl border border-[#36577A] bg-[#14243B] shadow-2xl p-6"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#213B5D] flex items-center justify-center text-2xl text-[#93C5FD]">
                $
              </div>
              <button
                type="button"
                disabled={procesando}
                onClick={() => setOfertaPorResponder(null)}
                className="text-[#A9BAD0] hover:text-white text-xl cursor-pointer disabled:opacity-50"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <h2
              id="titulo-responder-oferta"
              className="mt-5 text-xl font-bold text-white"
            >
              {ofertaPorResponder.accion === 'aceptar'
                ? '¿Querés aceptar esta oferta?'
                : '¿Querés rechazar esta oferta?'}
            </h2>

            <p className="mt-3 text-sm text-[#B9C9DC] leading-relaxed">
              <span className="font-semibold text-white">
                {ofertaPorResponder.oferta.autor_nombre_usuario}
              </span>{' '}
              ofreció{' '}
              <span className="font-semibold text-white">
                ${precioAR(ofertaPorResponder.oferta.nuevo_precio)}
              </span>{' '}
              por "{ofertaPorResponder.oferta.titulo}".
            </p>

            <div className="mt-5 rounded-lg border border-[#294768] bg-[#0E1D32] p-4">
              <p className="text-sm text-[#D5E3F4]">
                {ofertaPorResponder.accion === 'aceptar'
                  ? 'Al aceptar, se creará una orden de compra al precio ofertado y el comprador recibirá una notificación.'
                  : 'Al rechazar, se cerrará esta oferta. No se creará ninguna orden de compra.'}
              </p>
            </div>

            {errorPopup && (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {errorPopup}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                disabled={procesando}
                onClick={() => setOfertaPorResponder(null)}
                className="rounded-lg border border-[#36577A] bg-[#172A45] py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={procesando}
                onClick={() => void responderOferta()}
                className={`rounded-lg py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 ${
                  ofertaPorResponder.accion === 'aceptar'
                    ? 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {procesando
                  ? 'Procesando...'
                  : ofertaPorResponder.accion === 'aceptar'
                    ? 'Aceptar oferta'
                    : 'Rechazar oferta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: LISTA PARA ENTREGAR */}
      {ordenPorConfirmar && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !procesando) {
              setOrdenPorConfirmar(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmar-entrega"
            className="w-full max-w-md rounded-2xl border border-[#36577A] bg-[#14243B] shadow-2xl p-6"
          >
            <div className="flex justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#213B5D] flex items-center justify-center text-[#93C5FD]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7"
                >
                  <path d="M3 7h18v12H3z" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
              </div>
              <button
                type="button"
                disabled={procesando}
                onClick={() => setOrdenPorConfirmar(null)}
                className="text-[#A9BAD0] hover:text-white text-xl cursor-pointer disabled:opacity-50"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <h2
              id="titulo-confirmar-entrega"
              className="mt-5 text-xl font-bold text-white"
            >
              ¿La prenda está lista para entregar?
            </h2>

            <p className="mt-3 text-sm text-[#B9C9DC]">
              Vas a marcar el pedido #{ordenPorConfirmar.id} como
              listo para entregar a{' '}
              <span className="font-semibold text-white">
                {ordenPorConfirmar.comprador_nombre_usuario}
              </span>.
            </p>

            <div className="mt-5 rounded-lg border border-[#294768] bg-[#0E1D32] p-4 text-sm text-[#D5E3F4]">
              Coordiná el pago y la entrega antes de continuar.
              Después, el comprador podrá confirmar la recepción
              desde Mis pedidos.
            </div>

            {errorPopup && (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {errorPopup}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                disabled={procesando}
                onClick={() => setOrdenPorConfirmar(null)}
                className="rounded-lg border border-[#36577A] bg-[#172A45] py-3 text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={procesando}
                onClick={() => void confirmarListaParaEntregar()}
                className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                {procesando ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {editando && !estaVendida(editando) && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-[#0E1D32] border border-[#294768] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Editar publicación
              </h2>
              <button
                type="button"
                disabled={guardando}
                onClick={cerrarEdicion}
                aria-label="Cerrar"
                className="text-[#A9BAD0] hover:text-white text-xl disabled:opacity-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={guardarCambios}
              autoComplete="off"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="w-24 h-24 rounded-lg bg-[#102039] border border-[#294768] overflow-hidden shrink-0">
                  {(imagenEditada || editando.foto) && (
                    <img
                      src={imagenEditada || editando.foto}
                      alt="Imagen de la publicación"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <label className="text-sm text-[#93C5FD] cursor-pointer">
                  Cambiar imagen
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={guardando}
                    onChange={cambiarImagen}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                name="titulo"
                defaultValue={editando.titulo}
                placeholder="Título"
                required
                disabled={guardando}
                className={inputClass}
              />

              <textarea
                name="descripcion"
                defaultValue={editando.descripcion}
                placeholder="Descripción"
                rows={3}
                required
                disabled={guardando}
                className={inputClass + ' resize-y'}
              />

              <input
                name="precio"
                type="number"
                min="1"
                step="0.01"
                defaultValue={editando.precio}
                placeholder="Precio"
                required
                disabled={guardando}
                className={inputClass}
              />

              <input
                name="marca"
                defaultValue={editando.marca}
                placeholder="Marca"
                required
                disabled={guardando}
                className={inputClass}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  name="color"
                  defaultValue={editando.color}
                  placeholder="Color"
                  required
                  disabled={guardando}
                  className={inputClass}
                />
                <input
                  name="talle"
                  defaultValue={editando.talle}
                  placeholder="Talle"
                  required
                  disabled={guardando}
                  className={inputClass}
                />
              </div>

              <select
                name="estado"
                defaultValue={editando.estado_condicion}
                required
                disabled={guardando}
                className={inputClass}
              >
                <option value="Nuevo">Nuevo</option>
                <option value="Usado">Usado</option>
              </select>

              <div className="mt-3 border-t border-[#294768] pt-5">
                <h3 className="text-base font-semibold text-white">
                  Datos para recibir pagos
                </h3>
                <p className="text-xs text-[#A9BAD0] mt-2 mb-4">
                  Alias de la cuenta donde querés recibir transferencias.
                </p>
                <label
                  htmlFor="editar-alias-transferencia"
                  className="block text-sm font-medium text-[#D5E3F4] mb-2"
                >
                  Alias de transferencia
                </label>
                <input
                  id="editar-alias-transferencia"
                  name="alias_transferencia"
                  defaultValue={editando.alias_transferencia ?? ''}
                  placeholder="Ej: mi.alias.mp"
                  maxLength={100}
                  disabled={guardando}
                  className={inputClass}
                />
              </div>

              {errorModal && (
                <p role="alert" className="mt-4 text-sm text-red-400">
                  {errorModal}
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={cerrarEdicion}
                  className="flex-1 border border-[#294768] rounded-lg py-3 text-sm hover:bg-[#172A45] disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {eliminando && !estaVendida(eliminando) && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0E1D32] border border-[#294768] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              Eliminar publicación
            </h2>

            <p className="text-[#A9BAD0] text-sm mt-4 leading-relaxed">
              ¿Estás seguro de que querés eliminar
              {' "'}{eliminando.titulo}{'"'}?
              Esta acción no se puede deshacer.
            </p>

            {errorModal && (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {errorModal}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                disabled={borrando}
                onClick={() => {
                  setEliminando(null);
                  setErrorModal('');
                }}
                className="flex-1 border border-[#294768] rounded-lg py-3 text-sm cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={borrando}
                onClick={() => void confirmarEliminacion()}
                className="flex-1 bg-red-600 hover:bg-red-700 rounded-lg py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
              >
                {borrando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

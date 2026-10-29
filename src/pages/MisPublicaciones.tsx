
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  getMisPublicaciones,
  editarPublicacion,
  eliminarPublicacion,
  type PublicacionBackend,
} from '../features/browse/api/prendas';

const API_URL = 'http://localhost:3000';

const inputClass =
  'w-full min-w-0 bg-[#0B192D] border border-[#294768] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5]';

export default function MisPublicaciones() {
  const navigate = useNavigate();

  const [publicaciones, setPublicaciones] = useState<PublicacionBackend[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [editando, setEditando] = useState<PublicacionBackend | null>(null);
  const [eliminando, setEliminando] = useState<PublicacionBackend | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [imagenEditada, setImagenEditada] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargarPublicaciones() {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/mi_perfil`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error('No se pudo obtener el perfil.');
        }

        const usuario = await res.json();
        const datos = await getMisPublicaciones(usuario.id);

        if (activo) {
          setPublicaciones(datos);
        }
      } catch (error) {
        console.error(error);

        if (activo) {
          setError('No se pudieron cargar tus publicaciones.');
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarPublicaciones();

    return () => {
      activo = false;
    };
  }, [navigate]);

  function abrirEdicion(publicacion: PublicacionBackend) {
    setEditando(publicacion);
    setImagenEditada(null);
    setErrorModal('');
  }

  function abrirEliminacion(publicacion: PublicacionBackend) {
    setEliminando(publicacion);
    setErrorModal('');
  }

  function cambiarImagen(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      setErrorModal('Seleccioná una imagen válida.');
      return;
    }

    if (archivo.size > 6 * 1024 * 1024) {
      setErrorModal('La imagen no puede superar los 6 MB.');
      return;
    }

    setErrorModal('');

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagenEditada(reader.result);
      }
    };

    reader.onerror = () => {
      setErrorModal('No se pudo cargar la imagen.');
    };

    reader.readAsDataURL(archivo);
  }

  async function guardarCambios(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editando || guardando) return;

    const datos = new FormData(e.currentTarget);

    const precio = Number(datos.get('precio'));

    if (!Number.isFinite(precio) || precio <= 0) {
      setErrorModal('Ingresá un precio válido.');
      return;
    }

    setGuardando(true);
    setErrorModal('');

    try {
      const actualizada = await editarPublicacion(editando.id, {
        titulo: String(datos.get('titulo')).trim(),
        descripcion: String(datos.get('descripcion')).trim(),
        precio,
        marca: String(datos.get('marca')).trim(),
        color: String(datos.get('color')).trim(),
        talle: String(datos.get('talle')).trim(),
        estado_condicion: String(datos.get('estado')),
        ...(imagenEditada ? { foto: imagenEditada } : {}),
      });

      setPublicaciones((anteriores) =>
        anteriores.map((p) =>
          p.id === editando.id ? { ...p, ...actualizada } : p
        )
      );

      setEditando(null);
      setImagenEditada(null);
    } catch (error) {
      setErrorModal(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los cambios.'
      );
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion() {
    if (!eliminando || borrando) return;

    setBorrando(true);
    setErrorModal('');

    try {
      await eliminarPublicacion(eliminando.id);

      setPublicaciones((anteriores) =>
        anteriores.filter((p) => p.id !== eliminando.id)
      );

      setEliminando(null);
    } catch (error) {
      setErrorModal(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la publicación.'
      );
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5] flex flex-col">
      <Header />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Mis publicaciones
            </h1>

            {!cargando && !error && (
              <p className="text-sm text-[#A9BAD0] mt-2">
                {publicaciones.length}{' '}
                {publicaciones.length === 1
                  ? 'publicación'
                  : 'publicaciones'}
              </p>
            )}
          </div>

          <Link
            to="/perfil"
            className="text-sm text-[#A9BAD0] hover:text-white transition-colors"
          >
            Volver a mi perfil
          </Link>
        </div>

        {cargando ? (
          <p className="text-[#A9BAD0] text-center py-12">
            Cargando publicaciones...
          </p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : publicaciones.length === 0 ? (
          <div className="bg-[#0E1D32] border border-[#294768] rounded-xl p-8 text-center">
            <h2 className="text-lg font-semibold text-white">
              Todavía no tenés publicaciones
            </h2>

            <p className="text-[#A9BAD0] text-sm mt-2 mb-6">
              Cuando publiques una prenda, va a aparecer acá.
            </p>

            <Link
              to="/"
              className="inline-block bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm"
            >
              Ir al inicio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {publicaciones.map((publicacion) => (
              <div
                key={publicacion.id}
                className="bg-[#0E1D32] border border-[#294768] rounded-xl overflow-hidden flex flex-col"
              >
                <Link
                  to={`/prenda/${publicacion.id}`}
                  className="block aspect-[4/3] bg-[#102039] overflow-hidden"
                >
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
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <h2 className="font-display font-semibold text-white truncate">
                    {publicacion.titulo}
                  </h2>

                  <p className="text-xs text-[#A9BAD0] mt-1">
                    {publicacion.marca} · Talle {publicacion.talle}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-[#213B5D] text-[#DAE7F6] text-xs rounded-full px-3 py-1">
                      {publicacion.estado_condicion}
                    </span>

                    <span className="bg-[#213B5D] text-[#DAE7F6] text-xs rounded-full px-3 py-1">
                      {publicacion.color}
                    </span>
                  </div>

                  <p className="font-bold text-xl text-white mt-4">
                    ${Number(publicacion.precio).toLocaleString('es-AR')}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto pt-5">
                    <Link
                      to={`/prenda/${publicacion.id}`}
                      className="flex-1 text-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg px-3 py-2.5 text-sm transition-colors"
                    >
                      Ver publicación
                    </Link>

                    <button
                      type="button"
                      onClick={() => abrirEdicion(publicacion)}
                      className="border border-[#36577A] hover:bg-[#172A45] text-white rounded-lg px-3 py-2.5 text-sm cursor-pointer"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirEliminacion(publicacion)}
                      className="border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-lg px-3 py-2.5 text-sm cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {editando && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-[#0E1D32] border border-[#294768] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Editar publicación
              </h2>

              <button
                type="button"
                disabled={guardando}
                onClick={() => setEditando(null)}
                className="text-[#A9BAD0] hover:text-white text-xl cursor-pointer"
                aria-label="Cerrar"
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

                <label className="text-sm text-[#93C5FD] cursor-pointer hover:text-white">
                  Cambiar imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={cambiarImagen}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                name="titulo"
                defaultValue={editando.titulo}
                placeholder="Título"
                autoComplete="off"
                required
                className={inputClass}
              />

              <textarea
                name="descripcion"
                defaultValue={editando.descripcion}
                placeholder="Descripción"
                rows={3}
                required
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
                className={inputClass}
              />

              <input
                name="marca"
                defaultValue={editando.marca}
                placeholder="Marca"
                autoComplete="off"
                required
                className={inputClass}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  name="color"
                  defaultValue={editando.color}
                  placeholder="Color"
                  autoComplete="off"
                  required
                  className={inputClass}
                />

                <input
                  name="talle"
                  defaultValue={editando.talle}
                  placeholder="Talle"
                  autoComplete="off"
                  required
                  className={inputClass}
                />
              </div>

              <select
                name="estado"
                defaultValue={editando.estado_condicion}
                required
                className={inputClass}
              >
                <option value="Nuevo">Nuevo</option>
                <option value="Usado">Usado</option>
              </select>

              {errorModal && (
                <p className="text-red-400 text-sm">{errorModal}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setEditando(null)}
                  className="flex-1 border border-[#294768] rounded-lg py-3 text-sm text-white hover:bg-[#172A45] cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {eliminando && (
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
              <p className="text-red-400 text-sm mt-4">
                {errorModal}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                disabled={borrando}
                onClick={() => setEliminando(null)}
                className="flex-1 border border-[#294768] text-white rounded-lg py-3 text-sm hover:bg-[#172A45] cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={borrando}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50 cursor-pointer"
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

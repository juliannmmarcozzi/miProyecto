import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderActions from '../components/HeaderActions';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';

const API_URL = 'http://localhost:3000';

interface Usuario {
  id: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  instagram: string | null;
  foto_perfil: string | null;
  numero_telefono: string;
  verificado: boolean;
  estado: string;
  publicaciones_disponibles: number;
  ventas_entregadas: number;
  relatos_recibidos: number;
}

export default function Perfil() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');

  function cerrarSesion() {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    let activo = true;

    async function obtenerPerfil() {
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

        if (!activo) return;

        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        if (!res.ok) {
          setError('No se pudo cargar el perfil');
          return;
        }

        const datos: Usuario = await res.json();

        setUsuario(datos);
        setNombreUsuario(datos.nombre_usuario);
        setInstagram(datos.instagram || '');
        setTelefono(datos.numero_telefono || '');
        setFotoPerfil(datos.foto_perfil || '');
      } catch {
        if (activo) {
          setError('Error de conexión con el servidor');
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    obtenerPerfil();

    return () => {
      activo = false;
    };
  }, [navigate]);

  function cancelarEdicion() {
    if (!usuario) return;

    setNombreUsuario(usuario.nombre_usuario);
    setInstagram(usuario.instagram || '');
    setTelefono(usuario.numero_telefono || '');
    setFotoPerfil(usuario.foto_perfil || '');
    setError('');
    setEditando(false);
  }

  async function guardarCambios(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!usuario || guardando) return;

    const token = localStorage.getItem('token');

    if (!token) {
      cerrarSesion();
      return;
    }

    if (!nombreUsuario.trim() || !telefono.trim()) {
      setError('El usuario y el teléfono no pueden estar vacíos');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/usuario/${usuario.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre_usuario: nombreUsuario.trim(),
          instagram: instagram.trim(),
          numero_telefono: telefono.trim(),
          foto_perfil: fotoPerfil.trim(),
        }),
      });

      if (res.status === 401) {
        cerrarSesion();
        return;
      }

      const datos = await res.json();

      if (!res.ok) {
        setError(datos.error || 'No se pudo actualizar el perfil');
        return;
      }

      setUsuario({
        ...usuario,
        nombre_usuario: datos.nombre_usuario,
        instagram: datos.instagram,
        numero_telefono: datos.numero_telefono,
        foto_perfil: datos.foto_perfil,
      });

      setEditando(false);
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header
        actions={
          <HeaderActions
            onFilters={() => {}}
            onCreate={() => {}}
          />
        }
      />

      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-ink mb-6">
          Mi perfil
        </h1>

        {cargando ? (
          <p>Cargando perfil...</p>
        ) : !usuario ? (
          <p className="text-red-600">
            {error || 'No se encontraron datos del usuario.'}
          </p>
        ) : (
          <>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {usuario.foto_perfil ? (
                    <img
                      src={usuario.foto_perfil}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-600">
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-ink">
                    @{usuario.nombre_usuario}
                  </h2>

                  <p className="text-gray-500">
                    {usuario.nombre} {usuario.apellido}
                  </p>

                  {usuario.instagram && (
                    <p className="text-gray-500">
                      Instagram: {usuario.instagram}
                    </p>
                  )}
                </div>
              </div>

              {!editando ? (
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => {
                      setError('');
                      setEditando(true);
                    }}
                    className="bg-clay text-white px-4 py-2 rounded-lg hover:bg-clay/90 transition-colors cursor-pointer"
                  >
                    Editar perfil
                  </button>

                  <button
                    onClick={cerrarSesion}
                    className="bg-umber/10 text-umber border border-umber/20 px-4 py-2 rounded-lg hover:bg-umber/20 transition-colors cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={guardarCambios} className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Nombre de usuario
                      </label>
                      <input
                        type="text"
                        value={nombreUsuario}
                        onChange={(e) => setNombreUsuario(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-clay"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Número de teléfono
                      </label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-clay"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-clay"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        URL de foto de perfil
                      </label>
                      <input
                        type="text"
                        value={fotoPerfil}
                        onChange={(e) => setFotoPerfil(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-clay"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      type="submit"
                      disabled={guardando}
                      className="bg-clay text-white px-4 py-2 rounded-lg hover:bg-clay/90 disabled:opacity-50 cursor-pointer"
                    >
                      {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>

                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      className="bg-umber/10 text-umber border border-umber/20 px-4 py-2 rounded-lg hover:bg-umber/20 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {error && (
                <p className="text-red-600 mt-4">{error}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {usuario.publicaciones_disponibles}
                </p>
                <p className="text-gray-500">Publicaciones</p>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {usuario.ventas_entregadas}
                </p>
                <p className="text-gray-500">Ventas</p>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {usuario.relatos_recibidos}
                </p>
                <p className="text-gray-500">Reseñas</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-ink mb-4">
                Mis publicaciones
              </h2>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
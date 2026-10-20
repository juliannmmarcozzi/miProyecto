
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderActions from '../components/HeaderActions';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000';

interface Usuario {
  id: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  foto_perfil: string | null;
}

export default function Perfil() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  function cerrarSesion() {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    async function obtenerPerfil() {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/perfil`, {
          method: 'GET',
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
          setError('No se pudo cargar el perfil');
          return;
        }

        const datos: Usuario = await res.json();
        setUsuario(datos);
      } catch {
        setError('Error de conexión con el servidor');
      } finally {
        setCargando(false);
      }
    }

    obtenerPerfil();
  }, [navigate]);

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
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : usuario ? (
          <>
            <div className="bg-white rounded-lg p-6 mb-6">

              <div className="flex items-center gap-4">

                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  {usuario.foto_perfil && (
                    <img
                      src={usuario.foto_perfil}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-ink">
                    {usuario.nombre_usuario}
                  </h2>

                  <p className="text-gray-500">
                    {usuario.nombre} {usuario.apellido}
                  </p>

                  <p className="text-gray-500">
                    {usuario.email}
                  </p>
                </div>

              </div>

              <button
                className="mt-6 bg-clay text-white px-4 py-2 rounded-lg hover:bg-clay/90 transition-colors"
              >
                Editar perfil
              </button>

              <button
                onClick={cerrarSesion}
                className="mt-6 ml-3 bg-umber/10 text-umber border border-umber/20 px-4 py-2 rounded-lg hover:bg-umber/20 transition-colors"
              >
                Cerrar sesión
              </button>

            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">

              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-gray-500">Publicaciones</p>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-gray-500">Seguidores</p>
              </div>

              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-gray-500">Siguiendo</p>
              </div>

            </div>

            <div className="bg-white rounded-lg p-6">

              <h2 className="text-xl font-bold text-ink mb-4">
                Mis publicaciones
              </h2>

            </div>
          </>
        ) : (
          <p>No se encontraron datos del usuario.</p>
        )}

      </main>

      <Footer />

    </div>
  );
}

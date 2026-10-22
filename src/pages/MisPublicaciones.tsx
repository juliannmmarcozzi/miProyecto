
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  getMisPublicaciones,
  type PublicacionBackend,
} from '../features/browse/api/prendas';

export default function MisPublicaciones() {
  const navigate = useNavigate();

  const [publicaciones, setPublicaciones] = useState<PublicacionBackend[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarPublicaciones() {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await fetch('http://localhost:3000/perfil', {
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
          throw new Error('No se pudo obtener el perfil');
        }

        const usuario = await res.json();

        const datos = await getMisPublicaciones(usuario.id);
        setPublicaciones(datos);
      } catch (error) {
        console.error(error);
        setError('No se pudieron cargar tus publicaciones.');
      } finally {
        setCargando(false);
      }
    }

    cargarPublicaciones();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-ink">
            Mis publicaciones
          </h1>

          <Link
            to="/perfil"
            className="text-umber hover:text-clay transition-colors"
          >
            Volver a mi perfil
          </Link>
        </div>

        {cargando ? (
          <p>Cargando publicaciones...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : publicaciones.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-umber/70 mb-4">
              Todavía no tenés publicaciones.
            </p>

            <Link
              to="/"
              className="inline-block bg-clay text-white px-4 py-2 rounded-lg hover:bg-clay/90 transition-colors"
            >
              Crear publicación
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicaciones.map((publicacion) => (
              <div
                key={publicacion.id}
                className="bg-white rounded-lg overflow-hidden"
              >
                {publicacion.foto && (
                  <img
                    src={publicacion.foto}
                    alt={publicacion.titulo}
                    className="w-full h-56 object-cover"
                  />
                )}

                <div className="p-4">
                  <h2 className="text-lg font-bold">
                    {publicacion.titulo}
                  </h2>

                  <p className="text-clay font-semibold mt-2">
                    ${publicacion.precio}
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    Estado: {publicacion.estado_condicion}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <Link
                      to={`/prenda/${publicacion.id}`}
                      className="bg-clay text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Ver publicación
                    </Link>

                    <button
                      className="border border-umber/20 text-umber px-3 py-2 rounded-lg text-sm"
                    >
                      Editar
                    </button>

                    <button
                      className="text-red-600 border border-red-200 px-3 py-2 rounded-lg text-sm"
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
    </div>
  );
}

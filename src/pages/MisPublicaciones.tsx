
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Publicacion {
  id: number;
  titulo: string;
  precio: number;
  imagen: string;
  estado: string;
}

export default function MisPublicaciones() {
  const publicaciones: Publicacion[] = [];

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

        {publicaciones.length === 0 ? (
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
                <img
                  src={publicacion.imagen}
                  alt={publicacion.titulo}
                  className="w-full h-56 object-cover"
                />

                <div className="p-4">
                  <h2 className="text-lg font-bold">
                    {publicacion.titulo}
                  </h2>

                  <p className="text-clay font-semibold mt-2">
                    ${publicacion.precio}
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    Estado: {publicacion.estado}
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

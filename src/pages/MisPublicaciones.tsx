
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function MisPublicaciones() {
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
      </main>

      <Footer />
    </div>
  );
}

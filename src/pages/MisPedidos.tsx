
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Pedido {
  id: number;
  titulo: string;
  precio: number;
  imagen: string;
  estado: string;
  fecha: string;
}

export default function MisPedidos() {
  const pedidos: Pedido[] = [];

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-ink">
            Mis pedidos
          </h1>

          <Link
            to="/perfil"
            className="text-umber hover:text-clay transition-colors"
          >
            Volver a mi perfil
          </Link>
        </div>

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-umber/70 mb-4">
              Todavía no realizaste ningún pedido.
            </p>

            <Link
              to="/"
              className="inline-block bg-clay text-white px-4 py-2 rounded-lg hover:bg-clay/90 transition-colors"
            >
              Explorar prendas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-white rounded-lg overflow-hidden"
              >
                <img
                  src={pedido.imagen}
                  alt={pedido.titulo}
                  className="w-full h-56 object-cover"
                />

                <div className="p-4">
                  <h2 className="text-lg font-bold text-ink">
                    {pedido.titulo}
                  </h2>

                  <p className="text-clay font-semibold mt-2">
                    ${pedido.precio}
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    Fecha: {pedido.fecha}
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    Estado: {pedido.estado}
                  </p>

                  <Link
                    to={`/prenda/${pedido.id}`}
                    className="inline-block mt-4 bg-clay text-white px-3 py-2 rounded-lg text-sm hover:bg-clay/90 transition-colors"
                  >
                    Ver producto
                  </Link>
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

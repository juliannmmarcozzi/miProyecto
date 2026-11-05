
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = import.meta.env.VITE_API_URL

interface Pedido {
  id: number;
  producto_id: number;
  titulo: string;
  foto: string | null;
  precio_final: number | string;
  estado: string;
  fecha: string;
  comprador_id: number;
  comprador_nombre_usuario: string;
  vendedor_id: number;
  vendedor_nombre_usuario: string;
  mi_rol: 'comprador' | 'vendedor';
}

export default function MisPedidos() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargarPedidos() {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/mis_ordenes`, {
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
          throw new Error('No se pudieron cargar los pedidos.');
        }

        const datos = await res.json();

        const lista: Pedido[] = Array.isArray(datos)
          ? datos
          : Array.isArray(datos.ordenes)
            ? datos.ordenes
            : [];

        if (activo) {
          setPedidos(
            lista.filter(
              (pedido) => pedido.mi_rol === 'comprador'
            )
          );
        }
      } catch (error) {
        console.error(error);

        if (activo) {
          setError('No se pudieron cargar tus pedidos.');
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarPedidos();

    return () => {
      activo = false;
    };
  }, [navigate]);

  function formatearPrecio(precio: number | string) {
    return Number(precio).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function formatearFecha(fecha: string) {
    if (!fecha) return 'No especificada';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return 'No especificada';
    }

    return valor.toLocaleDateString('es-AR');
  }

  return (
    <div className="min-h-screen bg-[#0D1628] text-[#E7ECF5] flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Pedidos realizados
            </h1>

            <p className="text-sm text-[#A9BAD0] mt-2">
              Consultá tus pedidos y comunicate con los vendedores.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!cargando && !error && (
              <span className="bg-[#172A45] border border-[#294768] rounded-full px-4 py-2 text-xs text-[#D5E3F4]">
                {pedidos.length}{' '}
                {pedidos.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            )}

            <Link
              to="/perfil"
              className="text-sm text-[#A9BAD0] hover:text-white transition-colors"
            >
              Volver a mi perfil
            </Link>
          </div>
        </div>

        {cargando ? (
          <p className="text-[#A9BAD0] text-center py-12">
            Cargando pedidos...
          </p>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-12">
            {error}
          </p>
        ) : pedidos.length === 0 ? (
          <div className="bg-[#1C293E] border border-[#294768] rounded-xl p-10 text-center">
            <h2 className="text-lg font-semibold text-white">
              Todavía no realizaste ningún pedido
            </h2>

            <p className="text-sm text-[#A9BAD0] mt-2 mb-6">
              Cuando solicites una prenda, tu pedido va a aparecer acá.
            </p>

            <Link
              to="/"
              className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Explorar prendas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="bg-[#1C293E] border border-[#294768] rounded-xl overflow-hidden flex flex-col"
              >
                <div className="bg-[#102039] h-64 overflow-hidden">
                  {pedido.foto ? (
                    <img
                      src={pedido.foto}
                      alt={pedido.titulo}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#91A5BF] text-sm">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-[#91A5BF]">
                    Pedido #{pedido.id}
                  </p>

                  <h2 className="font-display text-lg font-semibold text-white mt-2">
                    {pedido.titulo}
                  </h2>

                  <div className="mt-4">
                    <p className="text-xs text-[#91A5BF]">
                      Publicado por
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full bg-[#294367] flex items-center justify-center shrink-0">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-[#A9BAD0]"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20a8 8 0 0 1 16 0" />
                        </svg>
                      </div>

                      <span className="text-sm font-medium text-white">
                        {pedido.vendedor_nombre_usuario}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs text-[#91A5BF]">
                      Precio de la prenda
                    </p>

                    <p className="text-2xl font-bold text-white mt-1">
                      ${formatearPrecio(pedido.precio_final)}
                    </p>
                  </div>

                  <div className="border-t border-[#34465F] mt-5 pt-4">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-[#91A5BF]">
                        Fecha del pedido
                      </span>

                      <span className="text-[#E7ECF5]">
                        {formatearFecha(pedido.fecha)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#A9BAD0] mt-5 leading-relaxed">
                    Comunicate con el vendedor para coordinar el pago y la entrega.
                  </p>

                  <Link
                    to={`/chat/${pedido.producto_id}?usuario=${encodeURIComponent(
                      pedido.vendedor_nombre_usuario
                    )}`}
                    className="block w-full text-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3 font-semibold text-sm mt-5 transition-colors"
                  >
                    Enviar mensaje
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

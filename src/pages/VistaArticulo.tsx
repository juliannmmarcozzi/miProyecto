
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPrenda, type Prenda } from '../features/browse/api/prendas';

export default function VistaArticulo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prenda, setPrenda] = useState<Prenda | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    if (!id) {
      setPrenda(null);
      setCargando(false);
      return;
    }

    let activo = true;

    setCargando(true);
    setError('');
    setPrenda(null);
    setMostrarDetalles(false);

    getPrenda(id)
      .then((datos) => {
        if (activo) setPrenda(datos ?? null);
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar la prenda.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando || error || !prenda) {
    return (
      <div className="min-h-screen bg-[#0D1628] flex flex-col items-center justify-center gap-4">
        <p className="text-[#A9BAD0]">
          {cargando
            ? 'Cargando prenda...'
            : error || 'Prenda no encontrada.'}
        </p>

        {!cargando && (
          <Link
            to="/"
            className="bg-[#2563EB] text-white rounded-lg px-5 py-2.5"
          >
            Volver al inicio
          </Link>
        )}
      </div>
    );
  }

  const precioFormateado = Number(prenda.precio).toLocaleString('es-AR');

  const fecha = prenda.fechaPublicacion
    ? new Date(prenda.fechaPublicacion).toLocaleDateString('es-AR')
    : 'No especificada';

  const detalles = [
    { nombre: 'Tipo de prenda', valor: prenda.tipoPrenda },
    { nombre: 'Color', valor: prenda.color },
    { nombre: 'Género', valor: prenda.genero },
    { nombre: 'Stock', valor: prenda.stock > 0 ? prenda.stock : null },
    { nombre: 'Fecha de publicación', valor: fecha },
  ];

  return (
    <div className="min-h-dvh bg-[#0D1628] text-[#E7ECF5]">
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-6">

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#A9BAD0] hover:text-white transition-colors mb-7"
        >
          <span className="w-9 h-9 rounded-full bg-[#172A45] flex items-center justify-center">
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
          </span>
          Volver a publicaciones
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">

          <div className="w-full aspect-square max-h-[65vh] bg-[#102039] border border-[#294768] rounded-xl overflow-hidden flex items-center justify-center">
            {prenda.imagenes[0] ? (
              <img
                src={prenda.imagenes[0]}
                alt={prenda.titulo}
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-[#8195AE] text-sm">
                Sin imagen
              </p>
            )}
          </div>

          <div className="flex flex-col min-w-0">

            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white leading-tight">
              {prenda.titulo}
            </h1>

            <p className="text-[#A9BAD0] mt-2">
              {prenda.marca}
            </p>

            <p className="text-white font-bold text-3xl sm:text-4xl mt-5">
              ${precioFormateado}
            </p>

            <div className="bg-[#0E1D32] border border-[#294768] rounded-xl mt-6 px-5">

              <div className="flex items-center gap-4 py-4 border-b border-[#253854]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#75A7F8"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7 shrink-0"
                >
                  <path d="m16 4 4 3-3 5-3-2v11H6V10l-3 2-2-5 5-3 3 2h4l3-2Z" />
                </svg>

                <div>
                  <p className="text-xs text-[#91A5BF]">
                    Talle
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {prenda.talle || 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#75A7F8"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7 shrink-0"
                >
                  <path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5l-8-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>

                <div>
                  <p className="text-xs text-[#91A5BF]">
                    Estado de la prenda
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {prenda.estado || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl py-3.5 font-semibold transition-colors cursor-pointer"
              >
                Comprar ahora
              </button>

              <button
                type="button"
                className="border border-[#3B82F6] hover:bg-[#172A45] text-[#E7ECF5] rounded-xl py-3.5 font-semibold transition-colors cursor-pointer"
              >
                Ofertar
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/chat/${prenda.id}`)}
              className="mt-3 w-full border border-[#294768] bg-[#172A45] hover:bg-[#213C5D] text-[#E7ECF5] rounded-xl py-3 font-medium transition-colors cursor-pointer"
            >
              Enviar mensaje
            </button>

            <div className="mt-7 border-t border-[#294768] pt-4">
              <button
                type="button"
                onClick={() => setMostrarDetalles(!mostrarDetalles)}
                aria-expanded={mostrarDetalles}
                className="w-full flex items-center justify-between text-sm text-[#B9C9DC] hover:text-white transition-colors cursor-pointer"
              >
                <span className="font-medium">
                  Más información de la prenda
                </span>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-4 h-4 transition-transform ${
                    mostrarDetalles ? 'rotate-180' : ''
                  }`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {mostrarDetalles && (
                <div className="mt-4 space-y-3">
                  {detalles.map((detalle) => (
                    <div
                      key={detalle.nombre}
                      className="flex justify-between items-start gap-4 text-sm"
                    >
                      <span className="text-[#91A5BF]">
                        {detalle.nombre}
                      </span>

                      <span className="text-[#E7ECF5] text-right">
                        {detalle.valor || 'No especificado'}
                      </span>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-[#253854]">
                    <p className="text-[#91A5BF] text-sm mb-2">
                      Descripción
                    </p>
                    <p className="text-[#D1DCEB] text-sm leading-relaxed whitespace-pre-line">
                      {prenda.descripcion || 'Sin descripción.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-8">
              <div className="w-11 h-11 rounded-full bg-[#172A45] border border-[#294768] flex items-center justify-center text-[#A9BAD0]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </div>

              <div>
                <p className="text-xs text-[#91A5BF]">
                  Publicado por
                </p>
                <p className="text-white font-semibold text-sm">
                  {prenda.usuario}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

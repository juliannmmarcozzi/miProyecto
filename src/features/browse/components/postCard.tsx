
import { Link } from 'react-router-dom';
import type { Prenda } from '../api/prendas';

export default function PostCard({ prenda }: { prenda: Prenda }) {
  const precioFormateado = Number(prenda.precio).toLocaleString('es-AR');

  return (
    <Link
      to={`/prenda/${prenda.id}`}
      className="group block bg-[#0E1D32] border border-[#233E5D] rounded-xl overflow-hidden hover:border-[#3C638C] transition-colors"
    >
      <div className="relative aspect-[4/3] bg-[#102039] overflow-hidden">
        {prenda.imagenes[0] ? (
          <img
            src={prenda.imagenes[0]}
            alt={prenda.titulo}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8195AE] text-sm">
            Sin imagen
          </div>
        )}

        <div
          className="absolute top-3 right-3 w-9 h-9 rounded-full border border-[#DCE7F5] bg-[#0B192C]/70 flex items-center justify-center text-white"
          title="Favoritos"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </div>
      </div>

      <div className="px-3.5 pt-3 pb-3.5">
        <h3 className="font-display font-semibold text-sm text-[#F3F6FB] truncate">
          {prenda.titulo}
        </h3>

        <p className="text-xs text-[#A9BAD0] mt-1 truncate">
          {prenda.marca}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="bg-[#213B5D] text-[#DAE7F6] text-xs rounded-full px-3 py-1">
            {prenda.talle}
          </span>

          {prenda.estado && (
            <span className="bg-[#213B5D] text-[#DAE7F6] text-xs rounded-full px-3 py-1">
              {prenda.estado}
            </span>
          )}
        </div>

        <div className="mt-3">
          <span className="font-bold text-lg text-white">
            ${precioFormateado}
          </span>
        </div>
      </div>
    </Link>
  );
}

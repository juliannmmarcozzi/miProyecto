import { Link } from 'react-router-dom';
import type { Prenda } from '../api/prendas';

export default function PostCard({ prenda }: { prenda: Prenda }) {
  return (
    <Link
      to={`/prenda/${prenda.id}`}
      className="block bg-white border border-umber/15 rounded-2xl overflow-hidden"
    >
      <div className="relative aspect-square bg-umber/10">
        {prenda.imagenes[0] ? (
          <img
            src={prenda.imagenes[0]}
            alt={prenda.titulo}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-umber/50 text-sm">
            Sin imagen
          </div>
        )}

        <span className="absolute bottom-2 left-2 bg-clay text-white px-2 py-1 rounded-md text-sm font-mono font-semibold shadow-sm">
          ${prenda.precio}
        </span>
      </div>

      <div className="p-3">
        <p className="font-display font-bold text-base text-ink truncate">{prenda.titulo}</p>
        <p className="text-xs text-umber/70 mt-0.5">
          {prenda.marca} · Talle {prenda.talle} · {prenda.color}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1">
            {prenda.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono uppercase tracking-wide bg-forest/10 text-forest px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-umber/70 shrink-0">
            <span>👁 {prenda.visualizaciones}</span>
            <span className="text-clay">♥ {prenda.likes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

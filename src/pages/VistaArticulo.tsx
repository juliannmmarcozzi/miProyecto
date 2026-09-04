import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPrenda, type Prenda } from '../features/browse/api/prendas';

export default function VistaArticulo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prenda, setPrenda] = useState<Prenda | null>(null);

  useEffect(() => {
    if (id) getPrenda(id).then((p) => setPrenda(p ?? null));
  }, [id]);

  if (!prenda) return <p className="p-4 text-umber/60">Prenda no encontrada.</p>;

  const specs = [
    { label: 'Marca', value: prenda.marca },
    { label: 'Tipo', value: prenda.tipoPrenda },
    { label: 'Talle', value: prenda.talle },
    { label: 'Estado', value: prenda.estado },
    { label: 'Color', value: prenda.color },
    { label: 'Género', value: prenda.genero },
    { label: 'Stock', value: prenda.stock },
    { label: 'Subido', value: new Date(prenda.fechaPublicacion).toLocaleDateString() },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Link
        to="/"
        aria-label="Volver al browser"
        className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center mb-4"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-ink">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 aspect-square bg-umber/10 rounded-2xl overflow-hidden shrink-0">
          {prenda.imagenes[0] && (
            <img src={prenda.imagenes[0]} alt={prenda.titulo} className="w-full h-full object-contain" />
          )}
        </div>

        <div className="md:w-1/2 flex flex-col">
          <h1 className="font-display font-bold text-2xl text-ink">{prenda.titulo}</h1>
          <p className="text-sm text-umber/70 mt-1">
            Publicado por {prenda.usuario} · 👁 {prenda.visualizaciones} · ♥ {prenda.likes}
          </p>

          <p className="text-clay font-mono font-bold text-2xl mt-3">${prenda.precio}</p>

          <div className="border border-umber/15 rounded-2xl mt-4 divide-y divide-umber/10 overflow-hidden">
            {specs.map((spec) => (
              <div key={spec.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-umber/60">{spec.label}</span>
                <span className="text-ink font-medium">{spec.value}</span>
              </div>
            ))}
          </div>

          <p className="text-ink text-sm mt-4">{prenda.descripcion}</p>

          {prenda.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {prenda.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono uppercase tracking-wide bg-forest/10 text-forest px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-6">
            <button className="bg-clay text-white rounded-lg py-2.5 font-medium hover:bg-clay/90 transition-colors">
              Comprar
            </button>
            <button className="border border-clay text-clay rounded-lg py-2.5 font-medium hover:bg-clay/5 transition-colors">
              Hacer una oferta
            </button>
            <button
              onClick={() => navigate(`/chat/${prenda.id}`)}
              className="border border-umber/25 text-ink rounded-lg py-2.5 font-medium hover:bg-umber/5 transition-colors"
            >
              Enviar mensaje
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPrenda, type Prenda } from '../features/browse/api/prendas';

export default function VistaArticulo() {
  const { id } = useParams();
  const [prenda, setPrenda] = useState<Prenda | null>(null);

  useEffect(() => {
    if (id) getPrenda(id).then((p) => setPrenda(p ?? null));
  }, [id]);

  if (!prenda) return <p className="p-4 text-umber/60">Prenda no encontrada.</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="aspect-square bg-umber/10 rounded-2xl overflow-hidden mb-4">
        {prenda.imagenes[0] && (
          <img src={prenda.imagenes[0]} alt={prenda.titulo} className="w-full h-full object-contain" />
        )}
      </div>

      <h1 className="font-display font-bold text-2xl text-ink">{prenda.titulo}</h1>
      <p className="text-clay font-mono font-semibold text-lg mt-1">${prenda.precio}</p>

      <p className="text-sm text-umber/70 mt-3">
        Publicado por {prenda.usuario} el {new Date(prenda.fechaPublicacion).toLocaleDateString()}
      </p>
      <p className="text-sm text-umber/70">
        👁 {prenda.visualizaciones} vistas · ♥ {prenda.likes} likes
      </p>

      <p className="text-ink mt-4">{prenda.descripcion}</p>

      <div className="text-sm text-umber/80 mt-4 flex flex-col gap-1">
        <p>Tipo: {prenda.tipoPrenda}</p>
        <p>Marca: {prenda.marca}</p>
        <p>Color: {prenda.color}</p>
        <p>Talle: {prenda.talle}</p>
        <p>Estado: {prenda.estado}</p>
        <p>Género: {prenda.genero}</p>
        <p>Stock: {prenda.stock}</p>
        <p>Tags: {prenda.tags.join(', ')}</p>
      </div>
    </div>
  );
}

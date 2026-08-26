import { useEffect, useState } from 'react';
import { createPost, getPrendas, type Prenda } from '../features/browse/api/prendas';

export default function Browser() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);

  useEffect(() => {
    getPrendas().then(setPrendas);
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();
    const f = e.target;

    await createPost({
      descripcion: f.descripcion.value,
      precio: Number(f.precio.value),
      imagenes: f.imagen.value ? [f.imagen.value] : [],
      tipoPrenda: f.tipoPrenda.value,
      marca: f.marca.value,
      color: f.color.value,
      talle: f.talle.value,
      estado: f.estado.value,
      tags: f.tags.value.split(',').map((t: string) => t.trim()).filter(Boolean),
      genero: f.genero.value,
      stock: Number(f.stock.value),
    });

    f.reset();
    setPrendas(await getPrendas());
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white text-black min-h-screen">
      <h1 className="text-xl font-bold mb-2">Publicar prenda</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-6">
        <input name="descripcion" placeholder="Descripción" required className="border border-gray-400 p-2" />
        <input name="precio" type="number" placeholder="Precio" required className="border border-gray-400 p-2" />
        <input name="imagen" placeholder="Imagen (URL)" className="border border-gray-400 p-2" />
        <input name="tipoPrenda" placeholder="Tipo de prenda" required className="border border-gray-400 p-2" />
        <input name="marca" placeholder="Marca" required className="border border-gray-400 p-2" />
        <input name="color" placeholder="Color" required className="border border-gray-400 p-2" />
        <input name="talle" placeholder="Talle" required className="border border-gray-400 p-2" />
        <input name="estado" placeholder="Estado" required className="border border-gray-400 p-2" />
        <input name="tags" placeholder="Tags (separados por coma)" className="border border-gray-400 p-2" />
        <input name="genero" placeholder="Género" required className="border border-gray-400 p-2" />
        <input name="stock" type="number" placeholder="Stock" required className="border border-gray-400 p-2" />
        <button type="submit" className="bg-blue-600 text-white p-2">Publicar</button>
      </form>

      <h1 className="text-xl font-bold mb-2">Prendas publicadas</h1>
      <div className="flex flex-col gap-4">
        {prendas.map((prenda) => (
          <div key={prenda.id} className="border border-gray-400 p-2">
            {prenda.imagenes[0] && (
              <img src={prenda.imagenes[0]} alt="" className="w-full h-40 object-contain mb-2" />
            )}
            <p>{prenda.descripcion}</p>
            <p>${prenda.precio}</p>
            <p>Tipo: {prenda.tipoPrenda}</p>
            <p>Marca: {prenda.marca}</p>
            <p>Color: {prenda.color}</p>
            <p>Talle: {prenda.talle}</p>
            <p>Estado: {prenda.estado}</p>
            <p>Género: {prenda.genero}</p>
            <p>Stock: {prenda.stock}</p>
            <p>Tags: {prenda.tags.join(', ')}</p>
            <p>Likes: {prenda.likes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

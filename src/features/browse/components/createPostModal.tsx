import { useState } from 'react';
import { createPost } from '../api/prendas';

export default function CreatePostModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleImageChange(e: any) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    const f = e.target;

    await createPost({
      titulo: f.titulo.value,
      descripcion: f.descripcion.value,
      precio: Number(f.precio.value),
      imagenes: preview ? [preview] : [],
      tipoPrenda: f.tipoPrenda.value,
      marca: f.marca.value,
      color: f.color.value,
      talle: f.talle.value,
      estado: f.estado.value,
      tags: f.tags.value.split(',').map((t: string) => t.trim()).filter(Boolean),
      genero: f.genero.value,
      stock: Number(f.stock.value),
    });

    onCreated();
    onClose();
  }

  const inputClass =
    'border border-umber/25 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay';

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-cream rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink text-cream hover:bg-ink/80 flex items-center justify-center z-10"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
          <label className="md:w-1/2 aspect-square bg-umber/10 flex items-center justify-center cursor-pointer relative overflow-hidden">
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-umber/60 text-sm text-center px-6">
                Tocá para subir una foto de la prenda
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          <div className="md:w-1/2 p-5 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
            <h2 className="font-display font-bold text-lg text-ink mb-1">Publicar prenda</h2>

            <input name="titulo" placeholder="Título" required className={inputClass} />
            <input name="descripcion" placeholder="Descripción" required className={inputClass} />
            <input name="precio" type="number" placeholder="Precio" required className={inputClass} />
            <input name="tipoPrenda" placeholder="Tipo de prenda" required className={inputClass} />
            <input name="marca" placeholder="Marca" required className={inputClass} />

            <div className="flex gap-2">
              <input name="color" placeholder="Color" required className={inputClass + ' flex-1'} />
              <input name="talle" placeholder="Talle" required className={inputClass + ' w-20'} />
            </div>

            <select name="estado" required defaultValue="" className={inputClass}>
              <option value="" disabled>Estado</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Usado">Usado</option>
            </select>

            <select name="genero" required defaultValue="" className={inputClass}>
              <option value="" disabled>Género</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Unisex">Unisex</option>
            </select>

            <input name="stock" type="number" placeholder="Stock" required className={inputClass} />
            <input name="tags" placeholder="Tags (separados por coma)" className={inputClass} />

            <button
              type="submit"
              className="mt-2 bg-clay text-white rounded-lg py-2.5 font-medium hover:bg-clay/90 transition-colors"
            >
              Publicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { createPost } from '../api/prendas';

export default function CreatePostModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      setImageError(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!preview) {
      setImageError(true);
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setError('Tenés que iniciar sesión para publicar.');
      return;
    }

    const f = e.currentTarget;
    const datos = new FormData(f);

    setCargando(true);
    setError('');

    try {
      const resPerfil = await fetch('http://localhost:3000/perfil', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resPerfil.ok) {
        throw new Error('No se pudo obtener el usuario.');
      }

      const usuario = await resPerfil.json();

      if (!usuario.id) {
        throw new Error('No se encontró el ID del usuario.');
      }

      await createPost({
        titulo: String(datos.get('titulo')),
        descripcion: String(datos.get('descripcion')),
        precio: Number(datos.get('precio')),
        imagenes: [preview],
        tipoPrenda: String(datos.get('tipoPrenda')),
        marca: String(datos.get('marca')),
        color: String(datos.get('color')),
        talle: String(datos.get('talle')),
        estado: String(datos.get('estado')),
        tags: String(datos.get('tags'))
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        genero: String(datos.get('genero')),
        stock: Number(datos.get('stock')),
      }, usuario.id);

      onCreated();
      onClose();

    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo crear la publicación.'
      );
    } finally {
      setCargando(false);
    }
  }

  const inputClass =
    'border border-umber/25 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay';

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-cream rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl">

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink text-cream hover:bg-ink/80 flex items-center justify-center z-10"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">

          <label
            className={
              'md:w-1/2 aspect-square bg-umber/10 flex items-center justify-center cursor-pointer relative overflow-hidden' +
              (imageError ? ' ring-2 ring-clay' : '')
            }
          >
            {preview ? (
              <img
                src={preview}
                alt="Vista previa de la prenda"
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className={
                  'text-sm text-center px-6' +
                  (imageError ? ' text-clay' : ' text-umber/60')
                }
              >
                {imageError
                  ? 'Subí una foto de la prenda'
                  : 'Tocá para subir una foto de la prenda'}
              </span>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          <div className="md:w-1/2 p-5 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">

            <h2 className="font-display font-bold text-lg text-ink mb-1">
              Publicar prenda
            </h2>

            <input
              name="titulo"
              placeholder="Título"
              required
              className={inputClass}
            />

            <input
              name="descripcion"
              placeholder="Descripción"
              required
              className={inputClass}
            />

            <input
              name="precio"
              type="number"
              min="1"
              placeholder="Precio"
              required
              className={inputClass}
            />

            <input
              name="tipoPrenda"
              placeholder="Tipo de prenda"
              required
              className={inputClass}
            />

            <input
              name="marca"
              placeholder="Marca"
              required
              className={inputClass}
            />

            <div className="flex gap-2">
              <input
                name="color"
                placeholder="Color"
                required
                className={inputClass + ' flex-1 min-w-0'}
              />

              <input
                name="talle"
                placeholder="Talle"
                required
                className={inputClass + ' w-20'}
              />
            </div>

            <select
              name="estado"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>Estado</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Usado">Usado</option>
            </select>

            <select
              name="genero"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>Género</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Unisex">Unisex</option>
            </select>

            <input
              name="stock"
              type="number"
              min="1"
              placeholder="Stock"
              required
              className={inputClass}
            />

            <input
              name="tags"
              placeholder="Tags (separados por coma)"
              required
              className={inputClass}
            />

            {error && (
              <p className="text-red-600 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="mt-2 bg-clay text-white rounded-lg py-2.5 font-medium hover:bg-clay/90 transition-colors disabled:opacity-50"
            >
              {cargando ? 'Publicando...' : 'Publicar'}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

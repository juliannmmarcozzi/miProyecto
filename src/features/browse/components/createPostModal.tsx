
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { createPost } from '../api/prendas';

const API_URL = 'http://localhost:3000';

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

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Seleccioná un archivo de imagen válido.');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setError('La imagen no puede superar los 6 MB.');
      return;
    }

    setError('');
    setImageError(false);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreview(reader.result);
      }
    };

    reader.onerror = () => {
      setError('No se pudo cargar la imagen.');
    };

    reader.readAsDataURL(file);
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

    const datos = new FormData(e.currentTarget);

    setCargando(true);
    setError('');

    try {
      const resPerfil = await fetch(`${API_URL}/mi_perfil`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resPerfil.status === 401) {
        throw new Error('Tu sesión venció. Volvé a iniciar sesión.');
      }

      if (!resPerfil.ok) {
        throw new Error('No se pudo obtener el usuario.');
      }

      const usuario = await resPerfil.json();

      if (!usuario.id) {
        throw new Error('No se encontró el ID del usuario.');
      }

      await createPost(
        {
          titulo: String(datos.get('titulo')),
          descripcion: String(datos.get('descripcion')),
          precio: Number(datos.get('precio')),
          imagenes: [preview],
          tipoPrenda: String(datos.get('tipoPrenda')),
          marca: String(datos.get('marca')),
          color: String(datos.get('color')),
          talle: String(datos.get('talle')),
          estado: String(datos.get('estado')),
          genero: String(datos.get('genero')),
          stock: Number(datos.get('stock')),
        },
        usuario.id
      );

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
    'block w-full min-w-0 h-11 box-border bg-[#0B192D] border border-[#294768] rounded-lg px-3.5 text-sm text-[#E7ECF5] placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5] focus:ring-1 focus:ring-[#4B83D5]/30 transition-colors';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl max-h-[90dvh] bg-[#0E1D32] border border-[#294768] rounded-2xl overflow-hidden shadow-2xl">

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-[#172A45] hover:bg-[#294768] text-white flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row max-h-[90dvh] overflow-y-auto md:overflow-hidden"
        >
          <label
            className={
              'w-full md:w-1/2 md:shrink-0 min-h-48 md:min-h-0 bg-[#102039] flex items-center justify-center cursor-pointer relative overflow-hidden border-b md:border-b-0 md:border-r border-[#294768]' +
              (imageError ? ' ring-2 ring-inset ring-red-400' : '')
            }
          >
            {preview ? (
              <img
                src={preview}
                alt="Vista previa de la prenda"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-[#8195AE]"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>

                <span
                  className={
                    'text-sm ' +
                    (imageError ? 'text-red-400' : 'text-[#A9BAD0]')
                  }
                >
                  {imageError
                    ? 'Subí una foto de la prenda'
                    : 'Tocá para subir una foto de la prenda'}
                </span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          <div className="w-full md:w-1/2 min-w-0 p-5 sm:p-6 flex flex-col gap-3 md:max-h-[90dvh] md:overflow-y-auto">

            <h2 className="font-display font-bold text-xl text-white mb-2 pr-10">
              Publicar prenda
            </h2>

            <input
              name="titulo"
              placeholder="Título"
              required
              className={inputClass}
            />

            <textarea
              name="descripcion"
              placeholder="Descripción"
              required
              rows={3}
              className="block w-full min-w-0 min-h-24 box-border bg-[#0B192D] border border-[#294768] rounded-lg px-3.5 py-3 text-sm text-[#E7ECF5] placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5] focus:ring-1 focus:ring-[#4B83D5]/30 resize-y"
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

            <div className="grid grid-cols-[minmax(0,65fr)_minmax(0,35fr)] gap-2 w-full">
              <input
                name="color"
                placeholder="Color"
                required
                className={inputClass}
              />

              <input
                name="talle"
                placeholder="Talle"
                required
                className={inputClass}
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

            {error && (
              <p className="text-red-400 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="mt-2 w-full shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cargando ? 'Publicando...' : 'Publicar'}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

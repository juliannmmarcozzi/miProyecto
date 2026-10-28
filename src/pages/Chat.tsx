
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPrenda, type Prenda } from '../features/browse/api/prendas';

interface Mensaje {
  id: number;
  texto: string;
  usuario_id: number;
  fecha: string;
}

export default function Chat() {
  const { id } = useParams();

  const [prenda, setPrenda] = useState<Prenda | null>(null);
  const [mensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const finalChat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) {
      setCargando(false);
      setError('No se encontró la publicación.');
      return;
    }

    let activo = true;

    setCargando(true);
    setError('');

    getPrenda(id)
      .then((datos) => {
        if (activo) setPrenda(datos ?? null);
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar la publicación.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  useEffect(() => {
    finalChat.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!texto.trim()) return;

    setError('La mensajería todavía no está disponible en el backend.');
  }

  const precioFormateado = prenda
    ? Number(prenda.precio).toLocaleString('es-AR')
    : '';

  return (
    <div className="h-dvh bg-[#0D1628] text-[#E7ECF5] flex flex-col overflow-hidden">

      <header className="bg-[#10192E] border-b border-[#253854] px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
        <Link
          to={prenda ? `/prenda/${prenda.id}` : '/'}
          aria-label="Volver a la publicación"
          className="w-10 h-10 rounded-full bg-[#172A45] hover:bg-[#213C5D] flex items-center justify-center shrink-0 transition-colors"
        >
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
        </Link>

        <div className="w-11 h-11 rounded-full bg-[#172A45] border border-[#36577A] flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-[#A9BAD0]"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20a8 8 0 0 1 16 0" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display font-semibold text-base text-white truncate">
            {prenda?.usuario ? `Vendedor ${prenda.usuario}` : 'Chat con vendedor'}
          </h1>

          <p className="text-xs text-[#91A5BF]">
            Conversación sobre una publicación
          </p>
        </div>
      </header>

      {prenda && (
        <Link
          to={`/prenda/${prenda.id}`}
          className="bg-[#0E1D32] border-b border-[#253854] px-4 sm:px-6 py-3 flex items-center gap-3 hover:bg-[#172A45] transition-colors shrink-0"
        >
          <div className="w-14 h-14 rounded-lg bg-[#102039] border border-[#294768] overflow-hidden shrink-0 flex items-center justify-center">
            {prenda.imagenes[0] ? (
              <img
                src={prenda.imagenes[0]}
                alt={prenda.titulo}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-[#91A5BF]">
                Sin imagen
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {prenda.titulo}
            </p>

            <p className="text-sm font-bold text-[#93C5FD] mt-1">
              ${precioFormateado}
            </p>
          </div>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-[#91A5BF] ml-auto shrink-0"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 min-h-full">

          {cargando ? (
            <p className="text-center text-sm text-[#91A5BF]">
              Cargando publicación...
            </p>
          ) : error && !prenda ? (
            <p className="text-center text-sm text-red-400">
              {error}
            </p>
          ) : mensajes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#172A45] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 text-[#91A5BF]"
                >
                  <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9L13 3a8.5 8.5 0 0 1 8 8v.5Z" />
                </svg>
              </div>

              <p className="text-white font-medium">
                Todavía no hay mensajes
              </p>

              <p className="text-sm text-[#91A5BF] max-w-xs">
                Cuando esté conectada la mensajería, vas a poder conversar con el vendedor desde acá.
              </p>
            </div>
          ) : (
            mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className="self-start max-w-[80%] bg-[#1B2E48] border border-[#294768] rounded-2xl px-4 py-3"
              >
                <p className="text-sm text-[#E7ECF5] whitespace-pre-wrap break-words">
                  {mensaje.texto}
                </p>
              </div>
            ))
          )}

          <div ref={finalChat} />
        </div>
      </main>

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-[#10192E] border-t border-[#253854] px-4 sm:px-6 py-4 shrink-0"
      >
        <div className="max-w-5xl mx-auto">
          {error && prenda && (
            <p className="text-red-400 text-xs mb-3">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 bg-[#0B192D] border border-[#294768] rounded-xl p-2 focus-within:border-[#3B82F6] transition-colors">
            <input
              name="mensaje"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                if (error && prenda) setError('');
              }}
              placeholder="Escribí un mensaje..."
              disabled={!prenda || cargando}
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-[#E7ECF5] placeholder:text-[#91A5BF] outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!texto.trim() || !prenda || cargando}
              aria-label="Enviar mensaje"
              className="w-10 h-10 shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPrenda, type Prenda } from '../features/browse/api/prendas';

const API_URL = 'http://localhost:3001';

interface Mensaje {
  texto: string;
  usuario: string;
}

export default function Chat() {
  const { id } = useParams();
  const [prenda, setPrenda] = useState<Prenda | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  useEffect(() => {
    if (id) {
      getPrenda(id).then((p) => setPrenda(p ?? null));
      fetch(`${API_URL}/api/mensajes/${id}`)
        .then((res) => res.json())
        .then(setMensajes);
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    const texto = f.mensaje.value;
    if (!texto) return;

    const res = await fetch(`${API_URL}/api/mensajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prendaId: id, texto }),
    });
    const mensaje = await res.json();

    setMensajes((prev) => [...prev, mensaje]);
    f.reset();
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <header className="bg-ink text-cream px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <Link
          to={prenda ? `/prenda/${prenda.id}` : '/'}
          aria-label="Volver a la publicación"
          className="w-9 h-9 rounded-full bg-cream/10 hover:bg-cream/20 flex items-center justify-center shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="w-9 h-9 rounded-full bg-clay/80 flex items-center justify-center font-display font-bold text-sm shrink-0">
          {(prenda?.usuario ?? '?').charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="font-display font-bold text-sm truncate">{prenda?.usuario ?? 'Vendedor'}</p>
          <p className="text-[11px] text-cream/50">En línea</p>
        </div>
      </header>

      {prenda && (
        <Link
          to={`/prenda/${prenda.id}`}
          className="bg-white border-b border-umber/15 px-4 py-2 flex items-center gap-3 hover:bg-umber/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-umber/10 overflow-hidden shrink-0">
            {prenda.imagenes[0] && (
              <img src={prenda.imagenes[0]} alt={prenda.titulo} className="w-full h-full object-contain" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink truncate">{prenda.titulo}</p>
            <p className="text-xs text-clay font-mono font-bold">${prenda.precio}</p>
          </div>
        </Link>
      )}

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {mensajes.map((m, i) => (
          <div key={i} className="bg-white border border-umber/15 rounded-lg px-3 py-2 max-w-[80%]">
            <p className="text-[11px] text-umber/50">{m.usuario}</p>
            <p className="text-sm text-ink">{m.texto}</p>
          </div>
        ))}
      </main>

      <form
        onSubmit={handleSubmit}
        className="bg-white border-t border-umber/15 p-3 flex items-center gap-2 sticky bottom-0"
      >
        <input
          name="mensaje"
          placeholder="Escribí un mensaje..."
          className="flex-1 min-w-0 border border-umber/25 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay"
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="w-10 h-10 shrink-0 bg-clay text-white rounded-lg flex items-center justify-center hover:bg-clay/90 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}


import { Link } from 'react-router-dom';
import type { Prenda } from '../api/prendas';

export default function PostCard({
  prenda,
}: {
  prenda: Prenda;
}) {
  const precioFormateado = Number(
    prenda.precio
  ).toLocaleString('es-AR');

  // TÍTULO SIN SALTOS DE LÍNEA
  const titulo = (prenda.titulo || '')
    .replace(/\s+/g, ' ')
    .trim();

  // DESCRIPCIÓN EN UNA SOLA LÍNEA,
  // CON MÁS ESPACIO DONDE HABÍA UN ENTER
  const descripcion = (prenda.descripcion || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map((linea) =>
      linea.replace(/[^\S\n]+/g, ' ').trim()
    )
    .filter(Boolean)
    .join('\u00A0\u00A0\u00A0\u00A0');

  return (
    <Link
      to={`/prenda/${prenda.id}`}
      className="group block bg-[#0E1D32] border border-[#233E5D] rounded-xl overflow-hidden hover:border-[#3C638C] transition-colors"
      style={{
        fontFamily: "'Inter', Arial, sans-serif",
      }}
    >
      {/* IMAGEN DE LA PRENDA */}
      <div className="relative aspect-[4/3] bg-[#102039] overflow-hidden">
        {prenda.imagenes[0] ? (
          <img
            src={prenda.imagenes[0]}
            alt={titulo}
            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8195AE] text-sm">
            Sin imagen
          </div>
        )}
      </div>

      {/* INFORMACIÓN DE LA PRENDA */}
      <div className="px-4 pt-3.5 pb-4">

        {/* TÍTULO */}
        <h3
          className="text-[14px] leading-snug text-[#F3F6FB] truncate group-hover:text-[#93C5FD] transition-colors"
          style={{
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
          title={titulo}
        >
          {titulo}
        </h3>

        {/* DESCRIPCIÓN */}
        <p
          className="mt-1 text-[13px] leading-5 text-[#A9BAD0] truncate"
          title={prenda.descripcion || prenda.marca || ''}
        >
          {descripcion || prenda.marca}
        </p>

        {/* TALLE Y ESTADO */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="bg-[#213B5D] text-[#DAE7F6] text-xs font-medium rounded-full px-3 py-1">
            {prenda.talle}
          </span>

          {prenda.estado && (
            <span className="bg-[#213B5D] text-[#DAE7F6] text-xs font-medium rounded-full px-3 py-1">
              {prenda.estado}
            </span>
          )}
        </div>

        {/* PRECIO */}
        <div className="mt-3">
          <span
            className="text-[22px] leading-tight text-white"
            style={{
              fontWeight: 700,
              letterSpacing: '-0.025em',
            }}
          >
            ${precioFormateado}
          </span>
        </div>
      </div>
    </Link>
  );
}

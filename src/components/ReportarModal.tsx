
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL =
  import.meta.env.VITE_API_URL

type TipoReporte = 'usuario' | 'publicacion';

interface ReportarModalProps {
  abierto: boolean;
  onCerrar: () => void;
  usuarioReportadoId: number;
  nombreUsuario: string;
  tipo: TipoReporte;
  publicacionId?: number;
  tituloPublicacion?: string;
}

const MOTIVOS_USUARIO = [
  'Comportamiento inapropiado',
  'Posible estafa',
  'Acoso o mensajes ofensivos',
  'Cuenta falsa o suplantación de identidad',
  'Otro motivo',
];

const MOTIVOS_PUBLICACION = [
  'Información falsa o engañosa',
  'Producto prohibido o inapropiado',
  'Posible estafa',
  'Fotografías que no corresponden al producto',
  'Otro motivo',
];

export default function ReportarModal({
  abierto,
  onCerrar,
  usuarioReportadoId,
  nombreUsuario,
  tipo,
  publicacionId,
  tituloPublicacion,
}: ReportarModalProps) {
  const navigate = useNavigate();

  const [motivo, setMotivo] = useState('');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  if (!abierto) return null;

  const esPublicacion = tipo === 'publicacion';

  function cerrar() {
    if (enviando) return;

    setMotivo('');
    setComentario('');
    setError('');
    setExito('');
    onCerrar();
  }

  async function enviarReporte(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (enviando) return;

    if (!motivo.trim()) {
      setError('Seleccioná un motivo para continuar.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    if (!Number.isInteger(usuarioReportadoId) ||
        usuarioReportadoId <= 0) {
      setError('No se pudo identificar al usuario.');
      return;
    }

    // El backend guarda reportes de usuarios.
    // Cuando se reporta una prenda, se identifica
    // la publicación dentro del comentario.
    const referencia = esPublicacion && publicacionId
      ? `Publicación ID ${publicacionId}: ${tituloPublicacion || 'Sin título'}.`
      : '';

    const comentarioFinal = [
      referencia,
      comentario.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    if (comentarioFinal.length > 500) {
      setError(
        'El comentario es demasiado largo. Reducí el texto.'
      );
      return;
    }

    setEnviando(true);
    setError('');
    setExito('');

    try {
      const respuesta = await fetch(
        `${API_URL}/reportar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            usuario_reportado_id: usuarioReportadoId,
            motivo: motivo.trim(),
            comentario: comentarioFinal,
          }),
        }
      );

      const datos = await respuesta
        .json()
        .catch(() => ({}));

      if (respuesta.status === 401) {
        throw new Error(
          'Tu sesión venció. Iniciá sesión nuevamente.'
        );
      }

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se pudo enviar el reporte.'
        );
      }

      setExito('Reporte enviado correctamente.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar el reporte.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reportar"
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#0E1D32] border border-[#294768] rounded-2xl p-6 shadow-2xl text-[#E7ECF5]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="titulo-reportar"
              className="text-xl font-bold text-white"
            >
              {esPublicacion
                ? 'Reportar publicación'
                : 'Reportar usuario'}
            </h2>

            <p className="text-sm text-[#A9BAD0] mt-2">
              {esPublicacion
                ? tituloPublicacion || 'Publicación'
                : `Usuario: ${nombreUsuario}`}
            </p>
          </div>

          <button
            type="button"
            onClick={cerrar}
            disabled={enviando}
            className="text-[#A9BAD0] hover:text-white text-xl cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {exito ? (
          <div className="mt-6">
            <p
              role="status"
              className="text-sm text-emerald-300"
            >
              {exito}
            </p>

            <button
              type="button"
              onClick={cerrar}
              className="w-full mt-6 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg py-3 text-sm font-semibold text-white cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form
            onSubmit={enviarReporte}
            className="mt-6"
          >
            <label
              htmlFor="motivo-reporte"
              className="block text-sm font-medium text-white mb-2"
            >
              Motivo del reporte
            </label>

            <select
              id="motivo-reporte"
              value={motivo}
              onChange={(e) =>
                setMotivo(e.target.value)
              }
              required
              disabled={enviando}
              className="w-full bg-[#0B192D] border border-[#294768] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#4B83D5]"
            >
              <option value="">
                Seleccioná un motivo
              </option>

              {(esPublicacion
                ? MOTIVOS_PUBLICACION
                : MOTIVOS_USUARIO
              ).map((opcion) => (
                <option
                  key={opcion}
                  value={opcion}
                >
                  {opcion}
                </option>
              ))}
            </select>

            <label
              htmlFor="comentario-reporte"
              className="block text-sm font-medium text-white mb-2 mt-5"
            >
              Información adicional (opcional)
            </label>

            <textarea
              id="comentario-reporte"
              value={comentario}
              onChange={(e) =>
                setComentario(e.target.value)
              }
              maxLength={esPublicacion ? 350 : 500}
              rows={4}
              disabled={enviando}
              placeholder="Describí brevemente qué ocurrió..."
              className="w-full bg-[#0B192D] border border-[#294768] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5] resize-y"
            />

            {esPublicacion && (
              <p className="mt-3 text-xs text-[#A9BAD0] leading-relaxed">
                Este reporte quedará registrado contra
                el vendedor. Se incluirá una referencia
                a esta publicación para identificarla.
              </p>
            )}

            <p className="mt-3 text-xs text-[#91A5BF] leading-relaxed">
              Enviá reportes únicamente cuando exista
              un motivo legítimo.
            </p>

            {error && (
              <p
                role="alert"
                className="text-red-400 text-sm mt-4"
              >
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={cerrar}
                disabled={enviando}
                className="border border-[#294768] rounded-lg py-3 text-sm hover:bg-[#172A45] disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={enviando}
                className="bg-red-600 hover:bg-red-700 rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
              >
                {enviando
                  ? 'Enviando...'
                  : 'Enviar reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

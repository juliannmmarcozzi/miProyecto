import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { createPost } from '../api/prendas';
import { subirImagen } from '../../../lib/subirImagen';

const API_URL =
  import.meta.env.VITE_API_URL;

const MAX_FOTOS_MANUALES = 6;

type Pantalla = 'seleccion' | 'manual' | 'ia';

interface DatosPrenda {
  titulo: string;
  descripcion: string;
  precio: string;
  tipoPrenda: string;
  marca: string;
  color: string;
  talle: string;
  estado: string;
  genero: string;
  stock: string;
  aliasTransferencia: string;
}

interface ResultadoIA {
  categoria?: string | null;
  subcategoria?: string | null;
  color?: string | null;
  marca?: string | null;
  talle?: string | null;
  detalles?: string | null;
}

interface RespuestaIA {
  prenda?: ResultadoIA;
  error?: string;
}

interface FotosSubidas {
  principal: string;
  etiqueta: string;
  archivoPrincipal: File;
  archivoEtiqueta: File;
}

const datosIniciales: DatosPrenda = {
  titulo: '',
  descripcion: '',
  precio: '',
  tipoPrenda: '',
  marca: '',
  color: '',
  talle: '',
  estado: '',
  genero: '',
  stock: '1',
  aliasTransferencia: '',
};

const inputClass =
  'block w-full min-w-0 h-11 bg-[#0B192D] border border-[#294768] rounded-lg px-3.5 text-sm text-[#E7ECF5] placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5] disabled:opacity-60';

const textareaClass =
  'block w-full min-w-0 min-h-24 bg-[#0B192D] border border-[#294768] rounded-lg px-3.5 py-3 text-sm text-[#E7ECF5] placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5] resize-y disabled:opacity-60';

const labelClass =
  'block text-sm font-medium text-[#C0CDE0] mb-2';

function validarImagen(archivo: File) {
  const tipos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!tipos.includes(archivo.type)) {
    throw new Error(
      'Solo se permiten imágenes JPG, PNG o WebP.'
    );
  }

  if (archivo.size === 0) {
    throw new Error('La imagen está vacía.');
  }

  if (archivo.size > 6 * 1024 * 1024) {
    throw new Error(
      'Cada imagen puede pesar como máximo 6 MB.'
    );
  }
}

function convertirTexto(valor: unknown): string {
  if (typeof valor === 'string') {
    return valor.trim();
  }

  if (
    typeof valor === 'number' &&
    Number.isFinite(valor)
  ) {
    return String(valor);
  }

  return '';
}

export default function CreatePostModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pantalla, setPantalla] =
    useState<Pantalla>('seleccion');

  const [fotosManuales, setFotosManuales] =
    useState<File[]>([]);

  const [previewsManuales, setPreviewsManuales] =
    useState<string[]>([]);

  const [fotoPrendaIA, setFotoPrendaIA] =
    useState<File | null>(null);

  const [fotoEtiquetaIA, setFotoEtiquetaIA] =
    useState<File | null>(null);

  const [previewPrendaIA, setPreviewPrendaIA] =
    useState<string | null>(null);

  const [previewEtiquetaIA, setPreviewEtiquetaIA] =
    useState<string | null>(null);

  const [datos, setDatos] = useState<DatosPrenda>({
    ...datosIniciales,
  });

  const [resultadoIA, setResultadoIA] =
    useState<ResultadoIA | null>(null);

  const [mostrarDatosIA, setMostrarDatosIA] =
    useState(false);

  const [editarManualmente, setEditarManualmente] =
    useState(false);

  const [analizado, setAnalizado] =
    useState(false);

  const [analizando, setAnalizando] =
    useState(false);

  const [publicando, setPublicando] =
    useState(false);

  const [mensajeIA, setMensajeIA] =
    useState('');

  const [error, setError] =
    useState('');

  const fotosSubidasRef =
    useRef<FotosSubidas | null>(null);

  const ocupado = analizando || publicando;

  const camposIABloqueados =
    pantalla === 'ia' &&
    !editarManualmente;

  useEffect(() => {
    const urls = fotosManuales.map((archivo) =>
      URL.createObjectURL(archivo)
    );

    setPreviewsManuales(urls);

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [fotosManuales]);

  useEffect(() => {
    if (!fotoPrendaIA) {
      setPreviewPrendaIA(null);
      return;
    }

    const url = URL.createObjectURL(fotoPrendaIA);

    setPreviewPrendaIA(url);

    return () => URL.revokeObjectURL(url);
  }, [fotoPrendaIA]);

  useEffect(() => {
    if (!fotoEtiquetaIA) {
      setPreviewEtiquetaIA(null);
      return;
    }

    const url = URL.createObjectURL(fotoEtiquetaIA);

    setPreviewEtiquetaIA(url);

    return () => URL.revokeObjectURL(url);
  }, [fotoEtiquetaIA]);

  function cambiarPantalla(nueva: Pantalla) {
    if (ocupado) return;

    setPantalla(nueva);
    setError('');
    setMensajeIA('');
  }

  function actualizarDato(
    campo: keyof DatosPrenda,
    valor: string
  ) {
    setDatos((anteriores) => ({
      ...anteriores,
      [campo]: valor,
    }));
  }

  function invalidarAnalisis() {
    setAnalizado(false);
    setResultadoIA(null);
    setMostrarDatosIA(false);
    setEditarManualmente(false);
    setMensajeIA('');
    fotosSubidasRef.current = null;

    setDatos((anteriores) => ({
      ...anteriores,
      tipoPrenda: '',
      marca: '',
      color: '',
      talle: '',
    }));
  }

  function seleccionarFotosManuales(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const archivos = Array.from(
      e.target.files ?? []
    );

    if (!archivos.length) return;

    try {
      archivos.forEach(validarImagen);

      setFotosManuales((anteriores) => {
        const combinadas = [
          ...anteriores,
          ...archivos,
        ];

        if (
          combinadas.length > MAX_FOTOS_MANUALES
        ) {
          throw new Error(
            `Podés subir hasta ${MAX_FOTOS_MANUALES} fotos por publicación.`
          );
        }

        return combinadas;
      });

      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron seleccionar las fotos.'
      );
    } finally {
      e.target.value = '';
    }
  }

  function eliminarFotoManual(index: number) {
    setFotosManuales((anteriores) =>
      anteriores.filter((_, i) => i !== index)
    );
  }

  function seleccionarFotoPrendaIA(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    try {
      validarImagen(archivo);

      setFotoPrendaIA(archivo);
      invalidarAnalisis();
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Imagen inválida.'
      );
      e.target.value = '';
    }
  }

  function seleccionarFotoEtiquetaIA(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    try {
      validarImagen(archivo);

      setFotoEtiquetaIA(archivo);
      invalidarAnalisis();
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Imagen inválida.'
      );
      e.target.value = '';
    }
  }

  async function analizarConIA() {
    if (ocupado) return;

    setError('');
    setMensajeIA('');

    if (!fotoPrendaIA || !fotoEtiquetaIA) {
      setError(
        'Subí una foto de la prenda y otra de su etiqueta.'
      );
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setError(
        'Tenés que iniciar sesión para analizar.'
      );
      return;
    }

    setAnalizando(true);
    setAnalizado(false);

    try {
      setMensajeIA('Preparando imágenes...');

      let urlPrincipal = '';
      let urlEtiqueta = '';

      const guardadas = fotosSubidasRef.current;

      if (
        guardadas &&
        guardadas.archivoPrincipal === fotoPrendaIA &&
        guardadas.archivoEtiqueta === fotoEtiquetaIA
      ) {
        urlPrincipal = guardadas.principal;
        urlEtiqueta = guardadas.etiqueta;
      } else {
        urlPrincipal = await subirImagen(
          fotoPrendaIA
        );

        urlEtiqueta = await subirImagen(
          fotoEtiquetaIA
        );

        fotosSubidasRef.current = {
          principal: urlPrincipal,
          etiqueta: urlEtiqueta,
          archivoPrincipal: fotoPrendaIA,
          archivoEtiqueta: fotoEtiquetaIA,
        };
      }

      setMensajeIA('Analizando imágenes con IA...');

      const res = await fetch(
        `${API_URL}/analizar_prenda`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            img_main: urlPrincipal,
            img_etiqueta: urlEtiqueta,
          }),
        }
      );

      const respuesta: RespuestaIA =
        await res.json().catch(() => ({}));

      if (res.status === 401) {
        throw new Error(
          'El servidor rechazó tu sesión. Cerrá sesión, iniciá nuevamente y repetí el análisis.'
        );
      }

      if (!res.ok) {
        throw new Error(
          respuesta.error ||
            `Error al analizar la prenda (${res.status}).`
        );
      }

      if (!respuesta.prenda) {
        throw new Error(
          'El análisis no devolvió datos.'
        );
      }

      const resultado = respuesta.prenda;

      setResultadoIA(resultado);

      setDatos((anteriores) => ({
        ...anteriores,
        tipoPrenda: convertirTexto(
          resultado.categoria
        ),
        marca: convertirTexto(
          resultado.marca
        ),
        color: convertirTexto(
          resultado.color
        ),
        talle: convertirTexto(
          resultado.talle
        ),
      }));

      setAnalizado(true);
      setMostrarDatosIA(true);
      setEditarManualmente(false);

      setMensajeIA(
        'Análisis completado. Revisá los datos detectados.'
      );
    } catch (err) {
      console.error(
        'Error al analizar la prenda:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo analizar la prenda.'
      );

      setMensajeIA('');
    } finally {
      setAnalizando(false);
    }
  }

  function validarDatos(): string | null {
    const obligatorios: Array<
      [keyof DatosPrenda, string]
    > = [
      ['titulo', 'título'],
      ['descripcion', 'descripción'],
      ['precio', 'precio'],
      ['tipoPrenda', 'tipo de prenda'],
      ['marca', 'marca'],
      ['color', 'color'],
      ['talle', 'talle'],
      ['estado', 'estado'],
      ['genero', 'género'],
      ['stock', 'stock'],
      [
        'aliasTransferencia',
        'alias de transferencia',
      ],
    ];

    for (const [campo, nombre] of obligatorios) {
      if (!datos[campo].trim()) {
        if (
          pantalla === 'ia' &&
          [
            'tipoPrenda',
            'marca',
            'color',
            'talle',
          ].includes(campo)
        ) {
          setMostrarDatosIA(true);
          setEditarManualmente(true);
        }

        return `Completá el campo ${nombre}.`;
      }
    }

    const precio = Number(datos.precio);
    const stock = Number(datos.stock);

    if (
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      return 'Ingresá un precio válido.';
    }

    if (
      !Number.isInteger(stock) ||
      stock < 1
    ) {
      return 'Ingresá un stock válido.';
    }

    return null;
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (ocupado || pantalla === 'seleccion') {
      return;
    }

    setError('');

    if (
      pantalla === 'manual' &&
      fotosManuales.length === 0
    ) {
      setError(
        'Subí al menos una foto de la prenda.'
      );
      return;
    }

    if (pantalla === 'ia' && !analizado) {
      setError(
        'Primero analizá las fotos con IA.'
      );
      return;
    }

    const errorDatos = validarDatos();

    if (errorDatos) {
      setError(errorDatos);
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setError(
        'Tenés que iniciar sesión para publicar.'
      );
      return;
    }

    setPublicando(true);

    try {
      const resPerfil = await fetch(
        `${API_URL}/mi_perfil`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resPerfil.status === 401) {
        throw new Error(
          'Tu sesión fue rechazada. Volvé a iniciar sesión.'
        );
      }

      if (!resPerfil.ok) {
        throw new Error(
          'No se pudo obtener tu usuario.'
        );
      }

      const usuario = await resPerfil.json();

      if (!usuario.id) {
        throw new Error(
          'No se encontró el ID del usuario.'
        );
      }

      let imagenes: string[] = [];

      if (pantalla === 'manual') {
        imagenes = await Promise.all(
          fotosManuales.map((foto) =>
            subirImagen(foto)
          )
        );
      } else {
        let urlPrincipal = '';

        const guardadas =
          fotosSubidasRef.current;

        if (
          guardadas &&
          guardadas.archivoPrincipal === fotoPrendaIA
        ) {
          urlPrincipal = guardadas.principal;
        } else if (fotoPrendaIA) {
          urlPrincipal = await subirImagen(
            fotoPrendaIA
          );
        }

        if (!urlPrincipal) {
          throw new Error(
            'No se pudo obtener la imagen principal.'
          );
        }

        imagenes = [urlPrincipal];
      }

      if (imagenes.length === 0) {
        throw new Error(
          'No se pudo obtener ninguna imagen para la publicación.'
        );
      }

      await createPost(
        {
          titulo: datos.titulo.trim(),
          descripcion: datos.descripcion.trim(),
          precio: Number(datos.precio),
          imagenes,
          tipoPrenda: datos.tipoPrenda.trim(),
          marca: datos.marca.trim(),
          color: datos.color.trim(),
          talle: datos.talle.trim(),
          estado: datos.estado,
          genero: datos.genero,
          stock: Number(datos.stock),
          aliasTransferencia:
            datos.aliasTransferencia.trim(),
        },
        Number(usuario.id)
      );

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo crear la publicación.'
      );
    } finally {
      setPublicando(false);
    }
  }

  function input(
    campo: keyof DatosPrenda,
    placeholder: string,
    tipo = 'text',
    bloqueado = false
  ) {
    return (
      <input
        name={campo}
        type={tipo}
        placeholder={placeholder}
        aria-label={placeholder}
        value={datos[campo]}
        onChange={(e) =>
          actualizarDato(campo, e.target.value)
        }
        readOnly={bloqueado}
        disabled={ocupado}
        min={
          tipo === 'number'
            ? campo === 'stock'
              ? '1'
              : '0.01'
            : undefined
        }
        step={
          tipo === 'number'
            ? campo === 'stock'
              ? '1'
              : '0.01'
            : undefined
        }
        className={
          inputClass +
          (bloqueado
            ? ' bg-[#13233A] text-[#B5C6DD] cursor-default focus:border-[#294768]'
            : '')
        }
      />
    );
  }

  function camposIA() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#91A5BF]">
              {analizado
                ? 'Datos del último análisis'
                : 'Pendientes de analizar'}
            </p>

            {analizado && (
              <p className="text-xs text-[#93C5FD] mt-1">
                {editarManualmente
                  ? 'Edición habilitada'
                  : 'Campos bloqueados'}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setEditarManualmente(
                !editarManualmente
              )
            }
            disabled={ocupado}
            className="text-sm text-[#93C5FD] hover:text-white cursor-pointer disabled:opacity-50"
          >
            {editarManualmente
              ? 'Terminar edición'
              : 'Editar manualmente'}
          </button>
        </div>

        <div>
          <label className={labelClass}>
            Tipo de prenda *
          </label>

          {input(
            'tipoPrenda',
            'Tipo de prenda',
            'text',
            camposIABloqueados
          )}
        </div>

        <div>
          <label className={labelClass}>
            Marca *
          </label>

          {input(
            'marca',
            'Marca',
            'text',
            camposIABloqueados
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              Color *
            </label>

            {input(
              'color',
              'Color',
              'text',
              camposIABloqueados
            )}
          </div>

          <div>
            <label className={labelClass}>
              Talle *
            </label>

            {input(
              'talle',
              'Talle',
              'text',
              camposIABloqueados
            )}
          </div>
        </div>

        {resultadoIA?.subcategoria && (
          <div className="bg-[#102039] border border-[#294768] rounded-lg p-3">
            <p className="text-xs text-[#91A5BF]">
              Subcategoría detectada
            </p>

            <p className="text-sm text-white mt-1">
              {resultadoIA.subcategoria}
            </p>
          </div>
        )}

        {resultadoIA?.detalles && (
          <div className="bg-[#102039] border border-[#294768] rounded-lg p-3">
            <p className="text-xs text-[#91A5BF]">
              Detalles detectados
            </p>

            <p className="text-sm text-white mt-2 whitespace-pre-wrap">
              {resultadoIA.detalles}
            </p>

            <button
              type="button"
              onClick={() =>
                actualizarDato(
                  'descripcion',
                  resultadoIA.detalles ?? ''
                )
              }
              disabled={ocupado}
              className="text-xs text-[#93C5FD] hover:text-white mt-3 cursor-pointer disabled:opacity-50"
            >
              Usar como descripción
            </button>
          </div>
        )}
      </div>
    );
  }

  function camposManuales(
    soloPendientesIA = false
  ) {
    return (
      <div className="flex flex-col gap-4">
        {soloPendientesIA && (
          <div className="border-t border-[#294768] pt-5">
            <h3 className="text-base font-semibold text-white">
              Datos de la publicación
            </h3>

            <p className="text-xs text-[#91A5BF] mt-2">
              Completá estos datos manualmente.
            </p>
          </div>
        )}

        <div>
          <label className={labelClass}>
            Título *
          </label>

          {input('titulo', 'Título')}
        </div>

        <div>
          <label className={labelClass}>
            Descripción *
          </label>

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={datos.descripcion}
            onChange={(e) =>
              actualizarDato(
                'descripcion',
                e.target.value
              )
            }
            disabled={ocupado}
            rows={3}
            className={textareaClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Precio *
          </label>

          {input('precio', 'Precio', 'number')}
        </div>

        {!soloPendientesIA && (
          <>
            <div>
              <label className={labelClass}>
                Tipo de prenda *
              </label>

              {input(
                'tipoPrenda',
                'Tipo de prenda'
              )}
            </div>

            <div>
              <label className={labelClass}>
                Marca *
              </label>

              {input('marca', 'Marca')}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Color *
                </label>
                {input('color', 'Color')}
              </div>

              <div>
                <label className={labelClass}>
                  Talle *
                </label>
                {input('talle', 'Talle')}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              Estado *
            </label>

            <select
              name="estado"
              value={datos.estado}
              onChange={(e) =>
                actualizarDato(
                  'estado',
                  e.target.value
                )
              }
              disabled={ocupado}
              className={inputClass}
            >
              <option value="" disabled>
                Seleccionar
              </option>
              <option value="Nuevo">
                Nuevo
              </option>
              <option value="Usado">
                Usado
              </option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Género *
            </label>

            <select
              name="genero"
              value={datos.genero}
              onChange={(e) =>
                actualizarDato(
                  'genero',
                  e.target.value
                )
              }
              disabled={ocupado}
              className={inputClass}
            >
              <option value="" disabled>
                Seleccionar
              </option>
              <option value="Hombre">
                Hombre
              </option>
              <option value="Mujer">
                Mujer
              </option>
              <option value="Unisex">
                Unisex
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Stock *
          </label>

          {input('stock', 'Stock', 'number')}
        </div>

        <div className="border-t border-[#294768] pt-5 mt-2">
          <h3 className="text-base font-semibold text-white">
            Datos para recibir pagos
          </h3>

          <p className="text-xs text-[#91A5BF] mt-2 mb-4 leading-relaxed">
            Ingresá el alias de la cuenta donde
            querés recibir las transferencias.
            El comprador podrá verlo cuando
            el vendedor acepte su solicitud.
          </p>

          <label className={labelClass}>
            Alias de transferencia *
          </label>

          {input(
            'aliasTransferencia',
            'Ej: mi.alias.mp'
          )}

          <p className="text-xs text-[#91A5BF] mt-2">
            Revisá que el alias esté bien escrito.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crear publicación"
        className={
          'relative w-full bg-[#0E1D32] border border-[#294768] rounded-2xl overflow-hidden shadow-2xl ' +
          (pantalla === 'seleccion'
            ? 'max-w-2xl'
            : 'max-w-5xl max-h-[90dvh]')
        }
      >
        <button
          type="button"
          onClick={onClose}
          disabled={ocupado}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-[#172A45] hover:bg-[#294768] text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {pantalla === 'seleccion' && (
          <div className="p-6 sm:p-9 flex flex-col gap-5 max-h-[90dvh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white pr-10">
              ¿Cómo querés publicar tu prenda?
            </h2>

            <button
              type="button"
              onClick={() =>
                cambiarPantalla('ia')
              }
              className="w-full text-left bg-[#152B49] border border-[#3A5C84] rounded-xl p-6 hover:bg-[#1B3658] transition-colors cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-white">
                Escaneo automático con IA
              </h3>

              <p className="text-sm text-[#A9BAD0] mt-3">
                Subí una foto de la prenda y otra
                de su etiqueta para identificar
                tipo, marca, color y talle.
              </p>

              <div className="mt-5 bg-[#2563EB] rounded-lg py-3 text-center font-medium text-white">
                Continuar con IA
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                cambiarPantalla('manual')
              }
              className="w-full text-left bg-[#102039] border border-[#294768] rounded-xl p-6 hover:bg-[#192D48] transition-colors cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-white">
                Crear mi publicación manualmente
              </h3>

              <p className="text-sm text-[#A9BAD0] mt-3">
                Subí las fotos y completá vos
                mismo los datos de la publicación.
              </p>

              <div className="mt-5 bg-[#1A3455] border border-[#42648D] rounded-lg py-3 text-center font-medium text-white">
                Continuar manualmente
              </div>
            </button>
          </div>
        )}

        {pantalla !== 'seleccion' && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col md:flex-row max-h-[90dvh] overflow-y-auto md:overflow-hidden"
          >
            <div className="w-full md:w-1/2 md:shrink-0 bg-[#102039] border-b md:border-b-0 md:border-r border-[#294768] flex flex-col p-5 gap-4 md:max-h-[90dvh] md:overflow-y-auto">
              <button
                type="button"
                onClick={() =>
                  cambiarPantalla('seleccion')
                }
                disabled={ocupado}
                className="self-start flex items-center gap-2 text-sm text-[#A9C4E9] hover:text-white cursor-pointer disabled:opacity-50"
              >
                ← Volver
              </button>

              {pantalla === 'manual' ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      Fotos de la prenda
                    </h3>

                    <span className="text-xs text-[#91A5BF]">
                      {fotosManuales.length}/
                      {MAX_FOTOS_MANUALES} fotos
                    </span>
                  </div>

                  <input
                    id="fotos-manuales"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      seleccionarFotosManuales
                    }
                    disabled={ocupado}
                    className="hidden"
                  />

                  {previewsManuales.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <div className="relative w-full aspect-[4/5] bg-[#152943] rounded-xl overflow-hidden border border-[#294768]">
                        <img
                          src={previewsManuales[0]}
                          alt="Foto principal"
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute left-3 top-3 bg-[#0B192D]/90 text-white text-xs px-3 py-1 rounded-full border border-[#294768]">
                          Foto principal
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            eliminarFotoManual(0)
                          }
                          disabled={ocupado}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
                          aria-label="Eliminar foto principal"
                        >
                          ✕
                        </button>
                      </div>

                      {previewsManuales.length > 1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {previewsManuales
                            .slice(1)
                            .map((url, index) => (
                              <div
                                key={url}
                                className="relative aspect-square bg-[#152943] rounded-lg overflow-hidden border border-[#294768]"
                              >
                                <img
                                  src={url}
                                  alt={`Foto ${index + 2}`}
                                  className="w-full h-full object-cover"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    eliminarFotoManual(
                                      index + 1
                                    )
                                  }
                                  disabled={ocupado}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white text-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
                                  aria-label={`Eliminar foto ${index + 2}`}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                        </div>
                      )}

                      {fotosManuales.length <
                        MAX_FOTOS_MANUALES && (
                        <label
                          htmlFor="fotos-manuales"
                          className="w-full bg-[#152943] border border-dashed border-[#45617F] rounded-lg py-3 px-4 text-center text-[#B7C7DD] hover:border-blue-400 cursor-pointer"
                        >
                          Agregar más fotos
                        </label>
                      )}

                      <p className="text-xs text-[#91A5BF] leading-relaxed">
                        La primera imagen será la
                        portada de la publicación.
                      </p>
                    </div>
                  ) : (
                    <label
                      htmlFor="fotos-manuales"
                      className="min-h-56 md:min-h-80 bg-[#152943] rounded-lg border border-dashed border-[#45617F] cursor-pointer flex flex-col items-center justify-center text-center p-5 hover:border-blue-400"
                    >
                      <p className="text-[#B7C7DD]">
                        Subir fotos de la prenda
                      </p>

                      <p className="text-xs text-[#91A5BF] mt-2">
                        Podés subir hasta{' '}
                        {MAX_FOTOS_MANUALES} fotos
                      </p>
                    </label>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white">
                    Escaneo automático con IA
                  </h3>

                  <p className="text-sm text-[#A9BAD0]">
                    Subí una foto de la prenda completa
                    y otra de su etiqueta.
                  </p>

                  <div>
                    <p className="text-sm text-[#C0CDE0] mb-2">
                      1. Foto de la prenda *
                    </p>

                    <label className="h-44 bg-[#152943] border border-dashed border-[#45617F] rounded-lg flex items-center justify-center cursor-pointer overflow-hidden">
                      {previewPrendaIA ? (
                        <img
                          src={previewPrendaIA}
                          alt="Foto de la prenda"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <p className="text-[#A9BAD0]">
                          Subir foto de la prenda
                        </p>
                      )}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={
                          seleccionarFotoPrendaIA
                        }
                        disabled={ocupado}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="text-sm text-[#C0CDE0] mb-2">
                      2. Foto de la etiqueta *
                    </p>

                    <label className="h-40 bg-[#152943] border border-dashed border-[#45617F] rounded-lg flex items-center justify-center cursor-pointer overflow-hidden">
                      {previewEtiquetaIA ? (
                        <img
                          src={previewEtiquetaIA}
                          alt="Foto de la etiqueta"
                          className="w-full h-full object-contain bg-[#0B192D]"
                        />
                      ) : (
                        <p className="text-[#A9BAD0]">
                          Subir foto de la etiqueta
                        </p>
                      )}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={
                          seleccionarFotoEtiquetaIA
                        }
                        disabled={ocupado}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={analizarConIA}
                    disabled={
                      ocupado ||
                      !fotoPrendaIA ||
                      !fotoEtiquetaIA
                    }
                    className="mt-auto w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3 font-medium cursor-pointer disabled:opacity-50"
                  >
                    {analizando
                      ? 'Analizando imágenes...'
                      : analizado
                        ? 'Volver a analizar'
                        : 'Analizar fotos con IA'}
                  </button>

                  {mensajeIA && (
                    <p
                      role="status"
                      className="text-sm text-[#B2C8E5]"
                    >
                      {mensajeIA}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="w-full md:w-1/2 min-w-0 p-5 sm:p-6 flex flex-col gap-4 md:max-h-[90dvh] md:overflow-y-auto">
              <h2 className="font-display font-bold text-xl text-white mb-2 pr-10">
                Publicar prenda
              </h2>

              {pantalla === 'ia' ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setMostrarDatosIA(
                        !mostrarDatosIA
                      )
                    }
                    aria-expanded={mostrarDatosIA}
                    className="w-full flex items-center justify-between text-left bg-[#152943] border border-[#294768] rounded-lg px-4 py-4 text-white font-medium cursor-pointer hover:bg-[#1B3454]"
                  >
                    <span>
                      Mostrar datos autocompletados
                    </span>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-5 h-5 transition-transform ${
                        mostrarDatosIA
                          ? 'rotate-180'
                          : ''
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {mostrarDatosIA && (
                    <div className="bg-[#102039] border border-[#294768] rounded-lg p-4">
                      {camposIA()}
                    </div>
                  )}

                  {camposManuales(true)}
                </>
              ) : (
                camposManuales(false)
              )}

              {error && (
                <p
                  role="alert"
                  className="text-sm text-red-400 leading-relaxed"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  ocupado ||
                  (pantalla === 'ia' && !analizado)
                }
                className="mt-2 w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publicando
                  ? 'Publicando...'
                  : 'Publicar'}
              </button>

              {pantalla === 'ia' && !analizado && (
                <p className="text-xs text-center text-[#91A5BF]">
                  Primero analizá las fotografías
                  con IA.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
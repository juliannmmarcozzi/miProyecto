
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { createPost } from '../api/prendas';
import { subirImagen } from '../../../lib/subirImagen';

const API_URL = import.meta.env.VITE_API_URL;

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
  stock: '',
};

const inputClass =
  'block w-full min-w-0 h-11 bg-[#0B192D] border border-[#294768] rounded-lg px-3.5 text-sm text-[#E7ECF5] placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5] disabled:opacity-60 disabled:cursor-not-allowed';

const textareaClass =
  'block w-full min-w-0 min-h-24 bg-[#0B192D] border border-[#294768] rounded-lg px-3.5 py-3 text-sm text-[#E7ECF5] placeholder:text-[#91A5BF] outline-none focus:border-[#4B83D5] resize-y disabled:opacity-60 disabled:cursor-not-allowed';

function validarImagen(archivo: File) {
  const tiposPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!tiposPermitidos.includes(archivo.type)) {
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

export default function CreatePostModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  // PANTALLA INICIAL
  const [pantalla, setPantalla] = useState<Pantalla>(
    'seleccion'
  );

  // MODO MANUAL
  const [fotosManuales, setFotosManuales] = useState<File[]>(
    []
  );
  const [previewsManuales, setPreviewsManuales] = useState<
    string[]
  >([]);

  // MODO IA
  const [fotoPrendaIA, setFotoPrendaIA] = useState<
    File | null
  >(null);

  const [fotoEtiquetaIA, setFotoEtiquetaIA] = useState<
    File | null
  >(null);

  const [previewPrendaIA, setPreviewPrendaIA] = useState<
    string | null
  >(null);

  const [previewEtiquetaIA, setPreviewEtiquetaIA] = useState<
    string | null
  >(null);

  // DATOS DE LA PUBLICACIÓN
  const [datos, setDatos] = useState<DatosPrenda>({
    ...datosIniciales,
  });

  // PANEL DE IA
  const [mostrarDatosIA, setMostrarDatosIA] = useState(false);
  const [editarManualmente, setEditarManualmente] =
    useState(false);

  // ESTADOS GENERALES
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensajeIA, setMensajeIA] = useState('');

  // PREVIEWS DEL MODO MANUAL
  useEffect(() => {
    const urls = fotosManuales.map((foto) =>
      URL.createObjectURL(foto)
    );

    setPreviewsManuales(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fotosManuales]);

  // PREVIEW DE LA FOTO GENERAL DE IA
  useEffect(() => {
    if (!fotoPrendaIA) {
      setPreviewPrendaIA(null);
      return;
    }

    const url = URL.createObjectURL(fotoPrendaIA);

    setPreviewPrendaIA(url);

    return () => URL.revokeObjectURL(url);
  }, [fotoPrendaIA]);

  // PREVIEW DE LA ETIQUETA
  useEffect(() => {
    if (!fotoEtiquetaIA) {
      setPreviewEtiquetaIA(null);
      return;
    }

    const url = URL.createObjectURL(fotoEtiquetaIA);

    setPreviewEtiquetaIA(url);

    return () => URL.revokeObjectURL(url);
  }, [fotoEtiquetaIA]);

  // NAVEGACIÓN ENTRE PANTALLAS
  function cambiarPantalla(nuevaPantalla: Pantalla) {
    if (cargando) return;

    setPantalla(nuevaPantalla);
    setError('');
    setMensajeIA('');
  }

  // ACTUALIZAR DATOS DEL FORMULARIO
  function actualizarDato(
    campo: keyof DatosPrenda,
    valor: string
  ) {
    setDatos((anteriores) => ({
      ...anteriores,
      [campo]: valor,
    }));
  }

  // SELECCIONAR FOTOS MANUALMENTE
  function seleccionarFotosManuales(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const archivos = Array.from(e.target.files ?? []);

    if (archivos.length === 0) return;

    try {
      archivos.forEach(validarImagen);

      setFotosManuales(archivos);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron seleccionar las fotos.'
      );
    }
  }

  // FOTO GENERAL PARA IA
  function seleccionarFotoPrendaIA(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    try {
      validarImagen(archivo);

      setFotoPrendaIA(archivo);
      setError('');
      setMensajeIA('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo seleccionar la imagen.'
      );
    }
  }

  // FOTO DE ETIQUETA PARA IA
  function seleccionarEtiquetaIA(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    try {
      validarImagen(archivo);

      setFotoEtiquetaIA(archivo);
      setError('');
      setMensajeIA('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo seleccionar la etiqueta.'
      );
    }
  }

  // ANALIZAR FOTOS CON IA
  function analizarConIA() {
    setError('');
    setMensajeIA('');

    if (!fotoPrendaIA || !fotoEtiquetaIA) {
      setError(
        'Primero tenés que subir una foto de la prenda y otra de su etiqueta.'
      );
      return;
    }

    // PENDIENTE: CONECTAR ENDPOINT REAL DE IA
    setMostrarDatosIA(true);

    setMensajeIA(
      'Las imágenes están listas. Falta conectar el servicio de IA para completar los datos.'
    );
  }

  // PUBLICAR MANUALMENTE
  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (cargando || pantalla !== 'manual') return;

    if (fotosManuales.length === 0) {
      setError('Subí al menos una foto de tu prenda.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setError('Tenés que iniciar sesión para publicar.');
      return;
    }

    setCargando(true);
    setError('');

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
          'Tu sesión venció. Volvé a iniciar sesión.'
        );
      }

      if (!resPerfil.ok) {
        throw new Error(
          'No se pudo obtener el usuario.'
        );
      }

      const usuario = await resPerfil.json();

      if (!usuario.id) {
        throw new Error(
          'No se encontró el ID del usuario.'
        );
      }

      // Por ahora el backend guarda una sola foto.
      const urlPrincipal = await subirImagen(
        fotosManuales[0]
      );

      await createPost(
        {
          titulo: datos.titulo.trim(),
          descripcion: datos.descripcion.trim(),
          precio: Number(datos.precio),
          imagenes: [urlPrincipal],
          tipoPrenda: datos.tipoPrenda.trim(),
          marca: datos.marca.trim(),
          color: datos.color.trim(),
          talle: datos.talle.trim(),
          estado: datos.estado,
          genero: datos.genero,
          stock: Number(datos.stock),
        },
        usuario.id
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
      setCargando(false);
    }
  }

  // CAMPOS DEL FORMULARIO
  const camposBloqueados =
    pantalla === 'ia' && !editarManualmente;

  function renderCampos() {
    return (
      <div className="flex flex-col gap-3">

        <input
          name="titulo"
          placeholder="Título"
          value={datos.titulo}
          onChange={(e) =>
            actualizarDato('titulo', e.target.value)
          }
          readOnly={camposBloqueados}
          disabled={cargando}
          required={!camposBloqueados}
          className={inputClass}
        />

        <textarea
          name="descripcion"
          placeholder="Descripción"
          value={datos.descripcion}
          onChange={(e) =>
            actualizarDato('descripcion', e.target.value)
          }
          readOnly={camposBloqueados}
          disabled={cargando}
          required={!camposBloqueados}
          rows={3}
          className={textareaClass}
        />

        <input
          name="precio"
          type="number"
          min="1"
          placeholder="Precio"
          value={datos.precio}
          onChange={(e) =>
            actualizarDato('precio', e.target.value)
          }
          readOnly={camposBloqueados}
          disabled={cargando}
          required={!camposBloqueados}
          className={inputClass}
        />

        <input
          name="tipoPrenda"
          placeholder="Tipo de prenda"
          value={datos.tipoPrenda}
          onChange={(e) =>
            actualizarDato('tipoPrenda', e.target.value)
          }
          readOnly={camposBloqueados}
          disabled={cargando}
          required={!camposBloqueados}
          className={inputClass}
        />

        <input
          name="marca"
          placeholder="Marca"
          value={datos.marca}
          onChange={(e) =>
            actualizarDato('marca', e.target.value)
          }
          readOnly={camposBloqueados}
          disabled={cargando}
          required={!camposBloqueados}
          className={inputClass}
        />

        <div className="grid grid-cols-[minmax(0,65fr)_minmax(0,35fr)] gap-2">

          <input
            name="color"
            placeholder="Color"
            value={datos.color}
            onChange={(e) =>
              actualizarDato('color', e.target.value)
            }
            readOnly={camposBloqueados}
            disabled={cargando}
            required={!camposBloqueados}
            className={inputClass}
          />

          <input
            name="talle"
            placeholder="Talle"
            value={datos.talle}
            onChange={(e) =>
              actualizarDato('talle', e.target.value)
            }
            readOnly={camposBloqueados}
            disabled={cargando}
            required={!camposBloqueados}
            className={inputClass}
          />

        </div>

        <select
          name="estado"
          value={datos.estado}
          onChange={(e) =>
            actualizarDato('estado', e.target.value)
          }
          disabled={cargando || camposBloqueados}
          required={!camposBloqueados}
          className={inputClass}
        >
          <option value="" disabled>Estado</option>
          <option value="Nuevo">Nuevo</option>
          <option value="Usado">Usado</option>
        </select>

        <select
          name="genero"
          value={datos.genero}
          onChange={(e) =>
            actualizarDato('genero', e.target.value)
          }
          disabled={cargando || camposBloqueados}
          required={!camposBloqueados}
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
          value={datos.stock}
          onChange={(e) =>
            actualizarDato('stock', e.target.value)
          }
          readOnly={camposBloqueados}
          disabled={cargando}
          required={!camposBloqueados}
          className={inputClass}
        />

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
            : 'max-w-4xl max-h-[90dvh]')
        }
      >

        {/* BOTÓN CERRAR */}
        <button
          type="button"
          onClick={onClose}
          disabled={cargando}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-[#172A45] hover:bg-[#294768] text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* ================================== */}
        {/* PANTALLA INICIAL: ELEGIR MODO       */}
        {/* ================================== */}

        {pantalla === 'seleccion' && (

          <div className="p-6 sm:p-9 flex flex-col gap-5 max-h-[90dvh] overflow-y-auto">

            <div className="mb-2 pr-10">

              <h2 className="text-2xl font-bold text-white">
                ¿Cómo querés publicar tu prenda?
              </h2>

              <p className="text-sm text-[#A9BAD0] mt-2">
                Elegí la forma que prefieras para crear tu publicación.
              </p>

            </div>

            {/* OPCIÓN IA */}
            <button
              type="button"
              onClick={() => cambiarPantalla('ia')}
              className="w-full text-left bg-[#152B49] border border-[#3A5C84] rounded-xl p-6 hover:bg-[#1B3658] hover:border-[#6196DC] transition-colors cursor-pointer"
            >

              <div className="flex items-start gap-4">

                <div className="w-14 h-14 shrink-0 rounded-xl bg-[#24466F] flex items-center justify-center">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-[#A8CAFF]"
                  >
                    <path d="M4 9V5a1 1 0 0 1 1-1h4" />
                    <path d="M15 4h4a1 1 0 0 1 1 1v4" />
                    <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
                    <path d="M9 20H5a1 1 0 0 1-1-1v-4" />
                    <path d="M7 12h10" />
                    <path d="M12 7v10" />
                  </svg>

                </div>

                <div className="flex-1 min-w-0">

                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Escaneo automático con IA
                  </h3>

                  <p className="mt-2 text-sm text-[#B0C2DA] leading-relaxed">
                    Subí una foto de tu prenda y otra de la etiqueta.
                    La inteligencia artificial analizará las imágenes
                    para completar los datos automáticamente.
                  </p>

                  <div className="mt-5 bg-[#2563EB] rounded-lg py-3 px-4 text-center text-white font-medium">
                    Continuar con IA
                  </div>

                </div>

              </div>

            </button>

            {/* OPCIÓN MANUAL */}
            <button
              type="button"
              onClick={() => cambiarPantalla('manual')}
              className="w-full text-left bg-[#102039] border border-[#294768] rounded-xl p-6 hover:bg-[#192D48] hover:border-[#5479A8] transition-colors cursor-pointer"
            >

              <div className="flex items-start gap-4">

                <div className="w-14 h-14 shrink-0 rounded-xl bg-[#1C3452] flex items-center justify-center">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-[#B0C2DA]"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
                  </svg>

                </div>

                <div className="flex-1 min-w-0">

                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Crear mi publicación manualmente
                  </h3>

                  <p className="mt-2 text-sm text-[#B0C2DA] leading-relaxed">
                    Subí una o más fotos de tu prenda y completá
                    vos mismo los datos de la publicación.
                  </p>

                  <div className="mt-5 border border-[#42648D] bg-[#1A3455] rounded-lg py-3 px-4 text-center text-white font-medium">
                    Continuar manualmente
                  </div>

                </div>

              </div>

            </button>

          </div>

        )}

        {/* ================================== */}
        {/* FORMULARIO MANUAL O IA             */}
        {/* ================================== */}

        {pantalla !== 'seleccion' && (

          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row max-h-[90dvh] overflow-y-auto md:overflow-hidden"
          >

            {/* COLUMNA IZQUIERDA */}
            <div className="w-full md:w-1/2 md:shrink-0 bg-[#102039] border-b md:border-b-0 md:border-r border-[#294768] flex flex-col p-5 gap-4 md:max-h-[90dvh] md:overflow-y-auto">

              {/* VOLVER A SELECCIÓN */}
              <button
                type="button"
                onClick={() => cambiarPantalla('seleccion')}
                disabled={cargando}
                className="self-start flex items-center gap-2 text-sm text-[#A9C4E9] hover:text-white cursor-pointer disabled:opacity-50"
              >
                <span aria-hidden="true">←</span>
                Volver
              </button>

              {pantalla === 'manual' ? (

                <>
                  {/* FOTO MANUAL */}
                  <div className="flex-1 flex flex-col min-h-0">

                    <label className="flex-1 min-h-56 md:min-h-80 bg-[#152943] rounded-lg border border-dashed border-[#45617F] cursor-pointer flex flex-col items-center justify-center text-center p-5 hover:border-blue-400 transition-colors">

                      {previewsManuales.length > 0 ? (

                        <div className="w-full flex flex-col gap-3">

                          <div className="grid grid-cols-2 gap-2">

                            {previewsManuales.map((url, index) => (

                              <img
                                key={url}
                                src={url}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-32 object-contain bg-[#0B192D] rounded"
                              />

                            ))}

                          </div>

                          <span className="text-sm text-[#A9BAD0]">
                            {fotosManuales.length} foto(s) seleccionada(s).
                            Tocá para cambiar.
                          </span>

                        </div>

                      ) : (

                        <div className="flex flex-col items-center gap-4">

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-12 h-12 text-[#91A5BF]"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>

                          <span className="text-[#B7C7DD] text-base">
                            Hacé clic aquí para subir una o más fotos de tu prenda
                          </span>

                        </div>

                      )}

                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={seleccionarFotosManuales}
                        disabled={cargando}
                        className="hidden"
                      />

                    </label>

                    {fotosManuales.length > 1 && (
                      <p className="mt-3 text-xs text-[#9AAEC8]">
                        Por ahora solo se guardará la primera foto.
                        Las fotos adicionales se habilitarán cuando
                        el backend permita guardar varias imágenes.
                      </p>
                    )}

                  </div>
                </>

              ) : (

                <>
                  {/* MODO IA */}
                  <h3 className="text-lg font-semibold text-white">
                    Escaneo automático con IA
                  </h3>

                  <p className="text-sm text-[#A9BAD0]">
                    Subí una foto de la prenda completa y otra de su etiqueta.
                  </p>

                  {/* FOTO GENERAL */}
                  <div className="flex flex-col gap-2">

                    <span className="text-sm text-[#C0CDE0]">
                      1. Foto de la prenda *
                    </span>

                    <label className="h-44 bg-[#152943] border border-dashed border-[#45617F] rounded-lg flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400">

                      {previewPrendaIA ? (

                        <img
                          src={previewPrendaIA}
                          alt="Foto de la prenda"
                          className="w-full h-full object-contain"
                        />

                      ) : (

                        <div className="text-center p-4">

                          <p className="text-[#B7C7DD]">
                            Subir foto de la prenda
                          </p>

                          <p className="text-[#91A5BF] text-xs mt-2">
                            Vista completa desde arriba
                          </p>

                        </div>

                      )}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={seleccionarFotoPrendaIA}
                        disabled={cargando}
                        className="hidden"
                      />

                    </label>

                  </div>

                  {/* FOTO DE ETIQUETA */}
                  <div className="flex flex-col gap-2">

                    <span className="text-sm text-[#C0CDE0]">
                      2. Foto de la etiqueta *
                    </span>

                    <label className="h-40 bg-[#152943] border border-dashed border-[#45617F] rounded-lg flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400">

                      {previewEtiquetaIA ? (

                        <img
                          src={previewEtiquetaIA}
                          alt="Foto de la etiqueta"
                          className="w-full h-full object-contain"
                        />

                      ) : (

                        <div className="text-center p-4">

                          <p className="text-[#B7C7DD]">
                            Subir foto de la etiqueta
                          </p>

                          <p className="text-[#91A5BF] text-xs mt-2">
                            Que se vean marca y talle
                          </p>

                        </div>

                      )}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={seleccionarEtiquetaIA}
                        disabled={cargando}
                        className="hidden"
                      />

                    </label>

                  </div>

                  <button
                    type="button"
                    onClick={analizarConIA}
                    disabled={cargando}
                    className="mt-auto w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3 font-medium cursor-pointer disabled:opacity-50"
                  >
                    Analizar fotos con IA
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

            {/* COLUMNA DERECHA */}
            <div className="w-full md:w-1/2 min-w-0 p-5 sm:p-6 flex flex-col gap-3 md:max-h-[90dvh] md:overflow-y-auto">

              <h2 className="font-display font-bold text-xl text-white mb-2 pr-10">
                Publicar prenda
              </h2>

              {pantalla === 'manual' ? (

                <>
                  {/* FORMULARIO MANUAL */}
                  {renderCampos()}

                  {error && (
                    <p role="alert" className="text-red-400 text-sm">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={cargando}
                    className="mt-2 w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3 font-medium cursor-pointer disabled:opacity-50"
                  >
                    {cargando ? 'Publicando...' : 'Publicar'}
                  </button>

                </>

              ) : (

                <>
                  {/* PANEL DESPLEGABLE */}
                  <button
                    type="button"
                    onClick={() =>
                      setMostrarDatosIA(!mostrarDatosIA)
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
                      className={
                        'w-5 h-5 transition-transform ' +
                        (mostrarDatosIA ? 'rotate-180' : '')
                      }
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>

                  </button>

                  {mostrarDatosIA && (

                    <div className="flex flex-col gap-4">

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-sm text-[#A9BAD0]">
                          {editarManualmente
                            ? 'Edición manual habilitada'
                            : 'Datos pendientes del análisis'}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setEditarManualmente(!editarManualmente)
                          }
                          className="text-sm text-[#8CB8F7] hover:text-white cursor-pointer"
                        >
                          {editarManualmente
                            ? 'Bloquear campos'
                            : 'Editar manualmente'}
                        </button>

                      </div>

                      {renderCampos()}

                      <p className="text-xs text-[#91A5BF]">
                        Los campos se completarán automáticamente
                        cuando esté conectado el servicio de IA.
                      </p>

                    </div>

                  )}

                  {error && (
                    <p role="alert" className="text-red-400 text-sm">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled
                    className="mt-auto w-full bg-[#2563EB] text-white rounded-lg py-3 font-medium opacity-50 cursor-not-allowed"
                  >
                    Publicar
                  </button>

                  <p className="text-xs text-center text-[#91A5BF]">
                    La publicación por IA estará disponible
                    cuando se conecte el servicio de análisis.
                  </p>

                </>

              )}

            </div>

          </form>

        )}

      </div>

    </div>
  );
}

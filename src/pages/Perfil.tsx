
import Header from '../components/Header';
import HeaderActions from '../components/HeaderActions';
import { useNavigate } from 'react-router-dom';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { subirImagen } from '../lib/subirImagen';

const API_URL = import.meta.env.VITE_API_URL;

interface Usuario {
  id: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  email?: string;
  instagram: string | null;
  foto_perfil: string | null;
  numero_telefono: string;
}

interface RespuestaCambioContrasena {
  error?: string;
  mensaje?: string;
}

const inputClass =
  'w-full rounded-lg bg-[#0b1426] border border-[#304767] px-4 py-3 outline-none focus:border-blue-500 text-white';

const inputDeshabilitado =
  'w-full rounded-lg bg-[#0b1426]/70 border border-[#304767] px-4 py-3 text-slate-400 cursor-not-allowed';

export default function Perfil() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [instagram, setInstagram] = useState('');

  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] =
    useState<string | null>(null);

  // CAMBIO DE CONTRASEÑA
  const [mostrarCambioContrasena, setMostrarCambioContrasena] =
    useState(false);

  const [contrasenaActual, setContrasenaActual] =
    useState('');

  const [contrasenaNueva, setContrasenaNueva] =
    useState('');

  const [confirmarContrasena, setConfirmarContrasena] =
    useState('');

  const [mostrarContrasenas, setMostrarContrasenas] =
    useState(false);

  const [cambiandoContrasena, setCambiandoContrasena] =
    useState(false);

  const [errorContrasena, setErrorContrasena] =
    useState('');

  // CERRAR SESIÓN
  function cerrarSesion() {
    localStorage.removeItem('token');

    navigate('/login', {
      replace: true,
    });
  }

  // OBTENER PERFIL
  useEffect(() => {
    let activo = true;

    async function cargar() {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const respuesta = await fetch(
          `${API_URL}/mi_perfil`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (respuesta.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        if (!respuesta.ok) {
          throw new Error('No se pudo cargar el perfil');
        }

        const datos: Usuario = await respuesta.json();

        if (!activo) return;

        setUsuario(datos);
        setNombreUsuario(datos.nombre_usuario);
        setTelefono(datos.numero_telefono ?? '');
        setInstagram(datos.instagram ?? '');
      } catch (e) {
        if (activo) {
          setError(
            e instanceof Error
              ? e.message
              : 'Error de conexión con el servidor'
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [navigate]);

  // VISTA PREVIA DE LA FOTO
  useEffect(() => {
    if (!archivo) {
      setVistaPrevia(null);
      return;
    }

    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);

    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  // CERRAR POPUP CON ESCAPE
  useEffect(() => {
    if (!mostrarCambioContrasena || cambiandoContrasena) {
      return;
    }

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setMostrarCambioContrasena(false);
        setContrasenaActual('');
        setContrasenaNueva('');
        setConfirmarContrasena('');
        setErrorContrasena('');
        setMostrarContrasenas(false);
      }
    }

    window.addEventListener(
      'keydown',
      cerrarConEscape
    );

    return () => {
      window.removeEventListener(
        'keydown',
        cerrarConEscape
      );
    };
  }, [mostrarCambioContrasena, cambiandoContrasena]);

  // SELECCIONAR FOTO
  function seleccionarFoto(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const foto = evento.target.files?.[0];

    if (!foto) return;

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!tiposPermitidos.includes(foto.type)) {
      setError(
        'Solo se permiten imágenes JPG, PNG o WebP.'
      );
      return;
    }

    if (foto.size > 6 * 1024 * 1024) {
      setError('La imagen no puede superar los 6 MB.');
      return;
    }

    if (foto.size === 0) {
      setError('La imagen está vacía.');
      return;
    }

    setError('');
    setExito('');
    setArchivo(foto);
  }

  // CANCELAR CAMBIOS DEL PERFIL
  function cancelar() {
    if (!usuario) return;

    setNombreUsuario(usuario.nombre_usuario);
    setTelefono(usuario.numero_telefono ?? '');
    setInstagram(usuario.instagram ?? '');
    setArchivo(null);

    if (fileInput.current) {
      fileInput.current.value = '';
    }

    setError('');
    setExito('');
  }

  // GUARDAR CAMBIOS DEL PERFIL
  async function guardar(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!usuario || guardando) return;

    const token = localStorage.getItem('token');

    if (!token) {
      cerrarSesion();
      return;
    }

    if (!nombreUsuario.trim() || !telefono.trim()) {
      setError(
        'El nombre de usuario y el teléfono son obligatorios.'
      );
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');

    try {
      let fotoUrl = usuario.foto_perfil ?? '';

      if (archivo) {
        fotoUrl = await subirImagen(archivo);
      }

      const respuesta = await fetch(
        `${API_URL}/usuario/${usuario.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre_usuario: nombreUsuario.trim(),
            numero_telefono: telefono.trim(),
            instagram: instagram.trim(),
            ...(archivo
              ? { foto_perfil: fotoUrl }
              : {}),
          }),
        }
      );

      if (respuesta.status === 401) {
        cerrarSesion();
        return;
      }

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se pudo guardar el perfil'
        );
      }

      setUsuario({
        ...usuario,
        nombre_usuario:
          datos.nombre_usuario ?? nombreUsuario.trim(),
        numero_telefono:
          datos.numero_telefono ?? telefono.trim(),
        instagram:
          datos.instagram ?? instagram.trim(),
        foto_perfil:
          datos.foto_perfil ?? fotoUrl,
      });

      setArchivo(null);

      if (fileInput.current) {
        fileInput.current.value = '';
      }

      setExito('Cambios guardados correctamente.');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudieron guardar los cambios'
      );
    } finally {
      setGuardando(false);
    }
  }

  // ABRIR CAMBIO DE CONTRASEÑA
  function abrirCambioContrasena() {
    setContrasenaActual('');
    setContrasenaNueva('');
    setConfirmarContrasena('');
    setMostrarContrasenas(false);
    setErrorContrasena('');
    setExito('');

    setMostrarCambioContrasena(true);
  }

  // CERRAR CAMBIO DE CONTRASEÑA
  function cerrarCambioContrasena() {
    if (cambiandoContrasena) return;

    setMostrarCambioContrasena(false);
    setContrasenaActual('');
    setContrasenaNueva('');
    setConfirmarContrasena('');
    setMostrarContrasenas(false);
    setErrorContrasena('');
  }

  // ENVIAR NUEVA CONTRASEÑA AL BACKEND
  async function cambiarContrasena(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (cambiandoContrasena) return;

    setErrorContrasena('');

    if (
      !contrasenaActual ||
      !contrasenaNueva ||
      !confirmarContrasena
    ) {
      setErrorContrasena(
        'Completá todos los campos.'
      );
      return;
    }

    if (contrasenaNueva.length < 8) {
      setErrorContrasena(
        'La nueva contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    if (
      new TextEncoder().encode(contrasenaNueva).length > 72
    ) {
      setErrorContrasena(
        'La nueva contraseña es demasiado larga.'
      );
      return;
    }

    if (contrasenaActual === contrasenaNueva) {
      setErrorContrasena(
        'La nueva contraseña debe ser diferente de la actual.'
      );
      return;
    }

    if (contrasenaNueva !== confirmarContrasena) {
      setErrorContrasena(
        'Las contraseñas nuevas no coinciden.'
      );
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      cerrarSesion();
      return;
    }

    setCambiandoContrasena(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/cambiar_contrasena`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contrasena_actual: contrasenaActual,
            contrasena_nueva: contrasenaNueva,
          }),
        }
      );

      const datos: RespuestaCambioContrasena =
        await respuesta.json().catch(() => ({}));

      if (respuesta.status === 401) {
        cerrarSesion();
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            'No se pudo cambiar la contraseña.'
        );
      }

      setMostrarCambioContrasena(false);
      setContrasenaActual('');
      setContrasenaNueva('');
      setConfirmarContrasena('');
      setMostrarContrasenas(false);
      setErrorContrasena('');

      setError('');
      setExito('Contraseña actualizada correctamente.');
    } catch (e) {
      setErrorContrasena(
        e instanceof Error
          ? e.message
          : 'Error al actualizar la contraseña.'
      );
    } finally {
      setCambiandoContrasena(false);
    }
  }

  // FORMATEAR FECHA DE NACIMIENTO
  function formatearFecha(fecha: string | null) {
    if (!fecha) return 'No disponible';

    const soloFecha = fecha.slice(0, 10);
    const partes = soloFecha.split('-');

    if (partes.length !== 3) return soloFecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#ecf2ff] flex flex-col" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>
      {/* HEADER */}
      <Header
        actions={
          <HeaderActions
            onFilters={() => {}}
            onCreate={() => {}}
          />
        }
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <h1 className="text-[28px] font-semibold mb-9">
          Mi perfil
        </h1>

        {cargando ? (
          <p>Cargando perfil...</p>
        ) : !usuario ? (
          <p role="alert" className="text-red-300">
            {error || 'No se encontró el perfil.'}
          </p>
        ) : (
          <form
            onSubmit={guardar}
            className="rounded-2xl border border-[#294261] bg-[#142138] p-6 sm:p-10 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-8 md:gap-12">
              {/* COLUMNA IZQUIERDA */}
              <section className="flex flex-col items-center text-center md:border-r md:border-[#294261] md:pr-10">
                {/* FOTO DE PERFIL */}
                <div className="w-36 h-36 rounded-full overflow-hidden bg-[#263955] border border-[#3a506e] flex items-center justify-center">
                  {vistaPrevia || usuario.foto_perfil ? (
                    <img
                      src={
                        vistaPrevia ||
                        usuario.foto_perfil ||
                        ''
                      }
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-medium text-[#c5d1e1]">
                      {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>

                {/* INPUT DE FOTO */}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={seleccionarFoto}
                  className="hidden"
                />

                {/* CAMBIAR FOTO */}
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-5 w-40 py-2 rounded-lg border border-[#426087] bg-[#1b2d49] hover:bg-[#284065] text-sm font-medium cursor-pointer"
                >
                  Cambiar foto
                </button>

                <h2 className="font-semibold text-lg mt-7 break-all">
                  {usuario.nombre_usuario}
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                  {usuario.nombre} {usuario.apellido}
                </p>
              </section>

              {/* COLUMNA DERECHA */}
              <section className="min-w-0 flex flex-col">
                <h2 className="text-xl font-semibold mb-8">
                  Información de la cuenta
                </h2>

                <div className="space-y-5">
                  {/* NOMBRE DE USUARIO */}
                  <div>
                    <label
                      htmlFor="nombreUsuario"
                      className="block text-sm font-semibold mb-2"
                    >
                      Nombre de usuario
                    </label>

                    <input
                      id="nombreUsuario"
                      type="text"
                      value={nombreUsuario}
                      onChange={(e) =>
                        setNombreUsuario(e.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </div>

                  {/* NOMBRE */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Nombre
                    </label>

                    <input
                      type="text"
                      value={usuario.nombre}
                      readOnly
                      className={inputDeshabilitado}
                    />
                  </div>

                  {/* APELLIDO */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Apellido
                    </label>

                    <input
                      type="text"
                      value={usuario.apellido}
                      readOnly
                      className={inputDeshabilitado}
                    />
                  </div>

                  {/* FECHA DE NACIMIENTO */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Fecha de nacimiento
                    </label>

                    <input
                      type="text"
                      value={formatearFecha(
                        usuario.fecha_nacimiento
                      )}
                      readOnly
                      className={inputDeshabilitado}
                    />
                  </div>

                  {/* CORREO ELECTRÓNICO */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Correo electrónico
                    </label>

                    <input
                      type="text"
                      value={usuario.email || 'No disponible'}
                      readOnly
                      className={inputDeshabilitado}
                    />
                  </div>

                  {/* TELÉFONO */}
                  <div>
                    <label
                      htmlFor="telefono"
                      className="block text-sm font-semibold mb-2"
                    >
                      Número de teléfono
                    </label>

                    <input
                      id="telefono"
                      type="tel"
                      value={telefono}
                      onChange={(e) =>
                        setTelefono(e.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </div>

                  {/* INSTAGRAM */}
                  <div>
                    <label
                      htmlFor="instagram"
                      className="block text-sm font-semibold mb-2"
                    >
                      Instagram (opcional)
                    </label>

                    <input
                      id="instagram"
                      type="text"
                      value={instagram}
                      onChange={(e) =>
                        setInstagram(e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  {/* CONTRASEÑA */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Contraseña
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#0b1426]/70 border border-[#304767] px-4 py-3 text-sm">
                      <span className="text-[#D5E3F4] tracking-wider">
                        ••••••••••••
                      </span>

                      <button
                        type="button"
                        onClick={abrirCambioContrasena}
                        className="text-[#93C5FD] hover:text-white font-medium transition-colors cursor-pointer"
                      >
                        Cambiar contraseña
                      </button>
                    </div>
                  </div>
                </div>

                {/* ERROR DE PERFIL */}
                {error && (
                  <p
                    role="alert"
                    className="mt-5 text-red-300 text-sm"
                  >
                    {error}
                  </p>
                )}

                {/* ÉXITO */}
                {exito && (
                  <p
                    role="status"
                    className="mt-5 text-emerald-300 text-sm"
                  >
                    {exito}
                  </p>
                )}

                {/* BOTONES */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-10">
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="px-5 py-3 rounded-lg border border-red-400/30 text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Cerrar sesión
                  </button>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={cancelar}
                      disabled={guardando}
                      className="px-6 py-3 rounded-lg border border-[#426087] hover:bg-[#243650] disabled:opacity-50 cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={guardando}
                      className="px-7 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {guardando
                        ? 'Guardando...'
                        : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </form>
        )}
      </main>


      {/* POPUP CAMBIAR CONTRASEÑA */}
      {mostrarCambioContrasena && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarCambioContrasena();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-cambiar-contrasena"
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#36577A] bg-[#14243B] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div className="w-12 h-12 rounded-xl bg-[#213B5D] flex items-center justify-center text-[#93C5FD]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="11"
                    rx="2"
                  />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>

              <button
                type="button"
                onClick={cerrarCambioContrasena}
                disabled={cambiandoContrasena}
                aria-label="Cerrar"
                className="text-[#A9BAD0] hover:text-white text-xl cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pt-5 pb-6">
              <h2
                id="titulo-cambiar-contrasena"
                className="text-xl font-semibold text-white"
              >
                Cambiar contraseña
              </h2>

              <p className="text-sm text-[#A9BAD0] mt-2 leading-relaxed">
                Ingresá tu contraseña actual y elegí
                una nueva para proteger tu cuenta.
              </p>

              {/* FORMULARIO INDEPENDIENTE */}
              <form
                onSubmit={cambiarContrasena}
                className="mt-6 space-y-4"
              >
                {/* ACTUAL */}
                <div>
                  <label
                    htmlFor="contrasena-actual"
                    className="block text-sm font-medium text-[#D5E3F4] mb-2"
                  >
                    Contraseña actual
                  </label>

                  <input
                    id="contrasena-actual"
                    type={
                      mostrarContrasenas
                        ? 'text'
                        : 'password'
                    }
                    value={contrasenaActual}
                    onChange={(e) =>
                      setContrasenaActual(e.target.value)
                    }
                    autoComplete="current-password"
                    required
                    disabled={cambiandoContrasena}
                    className={inputClass}
                  />
                </div>

                {/* NUEVA */}
                <div>
                  <label
                    htmlFor="contrasena-nueva"
                    className="block text-sm font-medium text-[#D5E3F4] mb-2"
                  >
                    Nueva contraseña
                  </label>

                  <input
                    id="contrasena-nueva"
                    type={
                      mostrarContrasenas
                        ? 'text'
                        : 'password'
                    }
                    value={contrasenaNueva}
                    onChange={(e) =>
                      setContrasenaNueva(e.target.value)
                    }
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={cambiandoContrasena}
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs text-[#91A5BF]">
                    Debe tener al menos 8 caracteres.
                  </p>
                </div>

                {/* CONFIRMACIÓN */}
                <div>
                  <label
                    htmlFor="confirmar-contrasena"
                    className="block text-sm font-medium text-[#D5E3F4] mb-2"
                  >
                    Confirmar nueva contraseña
                  </label>

                  <input
                    id="confirmar-contrasena"
                    type={
                      mostrarContrasenas
                        ? 'text'
                        : 'password'
                    }
                    value={confirmarContrasena}
                    onChange={(e) =>
                      setConfirmarContrasena(e.target.value)
                    }
                    autoComplete="new-password"
                    required
                    disabled={cambiandoContrasena}
                    className={inputClass}
                  />
                </div>

                {/* MOSTRAR CONTRASEÑAS */}
                <label className="flex items-center gap-2 text-sm text-[#B9C9DC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarContrasenas}
                    onChange={(e) =>
                      setMostrarContrasenas(e.target.checked)
                    }
                    disabled={cambiandoContrasena}
                    className="w-4 h-4 accent-[#2563EB]"
                  />
                  Mostrar contraseñas
                </label>

                {/* ERROR */}
                {errorContrasena && (
                  <p
                    role="alert"
                    className="text-sm text-red-400 leading-relaxed"
                  >
                    {errorContrasena}
                  </p>
                )}

                {/* BOTONES */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={cerrarCambioContrasena}
                    disabled={cambiandoContrasena}
                    className="rounded-lg border border-[#36577A] bg-[#172A45] hover:bg-[#213B5D] py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={cambiandoContrasena}
                    className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                  >
                    {cambiandoContrasena
                      ? 'Guardando...'
                      : 'Confirmar cambio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

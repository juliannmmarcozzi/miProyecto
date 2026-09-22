import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { checkUsuarioDisponible, crearCuenta, USUARIO_MAX_LENGTH } from '../features/auth/api/usuarios';

export default function CrearCuenta() {
  // cambiar de pagina
  const navigate = useNavigate();

  const inputClass =
    'border border-umber/25 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay';

  // guarda datos usuario
  const [usuario, setUsuario] = useState('');
  const [usuarioDisponible, setUsuarioDisponible] = useState<boolean | null>(null);
  const [checkingUsuario, setCheckingUsuario] = useState(false);
  const [error, setError] = useState('');

  // verifica si el usuario esta disponible
  useEffect(() => {
    const nombre = usuario.trim();

    if (!nombre) {
      setUsuarioDisponible(null);
      setCheckingUsuario(false);
      return;
    }

    setCheckingUsuario(true);

    const timeoutId = setTimeout(async () => {
      const disponible = await checkUsuarioDisponible(nombre);
      setUsuarioDisponible(disponible);
      setCheckingUsuario(false);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [usuario]);

  // envia los datos para crear cuenta
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const f = e.target as HTMLFormElement;

    if (usuario.trim().length > USUARIO_MAX_LENGTH || usuarioDisponible === false) return;

    const res = await crearCuenta({
      usuario: usuario.trim(),
      email: f.email.value,
      telefono: f.telefono.value,
      password: f.password.value,
    });

    if (res.ok) {
      navigate('/');
    } else if (res.status === 409) {
      setUsuarioDisponible(false);
      setError('Ese nombre de usuario ya esta en uso.');
    } else {
      setError('No se pudo crear la cuenta. Intenta de nuevo.');
    }
  }

 
  const usuarioMensaje = checkingUsuario
    ? 'Verificando disponibilidad...'
    : usuarioDisponible === false
      ? 'Ese nombre de usuario ya esta en uso'
      : usuarioDisponible === true
        ? 'Nombre de usuario disponible'
        : '';

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />

      <main className="flex-1 relative flex items-center justify-center p-4">
        <Link
          to="/"
          aria-label="Volver al browser"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-ink"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="w-full max-w-sm bg-white border border-umber/15 rounded-2xl p-6">
          <h1 className="font-display font-bold text-lg text-ink mb-4 text-center">
            Crear cuenta
          </h1>

          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <input
                name="usuario"
                placeholder="Usuario"
                required
                maxLength={USUARIO_MAX_LENGTH}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className={inputClass}
              />

              {usuarioMensaje && (
                <p
                  className={`text-xs px-1 ${
                    usuarioDisponible === false
                      ? 'text-red-600'
                      : usuarioDisponible === true
                        ? 'text-forest'
                        : 'text-umber/50'
                  }`}
                >
                  {usuarioMensaje}
                </p>
              )}
            </div>

            <input
              name="email"
              type="email"
              placeholder="Email"
              className={inputClass}
            />

            <input
              name="telefono"
              type="tel"
              placeholder="Telefono"
              required
              className={inputClass}
            />

            <input
              name="password"
              type="password"
              placeholder="Contrasena"
              className={inputClass}
            />

            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirmar contrasena"
              className={inputClass}
            />

            {error && <p className="text-xs text-red-600 px-1">{error}</p>}

            <button
              type="submit"
              disabled={checkingUsuario || usuarioDisponible === false}
              className="mt-2 bg-clay text-white rounded-lg py-2.5 font-medium hover:bg-clay/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear cuenta
            </button>
          </form>

          <p className="text-xs text-umber/70 text-center mt-4">
            ¿Ya tenes cuenta?{' '}
            <Link to="/login" className="text-clay font-medium hover:underline">
              Iniciar sesion
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
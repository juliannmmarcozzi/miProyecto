
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavMenu from '../components/NavMenu';

const API_URL = import.meta.env.VITE_API_URL;
const LOGO_URL = `${import.meta.env.BASE_URL}pilched.png`;

export default function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const inputClass =
    'w-full bg-[#090F1E] text-white placeholder:text-gray-400 px-3 py-2.5 border border-white/5 focus:outline-none focus:border-blue-500';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const datos = new FormData(e.currentTarget);
    const nombreUsuario = String(datos.get('usuario') || '').trim();

    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario: nombreUsuario,
          contrasena: datos.get('password'),
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        localStorage.setItem('token', data.token);

        // IR A HOME Y MOSTRAR BIENVENIDA
        navigate('/', {
          replace: true,
          state: {
            bienvenida: nombreUsuario,
          },
        });
      } else {
        setError(data.error || 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      console.error(error);
      setError('No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#10182D] text-white">
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-24 sm:py-8">

        {/* FONDO */}
        <img
          src="/image%204.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* LOGO PILCHED ARRIBA A LA IZQUIERDA */}
        <Link
          to="/"
          className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20"
          aria-label="Ir al inicio de Pilched"
        >
          <img
            src={LOGO_URL}
            alt="Pilched"
            className="w-36 sm:w-48 h-auto object-contain"
          />
        </Link>

        {/* MENÚ HAMBURGUESA ARRIBA A LA DERECHA */}
        <div className="absolute top-6 right-6 z-30">
          <NavMenu />
        </div>

        {/* FORMULARIO */}
        <div className="relative z-10 w-full max-w-[340px] min-h-[510px] bg-[#10182D] px-9 pt-16 pb-5 flex flex-col">

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >

            <input
              name="usuario"
              type="text"
              placeholder="Usuario"
              autoComplete="username"
              required
              className={inputClass}
            />

            <div className="relative">

              <input
                name="password"
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete="current-password"
                required
                className={`${inputClass} pr-11`}
              />

              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                aria-label={
                  mostrarPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                aria-pressed={mostrarPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              >
                <img
                  src="/togglepassword.svg"
                  alt=""
                  className="w-5 h-5"
                />
              </button>

            </div>

            {error && (
              <p className="text-red-400 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="mt-8 bg-[#1613A5] text-white rounded-full py-2.5 font-medium hover:bg-[#2520C8] transition-colors disabled:opacity-50"
            >
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>

          </form>

          <div className="flex-1" />

          <Link
            to="/crear-cuenta"
            className="text-center text-xs text-gray-300 hover:text-white"
          >
            Crear cuenta
          </Link>

        </div>
      </main>
    </div>
  );
}

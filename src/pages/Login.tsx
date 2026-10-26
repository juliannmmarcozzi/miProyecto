
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavMenu from '../components/NavMenu';

const API_URL = 'http://localhost:3000';

export default function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const inputClass =
    'w-full bg-[#090F1E] text-white placeholder:text-gray-400 px-3 py-2.5 border border-white/5 focus:outline-none focus:border-blue-500';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const datos = new FormData(e.currentTarget);
    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario: datos.get('usuario'),
          contrasena: datos.get('password'),
        }),
      });

      if (res.status === 200) {
        const data = await res.json();

        localStorage.setItem('token', data.token);
        navigate('/perfil');
      } else {
        const data = await res.json();
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
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
        <img
          src="/image%204.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute top-6 left-6 z-30">
          <NavMenu />
        </div>

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

            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              autoComplete="current-password"
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

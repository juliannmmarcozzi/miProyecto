
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavMenu from '../components/NavMenu';

const API_URL = 'http://localhost:3000';

export default function CrearCuenta() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const inputClass =
    'w-full bg-[#090F1E] text-white placeholder:text-gray-400 px-3 py-2.5 border border-white/5 focus:outline-none focus:border-blue-500';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const datos = new FormData(e.currentTarget);

    const password = String(datos.get('password'));
    const confirmPassword = String(datos.get('confirmPassword'));

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      const res = await fetch(`${API_URL}/crear_cuenta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario: datos.get('usuario'),
          nombre: datos.get('nombre'),
          apellido: datos.get('apellido'),
          fecha_nacimiento: datos.get('fechaNacimiento'),
          email: datos.get('email'),
          contrasena: password,
          numero_telefono: datos.get('telefono'),
        }),
      });

      if (res.ok) {
        navigate('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'No se pudo crear la cuenta.');
      }
    } catch (error) {
      console.error(error);
      setError('No se pudo conectar con el servidor.');
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

        <div className="relative z-10 w-full max-w-[400px] bg-[#10182D] px-9 pt-10 pb-6 flex flex-col">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
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
              name="nombre"
              type="text"
              placeholder="Nombre"
              autoComplete="given-name"
              required
              className={inputClass}
            />

            <input
              name="apellido"
              type="text"
              placeholder="Apellido"
              autoComplete="family-name"
              required
              className={inputClass}
            />

            <input
              name="fechaNacimiento"
              type="date"
              autoComplete="bday"
              required
              className={inputClass}
            />

            <input
              name="email"
              type="email"
              placeholder="Correo electrónico"
              autoComplete="email"
              required
              className={inputClass}
            />

            <input
              name="telefono"
              type="tel"
              placeholder="Teléfono"
              autoComplete="tel"
              required
              className={inputClass}
            />

            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              autoComplete="new-password"
              required
              className={inputClass}
            />

            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirmar contraseña"
              autoComplete="new-password"
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
              className="mt-4 bg-[#1613A5] text-white rounded-full py-2.5 font-medium hover:bg-[#2520C8] transition-colors disabled:opacity-50"
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <Link
            to="/login"
            className="text-center text-xs text-gray-300 hover:text-white mt-8"
          >
            Iniciar sesión
          </Link>
        </div>
      </main>
    </div>
  );
}

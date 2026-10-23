
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = 'http://localhost:3000';

export default function CrearCuenta() {
  const navigate = useNavigate();

  const inputClass =
    'border border-umber/25 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay';

  const [error, setError] = useState('');

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
    }
  }

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

          <form
            className="flex flex-col gap-2"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <input
              name="usuario"
              placeholder="Usuario"
              autoComplete="off"
              required
              className={inputClass}
            />

            <input
              name="nombre"
              placeholder="Nombre"
              autoComplete="given-name"
              required
              className={inputClass}
            />

            <input
              name="apellido"
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
              placeholder="Email"
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
              <p className="text-xs text-red-600 px-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-2 bg-clay text-white rounded-lg py-2.5 font-medium hover:bg-clay/90 transition-colors"
            >
              Crear cuenta
            </button>
          </form>

          <p className="text-xs text-umber/70 text-center mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link
              to="/login"
              className="text-clay font-medium hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
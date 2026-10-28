
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavMenu from '../components/NavMenu';

const API_URL = 'http://localhost:3000';

export default function CrearCuenta() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);

  const inputClass =
    'w-full bg-[#090F1E] text-white placeholder:text-gray-400 px-3 py-2.5 border border-white/5 focus:outline-none focus:border-blue-500';

  const hoy = new Date();
  const fechaMaxima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

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

    const fechaNacimiento = String(datos.get('fechaNacimiento'));

    if (
      !fechaNacimiento ||
      fechaNacimiento < '1900-01-01' ||
      fechaNacimiento > fechaMaxima ||
      fechaNacimiento.split('-')[0].length !== 4
    ) {
      setError('Ingresá una fecha de nacimiento válida.');
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
          fecha_nacimiento: fechaNacimiento,
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
            autoComplete="off"
          >
            <input
              name="usuario"
              type="text"
              placeholder="Usuario"
              autoComplete="off"
              required
              className={inputClass}
            />

            <input
              name="nombre"
              type="text"
              placeholder="Nombre"
              autoComplete="off"
              required
              className={inputClass}
            />

            <input
              name="apellido"
              type="text"
              placeholder="Apellido"
              autoComplete="off"
              required
              className={inputClass}
            />

            <input
              name="fechaNacimiento"
              type="date"
              autoComplete="off"
              min="1900-01-01"
              max={fechaMaxima}
              required
              onInput={(e) => {
                const input = e.currentTarget;
                const año = input.value.split('-')[0];

                if (año.length > 4) {
                  input.value = '';
                }
              }}
              className={`${inputClass} [color-scheme:dark]`}
            />

            <input
              name="email"
              type="email"
              placeholder="Correo electrónico"
              autoComplete="off"
              required
              className={inputClass}
            />

            <input
              name="telefono"
              type="tel"
              placeholder="Teléfono"
              autoComplete="off"
              required
              className={inputClass}
            />

            <div className="relative">
              <input
                name="password"
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                className={`${inputClass} pr-11`}
              />

              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              >
                <img
                  src="/togglepassword.svg"
                  alt=""
                  className="w-5 h-5 brightness-0 invert"
                />
              </button>
            </div>

            <div className="relative">
              <input
                name="confirmPassword"
                type={mostrarConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                className={`${inputClass} pr-11`}
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                aria-label={mostrarConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarConfirmPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              >
                <img
                  src="/togglepassword.svg"
                  alt=""
                  className="w-5 h-5 brightness-0 invert"
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
              className="mt-4 bg-[#1613A5] text-white rounded-full py-2.5 font-medium hover:bg-[#2520C8] transition-colors disabled:opacity-50 cursor-pointer"
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

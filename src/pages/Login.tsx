import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = 'http://localhost:3001';

export default function Login() {
  const navigate = useNavigate();
  const inputClass =
    'border border-umber/25 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay';

  async function handleSubmit(e: any) {
    e.preventDefault();

    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: e.target.usuario.value,
        password: e.target.password.value,
      }),
    });

    if (res.status == 200) {
      navigate('/');
    } else {
      alert('Usuario o contraseña incorrectos');
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-ink">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="w-full max-w-sm bg-white border border-umber/15 rounded-2xl p-6">
          <h1 className="font-display font-bold text-lg text-ink mb-4 text-center">
            Iniciar sesión
          </h1>

          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <input name="usuario" placeholder="Usuario" className={inputClass} />
            <input name="password" type="password" placeholder="Contraseña" className={inputClass} />

            <button
              type="submit"
              className="mt-2 bg-clay text-white rounded-lg py-2.5 font-medium hover:bg-clay/90 transition-colors"
            >
              Entrar
            </button>
          </form>

          <p className="text-xs text-umber/70 text-center mt-4">
            ¿No tenés cuenta?{' '}
            <Link to="/crear-cuenta" className="text-clay font-medium hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}


import { useEffect, useState } from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import Browser from './pages/Browser';
import Perfil from './pages/Perfil';
import CrearCuenta from './pages/CrearCuenta';
import Login from './pages/Login';
import VistaArticulo from './pages/VistaArticulo';
import MisPublicaciones from './pages/MisPublicaciones';
import MisPedidos from './pages/MisPedidos';
import MisMensajes from './pages/MisMensajes';
import PerfilUsuario from './pages/PerfilUsuario';
import Chat from './pages/Chat';
import Comprar from './pages/Comprar';
import Ofertar from './pages/Ofertar';
import RutaSegura from './components/RutaSegura';

interface EstadoNavegacion {
  bienvenida?: string;
}

function Bienvenida() {
  const location = useLocation();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const estado =
      location.state as EstadoNavegacion | null;

    if (
      location.pathname === '/' &&
      estado?.bienvenida
    ) {
      setNombre(estado.bienvenida);
      setVisible(true);

      navigate('/', {
        replace: true,
        state: null,
      });
    }
  }, [
    location.pathname,
    location.state,
    navigate,
  ]);

  useEffect(() => {
    if (!visible) return;

    const temporizador = window.setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [visible, nombre]);

  if (!visible || location.pathname !== '/') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-120px)] max-w-md pointer-events-none"
    >
      <div className="bg-[#101925]/95 backdrop-blur-md border border-[#34465B] rounded-xl px-5 py-3.5 shadow-2xl flex items-center justify-between gap-4 pointer-events-auto">
        <h2 className="text-white text-sm sm:text-base font-semibold truncate">
          Bienvenido, {nombre}
        </h2>

        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar bienvenida"
          className="w-7 h-7 shrink-0 text-[#AAB8C8] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Rutas() {
  return (
    <>
      <Bienvenida />

      <Routes>
        {/* PÁGINAS PÚBLICAS */}
        <Route
          path="/"
          element={<Browser />}
        />

        <Route
          path="/crear-cuenta"
          element={<CrearCuenta />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/prenda/:id"
          element={<VistaArticulo />}
        />

        <Route
          path="/usuario/:id"
          element={<PerfilUsuario />}
        />

        {/* PÁGINAS PROTEGIDAS */}
        <Route element={<RutaSegura />}>
          <Route
            path="/perfil"
            element={<Perfil />}
          />

          <Route
            path="/mis-publicaciones"
            element={<MisPublicaciones />}
          />

          <Route
            path="/mis-mensajes"
            element={<MisMensajes />}
          />

          <Route
            path="/mis-pedidos"
            element={<MisPedidos />}
          />

          {/* CHAT DESDE UNA PUBLICACIÓN */}
          <Route
            path="/chat/:id"
            element={<Chat />}
          />

          {/* CHAT DESDE NOTIFICACIONES O MENSAJES */}
          <Route
            path="/mensajes/:id"
            element={<Chat />}
          />

          {/* COMPRA DIRECTA */}
          <Route
            path="/comprar"
            element={<Comprar />}
          />

          {/* OFERTAS */}
          <Route
            path="/ofertar"
            element={<Ofertar />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Rutas />
    </BrowserRouter>
  );
}

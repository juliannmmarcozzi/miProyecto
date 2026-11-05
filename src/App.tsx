
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
import PerfilUsuario from './pages/PerfilUsuario';
import Chat from './pages/Chat';
import Comprar from './pages/Comprar';
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
    const estado = location.state as EstadoNavegacion | null;

    if (location.pathname === '/' && estado?.bienvenida) {
      setNombre(estado.bienvenida);
      setVisible(true);

      // Limpiamos el estado de navegación
      navigate('/', {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.state, navigate]);

  function cerrar() {
    setVisible(false);
  }

  // SOLO MOSTRAR EN HOME
  if (!visible || location.pathname !== '/') {
    return null;
  }

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-md">

      <div className="bg-[#101925] border border-[#34465B] rounded-xl px-5 py-4 shadow-lg flex items-center justify-between gap-5">

        <h2 className="text-white text-base sm:text-lg font-semibold">
          Bienvenido, {nombre}
        </h2>

        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar bienvenida"
          className="text-[#AAB8C8] hover:text-white cursor-pointer shrink-0"
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
            path="/mis-pedidos"
            element={<MisPedidos />}
          />

          <Route
            path="/chat/:id"
            element={<Chat />}
          />

          <Route
            path="/comprar"
            element={<Comprar />}
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

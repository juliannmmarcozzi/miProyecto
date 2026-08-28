import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Browser />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/login" element={<Login />} />
        <Route path="/prenda/:id" element={<VistaArticulo />} />
        <Route path="/mis-publicaciones" element={<MisPublicaciones />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="/usuario/:id" element={<PerfilUsuario />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/comprar/:id" element={<Comprar />} />
      </Routes>
    </BrowserRouter>
  );
}

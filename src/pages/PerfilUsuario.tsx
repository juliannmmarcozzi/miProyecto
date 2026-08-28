import { useParams } from 'react-router-dom';

export default function PerfilUsuario() {
  const { id } = useParams();
  return <h1 className="p-4 text-xl font-bold text-ink">Perfil de {id}</h1>;
}

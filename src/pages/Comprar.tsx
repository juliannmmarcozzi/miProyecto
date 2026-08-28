import { useParams } from 'react-router-dom';

export default function Comprar() {
  const { id } = useParams();
  return <h1 className="p-4 text-xl font-bold text-ink">Comprar artículo {id}</h1>;
}

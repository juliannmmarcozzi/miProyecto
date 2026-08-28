import { useParams } from 'react-router-dom';

export default function Chat() {
  const { id } = useParams();
  return <h1 className="p-4 text-xl font-bold text-ink">Chat con vendedor {id}</h1>;
}

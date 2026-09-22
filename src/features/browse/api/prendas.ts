// estructura de una prenda
export interface Prenda {
  id: string;
  titulo: string;
  precio: number;
  imagenes: string[];
  descripcion: string;
  tipoPrenda: string;
  marca: string;
  color: string;
  talle: string;
  estado: string;
  likes: number;
  visualizaciones: number;
  tags: string[];
  genero: string;
  stock: number;
  usuario: string;
  fechaPublicacion: string;
}

// datos que pone el usuario al publicar.
type NuevaPrenda = Omit<Prenda, 'id' | 'likes' | 'visualizaciones' | 'usuario' | 'fechaPublicacion'>;

const API_URL = 'http://localhost:3001';

// trae todas las prendas
export async function getPrendas(): Promise<Prenda[]> {
  const res = await fetch(`${API_URL}/api/prendas`);
  return res.json();
}

// trae una prenda por id (para vista ampliada)
export async function getPrenda(id: string): Promise<Prenda | undefined> {
  const res = await fetch(`${API_URL}/api/prendas/${id}`);
  if (!res.ok) return undefined;
  return res.json();
}

// crea una prenda/post nueva
export async function createPost(nuevaPrenda: NuevaPrenda): Promise<Prenda> {
  const res = await fetch(`${API_URL}/api/prendas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevaPrenda),
  });
  return res.json();
}

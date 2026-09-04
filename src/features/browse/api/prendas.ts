// Estructura de una Prenda, según el DER del backend
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

// Datos que pone el usuario al publicar. El resto (id, likes, visualizaciones,
// usuario, fechaPublicacion) lo genera el backend.
type NuevaPrenda = Omit<Prenda, 'id' | 'likes' | 'visualizaciones' | 'usuario' | 'fechaPublicacion'>;

// URL del backend. Está en otro repo, así que si corre en otro puerto o
// ya está deployado, solo hay que cambiar esta línea.
const API_URL = 'http://localhost:3001';

// Trae todas las prendas (para la pantalla de browse)
export async function getPrendas(): Promise<Prenda[]> {
  const res = await fetch(`${API_URL}/api/prendas`);
  return res.json();
}

// Trae una prenda por id (para la vista ampliada del artículo)
export async function getPrenda(id: string): Promise<Prenda | undefined> {
  const res = await fetch(`${API_URL}/api/prendas/${id}`);
  if (!res.ok) return undefined;
  return res.json();
}

// Crea una prenda/post nueva
export async function createPost(nuevaPrenda: NuevaPrenda): Promise<Prenda> {
  const res = await fetch(`${API_URL}/api/prendas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevaPrenda),
  });
  return res.json();
}

// Estructura de una Prenda, según el DER del backend
export interface Prenda {
  id: string;
  precio: number;
  imagenes: string[];
  descripcion: string;
  tipoPrenda: string;
  marca: string;
  color: string;
  talle: string;
  estado: string;
  likes: number;
  tags: string[];
  genero: string;
  stock: number;
}

// Trae todas las prendas del backend (para la pantalla de browse)
export async function getPrendas(): Promise<Prenda[]> {
  const response = await fetch('/api/prendas');

  if (!response.ok) {
    throw new Error('Error al traer las prendas');
  }

  const data: Prenda[] = await response.json();
  return data;
}

// Crea una prenda/post nueva
export async function createPost(nuevaPrenda: Omit<Prenda, 'id' | 'likes'>): Promise<Prenda> {
  const response = await fetch('/api/prendas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevaPrenda),
  });

  if (!response.ok) {
    throw new Error('Error al crear la prenda');
  }

  const data: Prenda = await response.json();
  return data;
}
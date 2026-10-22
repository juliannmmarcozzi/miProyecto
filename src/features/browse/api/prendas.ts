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

const API_URL = 'http://localhost:3000';

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


export async function createPost(
  nuevaPrenda: NuevaPrenda,
  usuarioId: number
) {
  const res = await fetch('http://localhost:3000/crear_publicacion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      talle: nuevaPrenda.talle,
      color: nuevaPrenda.color,
      estado_condicion: nuevaPrenda.estado,
      precio: nuevaPrenda.precio,
      titulo: nuevaPrenda.titulo,
      descripcion: nuevaPrenda.descripcion,
      foto: nuevaPrenda.imagenes[0],
      marca: nuevaPrenda.marca,
      usuario_publicador_id: usuarioId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error al crear publicación: ${res.status}`);
  }

  return res.json();
}

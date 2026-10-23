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
  genero: string;
  stock: number;
  usuario: string;
  fechaPublicacion: string;
}

type NuevaPrenda = Omit<Prenda, 'id' | 'likes' | 'visualizaciones' | 'usuario' | 'fechaPublicacion'>;

const API_URL = 'http://localhost:3000';

export async function getPrendas(): Promise<Prenda[]> {
  const res = await fetch(`${API_URL}/prendas`);

  if (!res.ok) {
    throw new Error('Error al obtener las prendas');
  }

  const datos = await res.json();

  return datos.map((producto: any) => ({
    id: String(producto.id),
    titulo: producto.titulo,
    precio: Number(producto.precio),
    imagenes: producto.foto ? [producto.foto] : [],
    descripcion: producto.descripcion,
    tipoPrenda: producto.tipo_prenda ?? '',
    marca: producto.marca,
    color: producto.color,
    talle: producto.talle,
    estado: producto.estado_condicion,
    likes: producto.likes ?? 0,
    visualizaciones: producto.visualizaciones ?? 0,
    genero: producto.genero ?? '',
    stock: producto.stock ?? 0,
    usuario: String(producto.usuario_publicador_id),
    fechaPublicacion: producto.fecha_publicacion,
  }));
}

export async function getPrenda(id: string): Promise<Prenda | undefined> {
  const prendas = await getPrendas();

  return prendas.find((prenda) => prenda.id === id);
}

// crear un post/prenda

export async function createPost(
  nuevaPrenda: NuevaPrenda,
  usuarioId: number
) {
  const res = await fetch(`${API_URL}/crear_publicacion`, {
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
      tipo_prenda: nuevaPrenda.tipoPrenda,
      genero: nuevaPrenda.genero,
      stock: nuevaPrenda.stock,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error al crear publicación: ${res.status}`);
  }

  return res.json();
}


export interface PublicacionBackend {
  id: number;
  titulo: string;
  precio: number;
  descripcion: string;
  foto: string;
  talle: string;
  color: string;
  estado_condicion: string;
  marca: string;
  usuario_publicador_id: number;
  fecha_publicacion: string;
}

export async function getMisPublicaciones(
  usuarioId: number
): Promise<PublicacionBackend[]> {
  const res = await fetch(`${API_URL}/publicaciones/${usuarioId}`);

  if (!res.ok) {
    throw new Error('Error al obtener las publicaciones');
  }

  return res.json();
}


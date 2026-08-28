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
// usuario, fechaPublicacion) lo genera el sistema.
type NuevaPrenda = Omit<Prenda, 'id' | 'likes' | 'visualizaciones' | 'usuario' | 'fechaPublicacion'>;

// Simulación del backend en memoria. Cuando esté la API real, esto se
// reemplaza por fetch('/api/prendas') sin tocar la firma de las funciones.
let prendas: Prenda[] = [];

// Trae todas las prendas (para la pantalla de browse)
export async function getPrendas(): Promise<Prenda[]> {
  return prendas;
}

// Trae una prenda por id (para la vista ampliada del artículo)
export async function getPrenda(id: string): Promise<Prenda | undefined> {
  return prendas.find((prenda) => prenda.id === id);
}

// Crea una prenda/post nueva
export async function createPost(nuevaPrenda: NuevaPrenda): Promise<Prenda> {
  const prenda: Prenda = {
    ...nuevaPrenda,
    id: String(Date.now()),
    likes: 0,
    visualizaciones: 0,
    usuario: 'Vos',
    fechaPublicacion: new Date().toISOString(),
  };
  prendas = [prenda, ...prendas];
  return prenda;
}

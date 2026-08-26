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

// Simulación del backend en memoria. Cuando esté la API real, esto se
// reemplaza por fetch('/api/prendas') sin tocar la firma de las funciones.
let prendas: Prenda[] = [];

// Trae todas las prendas (para la pantalla de browse)
export async function getPrendas(): Promise<Prenda[]> {
  return prendas;
}

// Crea una prenda/post nueva
export async function createPost(nuevaPrenda: Omit<Prenda, 'id' | 'likes'>): Promise<Prenda> {
  const prenda: Prenda = { ...nuevaPrenda, id: String(Date.now()), likes: 0 };
  prendas = [prenda, ...prendas];
  return prenda;
}

const API_URL =
  import.meta.env.VITE_API_URL;

export const USUARIO_MAX_LENGTH = 20;

export interface NuevaCuenta {
  usuario: string;
  email: string;
  telefono: string;
  password: string;
}

export async function checkUsuarioDisponible(usuario: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/usuarios/disponible?usuario=${encodeURIComponent(usuario)}`);
  if (!res.ok) return true;
  const data = await res.json();
  return Boolean(data.disponible);
}


export async function crearCuenta(datos: NuevaCuenta): Promise<Response> {
  return fetch(`${API_URL}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
}

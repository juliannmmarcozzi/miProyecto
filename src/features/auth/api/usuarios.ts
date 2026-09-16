// URL del backend. Está en otro repo, así que si corre en otro puerto o
// ya está deployado, solo hay que cambiar esta línea.
const API_URL = 'http://localhost:3001';

export const USUARIO_MAX_LENGTH = 20;

export interface NuevaCuenta {
  usuario: string;
  email: string;
  telefono: string;
  password: string;
}

// Consulta al backend si el nombre de usuario ya está en uso.
export async function checkUsuarioDisponible(usuario: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/usuarios/disponible?usuario=${encodeURIComponent(usuario)}`);
  if (!res.ok) return true;
  const data = await res.json();
  return Boolean(data.disponible);
}

// Crea la cuenta. El caller decide qué hacer según el status (200/201 ok,
// 409 si el usuario ya existe).
export async function crearCuenta(datos: NuevaCuenta): Promise<Response> {
  return fetch(`${API_URL}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
}

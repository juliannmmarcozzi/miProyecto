import { supabase } from './supabase';

export async function subirImagen(archivo: File): Promise<string> {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

  if (!tiposPermitidos.includes(archivo.type)) {
    throw new Error('Solo se permiten imágenes JPG, PNG o WebP.');
  }

  if (archivo.size > 6 * 1024 * 1024) {
    throw new Error('La imagen no puede superar los 6 MB.');
  }

  const { data: sesion } = await supabase.auth.getSession();

  let usuario = sesion.session?.user;

  if (!usuario) {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error || !data.user) {
      throw new Error('No se pudo iniciar sesión en Supabase.');
    }

    usuario = data.user;
  }

  const extension = archivo.type.split('/')[1];
  const nombreArchivo = `${crypto.randomUUID()}.${extension}`;
  const ruta = `${usuario.id}/${nombreArchivo}`;

  const { error } = await supabase.storage
    .from('publicaciones')
    .upload(ruta, archivo, {
      contentType: archivo.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage
    .from('publicaciones')
    .getPublicUrl(ruta);

  return data.publicUrl;
}
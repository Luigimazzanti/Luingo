import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ CONVERTIDOR DE DRIVE A ENLACE DIRECTO
export const getDriveDirectLink = (url: string) => {
  if (!url) return '';
  
  // Extraer el ID del archivo (funciona con varios formatos de link)
  const idMatch = url.match(/[-\w]{25,}/);
  if (!idMatch) return url; // Si no encuentra ID, devuelve la url original
  
  const fileId = idMatch[0];
  
  // Retornamos la URL pasando por nuestro túnel (proxy) para evitar bloqueo CORS
  // Si no usas el túnel, el enlace sería: https://drive.google.com/uc?export=view&id=${fileId}
  // Pero eso daría error de pantalla blanca en el 99% de los casos.
  return `https://kadpcidhcnsfbkqvmltr.supabase.co/functions/v1/make-server-ebbb5c67/drive-proxy?id=${fileId}`;
};
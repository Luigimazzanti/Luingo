import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { projectId } from '../utils/supabase/info';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ CONVERTIDOR INTELIGENTE DE ENLACES (Google Drive + OneDrive)
export const getSmartLink = (url: string) => {
  if (!url) return '';
  
  // URL base del proxy en Supabase
  const PROXY_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67`;

  // ✅ DETECTAR GOOGLE DRIVE
  if (url.includes('drive.google.com')) {
    // Extraer el ID del archivo (funciona con varios formatos de link)
    const idMatch = url.match(/[-\w]{25,}/);
    if (!idMatch) return url; // Si no encuentra ID, devuelve la url original
    
    const fileId = idMatch[0];
    return `${PROXY_BASE}/drive-proxy?id=${fileId}`;
  }

  // ✅ DETECTAR ONEDRIVE (Links largos y cortos)
  if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
    // Pasamos la URL completa como parámetro al proxy
    return `${PROXY_BASE}/onedrive-proxy?url=${encodeURIComponent(url)}`;
  }

  // Si no es ninguno de los servicios conocidos, devolvemos tal cual
  // (Probablemente fallará si no es un enlace directo)
  return url;
};
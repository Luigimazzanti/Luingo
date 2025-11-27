import { generateReactHelpers } from "@uploadthing/react@6.3.4";
import { projectId } from '../utils/supabase/info';
 
// Definimos el tipo del router (importado desde el servidor)
type OurFileRouter = any;
 
// URL de tu servidor Supabase donde montamos UploadThing
const url = `https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/api/uploadthing`;

// Generamos los helpers de React para subir archivos
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>({
  url: url,
});

// Exportamos también componentes básicos
export { UploadButton, UploadDropzone } from "@uploadthing/react@6.3.4";

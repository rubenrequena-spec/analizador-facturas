import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const BUCKET_DOCUMENTOS = 'documentos'

// Sube un archivo al bucket compartido `documentos` (mismo bucket que usa la web
// del wizard) bajo una carpeta `tipo` y devuelve su URL pública, o null si falla.
export async function uploadDocumento(file, tipo) {
  if (!file) return null
  const ext = file.name.split('.').pop()
  const path = `${tipo}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET_DOCUMENTOS).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) {
    console.error('[supabase upload]', error.message)
    return null
  }
  const { data } = supabase.storage.from(BUCKET_DOCUMENTOS).getPublicUrl(path)
  return { url: data.publicUrl, nombre: file.name }
}

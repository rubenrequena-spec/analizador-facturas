import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Tarifas: PDFs comerciales, no datos personales. Bucket público `tarifas`;
// solo el personal activo puede subir (política RLS). Devuelve la URL pública.
export async function uploadTarifa(file) {
  if (!file) return null
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('tarifas').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) {
    console.error('[supabase upload tarifa]', error.message)
    return null
  }
  const { data } = supabase.storage.from('tarifas').getPublicUrl(path)
  return { url: data.publicUrl, nombre: file.name }
}

// Documentos de inmobiliarias (datos personales): bucket PRIVADO `documentos`.
// El servidor firma una subida de un solo uso (api/upload-documento.js); se
// guarda solo la ruta, nunca una URL pública.
export async function uploadDocumento(file) {
  if (!file) return null
  const { data: { session } } = await supabase.auth.getSession()
  const r = await fetch('/api/upload-documento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session && { Authorization: `Bearer ${session.access_token}` }),
    },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  })
  const firma = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(firma.error || 'No se pudo subir el archivo')
  const { error } = await supabase.storage.from('documentos').uploadToSignedUrl(firma.path, firma.token, file, {
    contentType: file.type,
  })
  if (error) throw new Error('No se pudo subir el archivo')
  return { path: firma.path, nombre: file.name }
}

// Abre un documento privado con un enlace temporal (5 min). Pueden leer el
// personal activo (todo) y cada colaborador (solo los de su empresa), por RLS.
export async function abrirDocumento(path) {
  const ventana = window.open('', '_blank') // antes del await, o el navegador bloquea la ventana
  if (ventana) ventana.opener = null
  const { data, error } = await supabase.storage.from('documentos').createSignedUrl(path, 300)
  if (error || !data?.signedUrl) {
    ventana?.close()
    alert('No tienes permiso para abrir este documento o ya no existe.')
    return
  }
  if (ventana) ventana.location = data.signedUrl
  else window.location = data.signedUrl
}

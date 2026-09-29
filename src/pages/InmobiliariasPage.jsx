import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

const ESTADOS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'en_tramite', label: 'En trámite' },
  { value: 'completado', label: 'Completado' },
]

export default function InmobiliariasPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  async function recargar() {
    setLoading(true)
    const { data } = await supabase
      .from('inmobiliaria_documentos')
      .select('*')
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => { recargar() }, [])

  async function handleEstado(doc, estado) {
    setDocs(prev => prev.map(d => (d.id === doc.id ? { ...d, estado } : d)))
    await supabase.from('inmobiliaria_documentos').update({ estado }).eq('id', doc.id)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #D8E8E4', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #D8E8E4' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2D26' }}>
            🏢 Documentación de inmobiliarias ({docs.length})
          </h3>
          <p style={{ fontSize: 12, color: '#527870', marginTop: 4 }}>
            Recibido a través del formulario público en /inmobiliarias.
          </p>
        </div>
        {loading ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#527870', fontSize: 13 }}>Cargando…</div>
        ) : docs.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#527870', fontSize: 13 }}>
            Todavía no ha llegado ninguna documentación.
          </div>
        ) : (
          docs.map((d, i) => (
            <div key={d.id} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid #F0F4F3' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2D26' }}>
                    {d.inmobiliaria || 'Inmobiliaria sin nombre'} — {d.contacto_nombre || 'Sin contacto'}
                  </div>
                  <div style={{ fontSize: 12, color: '#527870', marginTop: 2 }}>
                    {d.contacto_telefono} {d.contacto_telefono && d.contacto_email && '·'} {d.contacto_email}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {new Date(d.created_at).toLocaleString('es-ES')}
                  </div>
                </div>
                <select
                  value={d.estado}
                  onChange={e => handleEstado(d, e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D8E8E4',
                    fontSize: 13, fontWeight: 600, color: '#1B2D26', background: 'white',
                  }}
                >
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              {d.notas && (
                <div style={{ fontSize: 13, color: '#1B2D26', marginTop: 10, background: '#F5F7F6', borderRadius: 8, padding: '8px 12px' }}>
                  {d.notas}
                </div>
              )}
              {Array.isArray(d.archivos) && d.archivos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {d.archivos.map((a, j) => (
                    <a
                      key={j}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 12, color: '#16a34a', fontWeight: 600, textDecoration: 'none',
                        background: '#EBF8EA', borderRadius: 8, padding: '6px 10px',
                      }}
                    >
                      📎 {a.nombre || `documento ${j + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

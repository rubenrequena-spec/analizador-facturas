import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabase.js'

const COLORS = { dark: '#1B2D26', muted: '#527870', border: '#D8E8E4', bg: '#F5F7F6' }

export default function ColaboradorTarifasPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tarifas_documentos')
      .select('*')
      .eq('activo', true)
      .order('compania', { ascending: true })
      .then(({ data }) => {
        setDocs(data || [])
        setLoading(false)
      })
  }, [])

  const porCompania = docs.reduce((acc, d) => {
    (acc[d.compania] = acc[d.compania] || []).push(d)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', background: 'white', borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
      {loading ? (
        <p style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center' }}>Cargando…</p>
      ) : docs.length === 0 ? (
        <p style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center' }}>Todavía no hay tarifas publicadas.</p>
      ) : (
        Object.entries(porCompania).map(([compania, items]) => (
          <div key={compania} style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark, marginBottom: 8 }}>{compania}</h3>
            {items.map(d => (
              <a
                key={d.id}
                href={d.archivo_url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', padding: '10px 14px', borderRadius: 10, background: COLORS.bg, marginBottom: 6, textDecoration: 'none', color: COLORS.dark, fontSize: 13, fontWeight: 600 }}
              >
                📄 {d.nombre_documento}
                {d.notas && <span style={{ color: COLORS.muted, fontWeight: 400 }}> — {d.notas}</span>}
              </a>
            ))}
          </div>
        ))
      )}
    </div>
  )
}

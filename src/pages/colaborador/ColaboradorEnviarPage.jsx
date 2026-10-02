import React, { useState } from 'react'
import { useAuth } from '../../auth.js'
import { supabase, uploadDocumento } from '../../supabase.js'

const COLORS = { dark: '#1B2D26', green: '#16a34a', muted: '#527870', border: '#D8E8E4', bg: '#F5F7F6', red: '#E8655D' }

export default function ColaboradorEnviarPage() {
  const { colaboradorUser } = useAuth()
  const [notas, setNotas] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (files.length === 0) {
      setError('Adjunta al menos un documento')
      return
    }
    setSubmitting(true)
    try {
      const subidos = []
      for (const file of files) {
        const r = await uploadDocumento(file)
        if (r) subidos.push(r)
      }
      const { error: insertErr } = await supabase.from('inmobiliaria_documentos').insert({
        colaborador_id: colaboradorUser?.colaborador_id,
        notas: notas || null,
        archivos: subidos,
        consent_privacy: true,
        consent_timestamp: new Date().toISOString(),
      })
      if (insertErr) throw insertErr
      setDone(true)
      setNotas('')
      setFiles([])
    } catch (err) {
      setError(err.message || 'No se pudo enviar. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', background: 'white', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.dark, marginBottom: 8 }}>Documentación enviada</h3>
        <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16 }}>La verás en "Mis envíos" con su estado.</p>
        <button
          onClick={() => setDone(false)}
          style={{ background: COLORS.green, color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Enviar otro documento
        </button>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${COLORS.border}`,
    fontSize: 14, outline: 'none', color: COLORS.dark, background: COLORS.bg,
  }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.dark, marginBottom: 6 }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, margin: '0 auto', background: 'white', borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Notas</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Cualquier detalle sobre el cliente o el trámite (opcional)" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Documentos *</label>
        <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => setFiles(Array.from(e.target.files || []))} style={inputStyle} />
        {files.length > 0 && (
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
            {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
      {error && <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 12 }}>{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%', background: submitting ? '#94a3b8' : COLORS.green, color: 'white', border: 'none',
          padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Enviando…' : 'Enviar documentación'}
      </button>
    </form>
  )
}

import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { supabase, uploadDocumento, N8N_WEBHOOK_URL } from '../supabase.js'

const schema = z.object({
  inmobiliaria: z.string().min(1, 'Indica el nombre de la inmobiliaria'),
  contacto_nombre: z.string().min(1, 'Indica tu nombre'),
  contacto_telefono: z.string().min(6, 'Teléfono no válido'),
  contacto_email: z.string().email('Email no válido'),
  notas: z.string().optional(),
})

const COLORS = {
  dark: '#1B2D26', green: '#16a34a', greenLight: '#22c55e',
  muted: '#527870', border: '#D8E8E4', bg: '#F5F7F6', red: '#E8655D',
}

export default function InmobiliariasPublicPage() {
  const [tab, setTab] = useState('subir')
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #dcfce7 0%, #f0fdf4 40%, #ffffff 100%)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/assets/logo-finanzas-healthy.png" alt="Finanzas Healthy" style={{ height: 44, marginBottom: 12 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.dark, marginBottom: 6 }}>Portal para inmobiliarias</h1>
          <p style={{ fontSize: 14, color: COLORS.muted }}>Sube la documentación de tus clientes o consulta las tarifas actualizadas.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'white', borderRadius: 12, padding: 4, border: `1px solid ${COLORS.border}` }}>
          {[{ id: 'subir', label: '📎 Enviar documentación' }, { id: 'tarifas', label: '📄 Tarifas actualizadas' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: tab === t.id ? COLORS.green : 'transparent',
                color: tab === t.id ? 'white' : COLORS.muted,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'subir' ? <FormularioSubida /> : <ListaTarifas />}
      </div>
    </div>
  )
}

function FormularioSubida() {
  const [form, setForm] = useState({ inmobiliaria: '', contacto_nombre: '', contacto_telefono: '', contacto_email: '', notas: '' })
  const [files, setFiles] = useState([])
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const empresa = params.get('empresa')
    if (empresa) setForm(f => ({ ...f, inmobiliaria: empresa }))
  }, [])

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})

    const parsed = schema.safeParse(form)
    const newErrors = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) newErrors[issue.path[0]] = issue.message
    }
    if (files.length === 0) newErrors.archivos = 'Adjunta al menos un documento'
    if (!consent) newErrors.consent = 'Debes aceptar la política de privacidad'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      const subidos = []
      for (const file of files) {
        const r = await uploadDocumento(file, 'inmobiliaria')
        if (r) subidos.push(r)
      }

      const consentTimestamp = new Date().toISOString()

      const { error: insertErr } = await supabase.from('inmobiliaria_documentos').insert({
        inmobiliaria: form.inmobiliaria,
        contacto_nombre: form.contacto_nombre,
        contacto_telefono: form.contacto_telefono,
        contacto_email: form.contacto_email,
        notas: form.notas || null,
        archivos: subidos,
        consent_privacy: true,
        consent_timestamp: consentTimestamp,
      })
      if (insertErr) throw insertErr

      if (N8N_WEBHOOK_URL) {
        fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadType: 'documento_inmobiliaria',
            timestamp: consentTimestamp,
            inmobiliaria: form.inmobiliaria,
            nombre: form.contacto_nombre,
            telefono: form.contacto_telefono,
            email: form.contacto_email,
            notas: form.notas,
            archivos: subidos,
          }),
        }).catch(err => console.error('[n8n webhook error]', err))
      }

      setDone(true)
    } catch (err) {
      setErrors({ general: err.message || 'No se pudo enviar. Inténtalo de nuevo.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.dark, marginBottom: 8 }}>Documentación recibida</h2>
        <p style={{ fontSize: 14, color: COLORS.muted }}>Gracias. Nos pondremos en contacto en cuanto la revisemos.</p>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${COLORS.border}`,
    fontSize: 14, outline: 'none', color: COLORS.dark, background: COLORS.bg,
  }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.dark, marginBottom: 6 }
  const errorStyle = { fontSize: 12, color: COLORS.red, marginTop: 4 }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Inmobiliaria *</label>
        <input style={inputStyle} value={form.inmobiliaria} onChange={e => setF('inmobiliaria', e.target.value)} placeholder="Nombre de la inmobiliaria" />
        {errors.inmobiliaria && <div style={errorStyle}>{errors.inmobiliaria}</div>}
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Tu nombre *</label>
        <input style={inputStyle} value={form.contacto_nombre} onChange={e => setF('contacto_nombre', e.target.value)} placeholder="Nombre y apellidos" />
        {errors.contacto_nombre && <div style={errorStyle}>{errors.contacto_nombre}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Teléfono *</label>
          <input style={inputStyle} value={form.contacto_telefono} onChange={e => setF('contacto_telefono', e.target.value)} placeholder="600 000 000" />
          {errors.contacto_telefono && <div style={errorStyle}>{errors.contacto_telefono}</div>}
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" style={inputStyle} value={form.contacto_email} onChange={e => setF('contacto_email', e.target.value)} placeholder="tu@inmobiliaria.com" />
          {errors.contacto_email && <div style={errorStyle}>{errors.contacto_email}</div>}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Notas</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Cualquier detalle sobre el cliente o el trámite (opcional)" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Documentos *</label>
        <input
          type="file"
          multiple
          accept="application/pdf,image/*"
          onChange={e => setFiles(Array.from(e.target.files || []))}
          style={inputStyle}
        />
        {files.length > 0 && (
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
            {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
          </div>
        )}
        {errors.archivos && <div style={errorStyle}>{errors.archivos}</div>}
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, fontSize: 12, color: COLORS.muted, cursor: 'pointer' }}>
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          Acepto que Finanzas Healthy trate estos datos y documentos para gestionar el trámite solicitado, según la{' '}
          <a href="/privacidad" target="_blank" style={{ color: COLORS.green }}>política de privacidad</a>.
        </span>
      </label>
      {errors.consent && <div style={{ ...errorStyle, marginBottom: 12 }}>{errors.consent}</div>}
      {errors.general && <div style={{ ...errorStyle, marginBottom: 12 }}>{errors.general}</div>}

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

function ListaTarifas() {
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
    <div style={{ background: 'white', borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
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
                style={{
                  display: 'block', padding: '10px 14px', borderRadius: 10, background: COLORS.bg,
                  marginBottom: 6, textDecoration: 'none', color: COLORS.dark, fontSize: 13, fontWeight: 600,
                }}
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

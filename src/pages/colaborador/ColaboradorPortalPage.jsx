import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, signOut } from '../../auth.js'
import { supabase, uploadDocumento } from '../../supabase.js'

const COLORS = {
  dark: '#1B2D26', green: '#16a34a', muted: '#527870', border: '#D8E8E4', bg: '#F5F7F6', red: '#E8655D',
}

const ESTADO_LABEL = { nuevo: 'Nuevo', en_tramite: 'En trámite', completado: 'Completado' }
const ESTADO_COLOR = {
  nuevo: { bg: '#EFF6FF', color: '#3B82F6' },
  en_tramite: { bg: '#FEF3C7', color: '#B45309' },
  completado: { bg: '#EBF8EA', color: '#16a34a' },
}

export default function ColaboradorPortalPage() {
  const { colaborador, colaboradorUser, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('enviar')

  if (loading) return null

  async function handleLogout() {
    await signOut()
    navigate('/colaborador/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7F6' }}>
      <div style={{ background: 'white', borderBottom: `1px solid ${COLORS.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>PORTAL DE COLABORADORES</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.dark }}>{colaborador?.nombre_comercial}</div>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: '#FDEAE9', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: COLORS.red, cursor: 'pointer' }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'white', borderRadius: 12, padding: 4, border: `1px solid ${COLORS.border}` }}>
          {[
            { id: 'enviar', label: '📎 Enviar documentación' },
            { id: 'mis-envios', label: '📋 Mis envíos' },
            { id: 'tarifas', label: '📄 Tarifas' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: tab === t.id ? COLORS.green : 'transparent',
                color: tab === t.id ? 'white' : COLORS.muted,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'enviar' && <FormularioEnvio colaboradorId={colaboradorUser?.colaborador_id} />}
        {tab === 'mis-envios' && <MisEnvios />}
        {tab === 'tarifas' && <Tarifas />}
      </div>
    </div>
  )
}

function FormularioEnvio({ colaboradorId }) {
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
        const r = await uploadDocumento(file, 'inmobiliaria')
        if (r) subidos.push(r)
      }
      const { error: insertErr } = await supabase.from('inmobiliaria_documentos').insert({
        colaborador_id: colaboradorId,
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
      <div style={{ background: 'white', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
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
    <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Notas</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Cualquier detalle sobre el cliente o el trámite (opcional)" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Documentos *</label>
        <input type="file" multiple accept="application/pdf,image/*" onChange={e => setFiles(Array.from(e.target.files || []))} style={inputStyle} />
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

function MisEnvios() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('inmobiliaria_documentos')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDocs(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
      {loading ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Cargando…</div>
      ) : docs.length === 0 ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Todavía no has enviado nada.</div>
      ) : (
        docs.map((d, i) => {
          const c = ESTADO_COLOR[d.estado] || ESTADO_COLOR.nuevo
          return (
            <div key={d.id} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid #F0F4F3' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
                  {new Date(d.created_at).toLocaleString('es-ES')}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color }}>
                  {ESTADO_LABEL[d.estado] || d.estado}
                </span>
              </div>
              {d.notas && <div style={{ fontSize: 13, color: COLORS.dark, marginTop: 6 }}>{d.notas}</div>}
              {Array.isArray(d.archivos) && d.archivos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {d.archivos.map((a, j) => (
                    <a key={j} href={a.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: COLORS.green, fontWeight: 600, textDecoration: 'none', background: '#EBF8EA', borderRadius: 8, padding: '5px 9px' }}>
                      📎 {a.nombre || `documento ${j + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function Tarifas() {
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

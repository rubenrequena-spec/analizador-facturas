import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, uploadDocumento } from '../supabase.js'

const COLORS = { dark: '#1B2D26', green: '#16a34a', muted: '#527870', border: '#D8E8E4', bg: '#F5F7F6', red: '#E8655D' }

const SERVICIOS = ['Luz', 'Gas', 'Luz y gas', 'Internet y móvil', 'Seguros', 'Hipoteca', 'Otro']
const ORIGENES = [
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'directo', label: 'Cliente directo' },
]
const VACIO = { cliente: '', origen: 'inmobiliaria', origen_nombre: '', servicio: '', telefono: '', email: '', notas: '' }

export default function NuevoContratoPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(VACIO)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.cliente.trim()) {
      setError('Indica el nombre del cliente o una referencia')
      return
    }
    setSubmitting(true)
    try {
      const archivos = []
      for (const file of files) archivos.push(await uploadDocumento(file))
      const { error: insertErr } = await supabase.from('contratos').insert({
        cliente: form.cliente.trim(),
        origen: form.origen,
        origen_nombre: form.origen !== 'directo' ? form.origen_nombre.trim() || null : null,
        servicio: form.servicio || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        notas: form.notas.trim() || null,
        archivos,
      })
      if (insertErr) throw insertErr
      setDone(true)
      setForm(VACIO)
      setFiles([])
    } catch (err) {
      setError(err.message || 'No se pudo guardar. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', background: 'white', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.dark, marginBottom: 8 }}>Contrato guardado</h3>
        <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16 }}>Lo verás en "Mis contratos" con su estado.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setDone(false)} style={btnStyle(COLORS.green)}>Nuevo contrato</button>
          <button onClick={() => navigate('/contratos')} style={btnStyle(COLORS.dark)}>Ver mis contratos</button>
        </div>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${COLORS.border}`,
    fontSize: 14, outline: 'none', color: COLORS.dark, background: COLORS.bg,
  }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.dark, marginBottom: 6 }
  const field = { marginBottom: 14 }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, margin: '0 auto', background: 'white', borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}` }}>
      <label
        style={{
          display: 'block', border: `2px dashed ${files.length ? COLORS.green : COLORS.border}`, borderRadius: 14,
          background: files.length ? '#EBF8EA' : COLORS.bg, padding: '26px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 30, marginBottom: 6 }}>📎</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.dark }}>
          {files.length ? `${files.length} archivo${files.length > 1 ? 's' : ''} listo${files.length > 1 ? 's' : ''} para subir` : 'Subir documentación'}
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
          {files.length ? files.map(f => f.name).join(', ') : 'Todo junto: contrato, DNI, facturas… PDF, JPG, PNG o WEBP (máx. 10 MB cada uno)'}
        </div>
        <input
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={e => setFiles(Array.from(e.target.files || []))}
          style={{ display: 'none' }}
        />
      </label>

      <div style={field}>
        <label style={labelStyle}>Cliente o referencia *</label>
        <input style={inputStyle} value={form.cliente} onChange={e => setF('cliente', e.target.value)} placeholder="Nombre del cliente o referencia del expediente" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, ...field }}>
        <div>
          <label style={labelStyle}>Viene de</label>
          <select style={inputStyle} value={form.origen} onChange={e => setF('origen', e.target.value)}>
            {ORIGENES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {form.origen !== 'directo' && (
          <div>
            <label style={labelStyle}>Nombre {form.origen === 'inmobiliaria' ? 'de la inmobiliaria' : 'del colaborador'}</label>
            <input style={inputStyle} value={form.origen_nombre} onChange={e => setF('origen_nombre', e.target.value)} />
          </div>
        )}
        <div>
          <label style={labelStyle}>Servicio</label>
          <select style={inputStyle} value={form.servicio} onChange={e => setF('servicio', e.target.value)}>
            <option value="">—</option>
            {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, ...field }}>
        <div>
          <label style={labelStyle}>Teléfono</label>
          <input style={inputStyle} type="tel" value={form.telefono} onChange={e => setF('telefono', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={e => setF('email', e.target.value)} />
        </div>
      </div>

      <div style={field}>
        <label style={labelStyle}>Notas</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Cualquier detalle del contrato (opcional)" />
      </div>

      {error && <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 12 }}>{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        style={{ ...btnStyle(submitting ? '#94a3b8' : COLORS.green), width: '100%', padding: 14, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer' }}
      >
        {submitting ? 'Subiendo…' : 'Guardar contrato'}
      </button>
    </form>
  )
}

function btnStyle(bg) {
  return { background: bg, color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
}

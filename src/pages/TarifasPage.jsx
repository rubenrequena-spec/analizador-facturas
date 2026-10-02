import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth.js'
import { supabase, uploadTarifa } from '../supabase.js'

export default function TarifasPage() {
  const { isAdmin } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ compania: '', nombre_documento: '', notas: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function recargar() {
    setLoading(true)
    const { data } = await supabase
      .from('tarifas_documentos')
      .select('*')
      .order('compania', { ascending: true })
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => { recargar() }, [])

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubir() {
    setError('')
    if (!form.compania.trim() || !form.nombre_documento.trim() || !file) {
      setError('Compañía, nombre del documento y archivo son obligatorios')
      return
    }
    setSaving(true)
    try {
      const subido = await uploadTarifa(file)
      if (!subido) throw new Error('No se pudo subir el archivo')
      const { error: insertErr } = await supabase.from('tarifas_documentos').insert({
        compania: form.compania.trim(),
        nombre_documento: form.nombre_documento.trim(),
        archivo_url: subido.url,
        notas: form.notas.trim() || null,
        activo: true,
      })
      if (insertErr) throw insertErr
      setForm({ compania: '', nombre_documento: '', notas: '' })
      setFile(null)
      await recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActivo(doc) {
    await supabase.from('tarifas_documentos').update({ activo: !doc.activo }).eq('id', doc.id)
    recargar()
  }

  async function handleBorrar(doc) {
    if (!confirm(`¿Borrar "${doc.nombre_documento}"?`)) return
    await supabase.from('tarifas_documentos').delete().eq('id', doc.id)
    recargar()
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none', background: 'white',
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#527870', marginBottom: 5 }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #D8E8E4', padding: 20, marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2D26', marginBottom: 4 }}>
          📄 Subir tarifa
        </h3>
        <p style={{ fontSize: 12, color: '#527870', marginBottom: 16 }}>
          Estos documentos los ve cualquier inmobiliaria que entre en el portal público, sin login.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Compañía *</label>
            <input value={form.compania} onChange={e => setF('compania', e.target.value)} placeholder="Endesa, Naturgy…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Nombre del documento *</label>
            <input value={form.nombre_documento} onChange={e => setF('nombre_documento', e.target.value)} placeholder="Tarifa 2.0TD Hogar Sept. 2026" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Notas</label>
          <input value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Opcional" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Archivo (PDF) *</label>
          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} style={inputStyle} />
        </div>
        {error && (
          <div style={{ background: '#FDEAE9', border: '1px solid #E8655D', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#E8655D' }}>
            {error}
          </div>
        )}
        <button
          onClick={handleSubir}
          disabled={saving}
          style={{
            width: '100%', background: saving ? '#94a3b8' : '#16a34a', color: 'white', border: 'none',
            padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Subiendo…' : 'Subir tarifa'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #D8E8E4', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #D8E8E4' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2D26' }}>Documentos subidos ({docs.length})</h3>
        </div>
        {loading ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#527870', fontSize: 13 }}>Cargando…</div>
        ) : docs.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#527870', fontSize: 13 }}>Aún no hay tarifas subidas.</div>
        ) : (
          docs.map((d, i) => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
              borderTop: i > 0 ? '1px solid #F0F4F3' : 'none', opacity: d.activo ? 1 : 0.5,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2D26' }}>
                  {d.compania} — {d.nombre_documento}
                </div>
                <div style={{ fontSize: 12, color: '#527870', marginTop: 2 }}>
                  {d.notas || ''} {!d.activo && <span style={{ color: '#E8655D', fontWeight: 600 }}>(oculto)</span>}
                </div>
              </div>
              <a href={d.archivo_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
                Ver ↗
              </a>
              <button onClick={() => handleToggleActivo(d)} style={{ background: '#F5F7F6', border: '1px solid #D8E8E4', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>
                {d.activo ? 'Ocultar' : 'Mostrar'}
              </button>
              {isAdmin && (
                <button onClick={() => handleBorrar(d)} style={{ background: '#FDEAE9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer' }}>
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

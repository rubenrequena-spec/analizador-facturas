import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth.js'
import { supabase } from '../supabase.js'

const COLORS = { dark: '#1B2D26', green: '#16a34a', muted: '#527870', border: '#D8E8E4', bg: '#F5F7F6', red: '#E8655D' }

const emptyForm = { tipo: 'inmobiliaria', nombre_comercial: '', razon_social: '', cif: '', iban: '', email_contacto: '', telefono_contacto: '', notas: '' }

export default function ColaboradoresPage() {
  const { isAdmin } = useAuth()
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)

  async function recargar() {
    setLoading(true)
    const { data } = await supabase.from('colaboradores').select('*').order('created_at', { ascending: false })
    setColaboradores(data || [])
    setLoading(false)
  }

  useEffect(() => { recargar() }, [])

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function startEdit(c) {
    setEditingId(c.id)
    setForm({
      tipo: c.tipo, nombre_comercial: c.nombre_comercial || '', razon_social: c.razon_social || '',
      cif: c.cif || '', iban: c.iban || '', email_contacto: c.email_contacto || '',
      telefono_contacto: c.telefono_contacto || '', notas: c.notas || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleGuardar() {
    setError('')
    if (!form.nombre_comercial.trim()) {
      setError('El nombre comercial es obligatorio')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const { error: updErr } = await supabase.from('colaboradores').update(form).eq('id', editingId)
        if (updErr) throw updErr
      } else {
        const { error: insErr } = await supabase.from('colaboradores').insert(form)
        if (insErr) throw insErr
      }
      cancelEdit()
      await recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActivo(c) {
    await supabase.from('colaboradores').update({ activo: !c.activo }).eq('id', c.id)
    recargar()
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: 'none', background: 'white' }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 5 }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {isAdmin && (
        <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.dark, marginBottom: 16 }}>
            {editingId ? '✏️ Editar colaborador' : '➕ Dar de alta un colaborador'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={form.tipo} onChange={e => setF('tipo', e.target.value)} style={inputStyle}>
                <option value="inmobiliaria">Inmobiliaria</option>
                <option value="otro">Otro colaborador</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nombre comercial *</label>
              <input value={form.nombre_comercial} onChange={e => setF('nombre_comercial', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Razón social</label>
              <input value={form.razon_social} onChange={e => setF('razon_social', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>CIF</label>
              <input value={form.cif} onChange={e => setF('cif', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>IBAN (para pagarles comisión)</label>
            <input value={form.iban} onChange={e => setF('iban', e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Email de contacto</label>
              <input value={form.email_contacto} onChange={e => setF('email_contacto', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono de contacto</label>
              <input value={form.telefono_contacto} onChange={e => setF('telefono_contacto', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Notas</label>
            <input value={form.notas} onChange={e => setF('notas', e.target.value)} style={inputStyle} />
          </div>
          {error && (
            <div style={{ background: '#FDEAE9', border: '1px solid #E8655D', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: COLORS.red }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleGuardar}
              disabled={saving}
              style={{ flex: 1, background: saving ? '#94a3b8' : COLORS.green, color: 'white', border: 'none', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear colaborador'}
            </button>
            {editingId && (
              <button onClick={cancelEdit} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: COLORS.muted }}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.dark }}>🤝 Colaboradores ({colaboradores.length})</h3>
        </div>
        {loading ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Cargando…</div>
        ) : colaboradores.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Aún no hay colaboradores dados de alta.</div>
        ) : (
          colaboradores.map((c, i) => (
            <div key={c.id} style={{ borderTop: i > 0 ? '1px solid #F0F4F3' : 'none', opacity: c.activo ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark }}>
                    {c.nombre_comercial}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: COLORS.bg, color: COLORS.muted, marginLeft: 8, textTransform: 'capitalize' }}>
                      {c.tipo}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                    {c.razon_social} {c.cif && `· ${c.cif}`}
                  </div>
                </div>
                {isAdmin && (
                  <>
                    <button onClick={() => startEdit(c)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>
                      Editar
                    </button>
                    <button onClick={() => handleToggleActivo(c)} style={{ background: c.activo ? '#FDEAE9' : '#EBF8EA', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </>
                )}
                <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} style={{ background: 'none', border: 'none', fontSize: 12, color: COLORS.green, fontWeight: 700, cursor: 'pointer' }}>
                  {expanded === c.id ? 'Cerrar' : 'Accesos'}
                </button>
              </div>
              {expanded === c.id && <AccesosColaborador colaborador={c} />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AccesosColaborador({ colaborador }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  async function recargar() {
    setLoading(true)
    const { data } = await supabase.from('colaborador_usuarios').select('*').eq('colaborador_id', colaborador.id).order('created_at', { ascending: true })
    setUsuarios(data || [])
    setLoading(false)
  }

  useEffect(() => { recargar() }, [colaborador.id])

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleCrear() {
    setError('')
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim() || form.password.length < 6) {
      setError('Nombre, email y contraseña (mín. 6 caracteres) son obligatorios')
      return
    }
    setCreating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/create-colaborador-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ colaborador_id: colaborador.id, ...form }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'No se pudo crear el acceso')
      setForm({ nombre: '', email: '', password: '' })
      await recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive(u) {
    await supabase.from('colaborador_usuarios').update({ active: !u.active }).eq('id', u.id)
    recargar()
  }

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 12, outline: 'none', background: COLORS.bg }

  return (
    <div style={{ padding: '0 20px 18px', background: COLORS.bg }}>
      {loading ? (
        <div style={{ fontSize: 12, color: COLORS.muted, padding: '10px 0' }}>Cargando accesos…</div>
      ) : usuarios.length === 0 ? (
        <div style={{ fontSize: 12, color: COLORS.muted, padding: '10px 0' }}>Este colaborador aún no tiene ningún acceso.</div>
      ) : (
        usuarios.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #E5EBE9' }}>
            <div style={{ flex: 1, fontSize: 12, color: COLORS.dark }}>
              <strong>{u.full_name}</strong> — {u.email} {u.active === false && <span style={{ color: COLORS.red }}>(inactivo)</span>}
            </div>
            <button onClick={() => handleToggleActive(u)} style={{ background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
              {u.active === false ? 'Activar' : 'Desactivar'}
            </button>
          </div>
        ))
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginTop: 12, alignItems: 'end' }}>
        <input placeholder="Nombre" value={form.nombre} onChange={e => setF('nombre', e.target.value)} style={inputStyle} />
        <input placeholder="Email" value={form.email} onChange={e => setF('email', e.target.value)} style={inputStyle} />
        <input placeholder="Contraseña" type="password" value={form.password} onChange={e => setF('password', e.target.value)} style={inputStyle} />
        <button
          onClick={handleCrear}
          disabled={creating}
          style={{ background: creating ? '#94a3b8' : COLORS.green, color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer' }}
        >
          {creating ? '…' : 'Dar acceso'}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: COLORS.red, marginTop: 6 }}>{error}</div>}
    </div>
  )
}

import React, { useState } from 'react'
import { getSession } from '../auth.js'
import { getComerciales, createUser, deleteUser } from '../auth.js'

export default function AdminPage() {
  const session = getSession()
  const [comerciales, setComerciales] = useState(getComerciales)
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [errForm, setErrForm] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (session?.rol !== 'admin') {
    return (
      <div style={{
        background: 'white', borderRadius: 16, padding: '60px 24px',
        textAlign: 'center', border: '1px solid #D8E8E4', maxWidth: 480, margin: '0 auto',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2D26', marginBottom: 8 }}>
          Acceso restringido
        </h2>
        <p style={{ fontSize: 13, color: '#527870' }}>
          Esta sección es solo para administradores.
        </p>
      </div>
    )
  }

  function recargar() { setComerciales(getComerciales()) }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleCrear() {
    setErrForm('')
    setSuccessMsg('')
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      setErrForm('Todos los campos son obligatorios')
      return
    }
    if (form.password.length < 6) {
      setErrForm('La contraseña debe tener al menos 6 caracteres')
      return
    }
    try {
      createUser(form)
      setForm({ nombre: '', email: '', password: '' })
      setSuccessMsg('Comercial creado correctamente')
      recargar()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrForm(err.message)
    }
  }

  function handleDelete(id) {
    try {
      deleteUser(id)
      recargar()
      setConfirmDelete(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none', background: 'white',
  }
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#527870', marginBottom: 5,
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Sección: Comerciales */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #D8E8E4',
        overflow: 'hidden', marginBottom: 24,
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #D8E8E4' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2D26' }}>
            👥 Comerciales ({comerciales.length})
          </h3>
        </div>
        {comerciales.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#527870', fontSize: 13 }}>
            No hay comerciales registrados.
          </div>
        ) : (
          <div>
            {comerciales.map((u, i) => (
              <div
                key={u.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px', borderTop: i > 0 ? '1px solid #F0F4F3' : 'none',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: u.rol === 'admin' ? '#1B2D26' : '#E3F5F3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700,
                  color: u.rol === 'admin' ? '#22c55e' : '#3A9890',
                  flexShrink: 0,
                }}>
                  {(u.nombre || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2D26', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {u.nombre}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                      background: u.rol === 'admin' ? '#1B2D26' : '#EBF8EA',
                      color: u.rol === 'admin' ? '#22c55e' : '#16a34a',
                    }}>
                      {u.rol}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#527870', marginTop: 2 }}>
                    {u.email}
                    {u.createdAt && (
                      <span style={{ marginLeft: 10 }}>
                        Desde {new Date(u.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                </div>
                {u.rol !== 'admin' && (
                  <button
                    onClick={() => setConfirmDelete(u.id)}
                    title="Eliminar"
                    style={{
                      background: '#FDEAE9', border: 'none', borderRadius: 8,
                      width: 32, height: 32, cursor: 'pointer', fontSize: 14, flexShrink: 0,
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección: Añadir comercial */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #D8E8E4', padding: '20px',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2D26', marginBottom: 16 }}>
          ➕ Crear cuenta de comercial
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setF('nombre', e.target.value)}
              placeholder="Nombre completo"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setF('email', e.target.value)}
              placeholder="comercial@finanzashealthy.com"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Contraseña *</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setF('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            style={inputStyle}
          />
        </div>

        {errForm && (
          <div style={{
            background: '#FDEAE9', border: '1px solid #E8655D', borderRadius: 8,
            padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#E8655D',
          }}>
            {errForm}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: '#EBF8EA', border: '1px solid #22c55e', borderRadius: 8,
            padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#16a34a', fontWeight: 600,
          }}>
            ✓ {successMsg}
          </div>
        )}

        <button
          onClick={handleCrear}
          style={{
            width: '100%', background: '#16a34a', color: 'white', border: 'none',
            padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Crear cuenta
        </button>

        <p style={{ fontSize: 11, color: '#527870', marginTop: 10, lineHeight: 1.5 }}>
          El nuevo comercial podrá acceder con el email y contraseña que estableces aquí. Guarda las credenciales en un lugar seguro.
        </p>
      </div>

      {/* Modal confirmación borrar */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 28,
            maxWidth: 360, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1B2D26' }}>
              Eliminar comercial
            </h3>
            <p style={{ fontSize: 13, color: '#527870', marginBottom: 24 }}>
              ¿Seguro que quieres eliminar esta cuenta? El comercial ya no podrá acceder.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, background: '#F5F7F6', border: '1px solid #D8E8E4',
                  borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', color: '#527870',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1, background: '#E8655D', border: 'none',
                  borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', color: 'white',
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

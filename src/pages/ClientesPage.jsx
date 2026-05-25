import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClientes, saveCliente, deleteCliente } from '../store.js'
import { getEstudios } from '../store.js'

export default function ClientesPage() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState(getClientes)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ nombre: '', empresa: '', telefono: '', email: '' })
  const [errForm, setErrForm] = useState('')

  function recargar() { setClientes(getClientes()) }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleGuardar() {
    if (!form.nombre.trim()) { setErrForm('El nombre es obligatorio'); return }
    setErrForm('')
    saveCliente({ ...form, id: 'cliente-' + Date.now() })
    setForm({ nombre: '', empresa: '', telefono: '', email: '' })
    setShowForm(false)
    recargar()
  }

  function handleDelete(id) {
    deleteCliente(id)
    recargar()
    setConfirmDelete(null)
  }

  const estudios = getEstudios()

  function estudiosDeCliente(clienteId) {
    return estudios.filter(e => e.clienteId === clienteId).length
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none',
  }
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#527870', marginBottom: 5,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#527870' }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setShowForm(!showForm); setErrForm('') }}
          style={{
            background: '#4A9E40', color: 'white', border: 'none',
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ➕ Añadir cliente
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px',
          border: '1px solid #D8E8E4', marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1B2D26', marginBottom: 16 }}>
            Nuevo cliente
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Nombre completo" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Empresa</label>
              <input value={form.empresa} onChange={e => setF('empresa', e.target.value)} placeholder="Nombre de empresa" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input value={form.telefono} onChange={e => setF('telefono', e.target.value)} placeholder="6XX XXX XXX" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="correo@ejemplo.com" style={inputStyle} />
            </div>
          </div>
          {errForm && (
            <p style={{ fontSize: 12, color: '#E8655D', marginTop: 8 }}>{errForm}</p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => { setShowForm(false); setErrForm(''); setForm({ nombre: '', empresa: '', telefono: '', email: '' }) }}
              style={{
                flex: 1, background: '#F5F7F6', border: '1px solid #D8E8E4',
                borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', color: '#527870',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              style={{
                flex: 2, background: '#4A9E40', border: 'none',
                borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', color: 'white',
              }}
            >
              Guardar cliente
            </button>
          </div>
        </div>
      )}

      {/* Lista de clientes */}
      {clientes.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 16, padding: '60px 24px',
          textAlign: 'center', border: '1px solid #D8E8E4',
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 15, color: '#527870', marginBottom: 20, fontWeight: 500 }}>
            Aún no hay clientes registrados
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#4A9E40', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ➕ Añadir primer cliente
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clientes.map(c => {
            const numEstudios = estudiosDeCliente(c.id)
            return (
              <div
                key={c.id}
                style={{
                  background: 'white', borderRadius: 14, padding: '16px 18px',
                  border: '1px solid #D8E8E4', display: 'flex',
                  alignItems: 'center', gap: 14,
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: '#E3F5F3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#3A9890', flexShrink: 0,
                }}>
                  {(c.nombre || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2D26', marginBottom: 2 }}>
                    {c.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: '#527870', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {c.empresa && <span>🏢 {c.empresa}</span>}
                    {c.telefono && <span>📞 {c.telefono}</span>}
                    {c.email && <span>✉️ {c.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <button
                    onClick={() => navigate(`/estudios`)}
                    title="Ver estudios"
                    style={{
                      background: numEstudios > 0 ? '#EBF8EA' : '#F5F7F6',
                      border: 'none', borderRadius: 8, padding: '6px 10px',
                      fontSize: 12, fontWeight: 700,
                      color: numEstudios > 0 ? '#4A9E40' : '#527870', cursor: 'pointer',
                    }}
                  >
                    📁 {numEstudios} estudio{numEstudios !== 1 ? 's' : ''}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c.id)}
                    title="Eliminar"
                    style={{
                      background: '#FDEAE9', border: 'none', borderRadius: 8,
                      width: 32, height: 32, cursor: 'pointer', fontSize: 14,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
              Eliminar cliente
            </h3>
            <p style={{ fontSize: 13, color: '#527870', marginBottom: 24 }}>
              ¿Seguro que quieres eliminar este cliente? Los estudios asociados no se eliminarán.
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

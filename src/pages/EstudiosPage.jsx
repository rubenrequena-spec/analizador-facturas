import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstudios, deleteEstudio } from '../store.js'

function fmt(num) {
  if (num == null || isNaN(num)) return '—'
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num) + ' €'
}

const ESTADOS = ['todos', 'borrador', 'enviado', 'aceptado', 'contratado', 'perdido']

const ESTADO_COLORS = {
  borrador: { bg: '#F1F5F9', color: '#64748B' },
  enviado: { bg: '#EFF6FF', color: '#3B82F6' },
  aceptado: { bg: '#EBF8EA', color: '#4A9E40' },
  contratado: { bg: '#1B2D26', color: '#6DC462' },
  perdido: { bg: '#FDEAE9', color: '#E8655D' },
}

function EstadoBadge({ estado }) {
  const colors = ESTADO_COLORS[estado] || ESTADO_COLORS.borrador
  return (
    <span style={{
      background: colors.bg, color: colors.color,
      fontSize: 11, fontWeight: 700, padding: '3px 9px',
      borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {estado}
    </span>
  )
}

export default function EstudiosPage() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [estudios, setEstudios] = useState(getEstudios)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function recargar() { setEstudios(getEstudios()) }

  function handleDelete(id) {
    deleteEstudio(id)
    recargar()
    setConfirmDelete(null)
  }

  const filtrados = estudios.filter(e => {
    const matchBusqueda =
      !busqueda ||
      (e.clienteNombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || e.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  return (
    <div>
      {/* Controles */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar cliente o proyecto..."
          style={{
            flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none', background: 'white',
          }}
        />
        <button
          onClick={() => navigate('/estudio/nuevo')}
          style={{
            background: '#4A9E40', color: 'white', border: 'none',
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ➕ Nuevo estudio
        </button>
      </div>

      {/* Filtros de estado */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ESTADOS.map(e => {
          const active = filtroEstado === e
          const colors = ESTADO_COLORS[e] || {}
          return (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              style={{
                background: active ? (colors.bg || '#1B2D26') : 'white',
                color: active ? (colors.color || 'white') : '#527870',
                border: `1.5px solid ${active ? (colors.color || '#1B2D26') : '#D8E8E4'}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
              }}
            >
              {e === 'todos' ? 'Todos' : e}
              {e !== 'todos' && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  ({estudios.filter(es => es.estado === e).length})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 16, padding: '60px 24px',
          textAlign: 'center', border: '1px solid #D8E8E4',
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 15, color: '#527870', marginBottom: 20, fontWeight: 500 }}>
            {busqueda || filtroEstado !== 'todos'
              ? 'No hay estudios que coincidan con los filtros'
              : 'Aún no hay estudios. ¡Crea tu primero!'}
          </p>
          {!busqueda && filtroEstado === 'todos' && (
            <button
              onClick={() => navigate('/estudio/nuevo')}
              style={{
                background: '#4A9E40', color: 'white', border: 'none',
                padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ➕ Crear primer estudio
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #D8E8E4', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F5F7F6' }}>
                  {['Cliente', 'Proyecto', 'Tipo', 'Ahorro/año', 'Comisión', 'Estado', 'Fecha', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: 11,
                      fontWeight: 700, color: '#527870', textTransform: 'uppercase',
                      letterSpacing: 0.5, whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e, i) => {
                  const tipo = e.analisis?.cliente?.tipo_suministro === 'gas' ? '🔥 Gas' : e.analisis ? '⚡ Luz' : '—'
                  const ahorro = e.analisis?.recomendacion?.ahorro
                  const comision = e.analisis?.recomendacion?.comision
                  return (
                    <tr
                      key={e.id}
                      style={{ borderTop: i > 0 ? '1px solid #F0F4F3' : 'none' }}
                    >
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#1B2D26' }}>
                        {e.clienteNombre || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#527870', maxWidth: 160 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {e.nombre || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#527870', whiteSpace: 'nowrap' }}>
                        {tipo}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4A9E40', whiteSpace: 'nowrap' }}>
                        {ahorro ? `+${fmt(Math.round(ahorro))}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#3A9890', whiteSpace: 'nowrap' }}>
                        {comision ? fmt(Math.round(comision)) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <EstadoBadge estado={e.estado} />
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#527870', whiteSpace: 'nowrap' }}>
                        {new Date(e.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => navigate(`/estudio/${e.id}`)}
                          title="Editar"
                          style={{
                            background: '#EBF8EA', border: 'none', borderRadius: 8,
                            width: 32, height: 32, cursor: 'pointer', fontSize: 14,
                            marginRight: 6,
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setConfirmDelete(e.id)}
                          title="Eliminar"
                          style={{
                            background: '#FDEAE9', border: 'none', borderRadius: 8,
                            width: 32, height: 32, cursor: 'pointer', fontSize: 14,
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1B2D26' }}>
              Eliminar estudio
            </h3>
            <p style={{ fontSize: 13, color: '#527870', marginBottom: 24 }}>
              Esta acción no se puede deshacer. ¿Seguro que quieres eliminarlo?
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

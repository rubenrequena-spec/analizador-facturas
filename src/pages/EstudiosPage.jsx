import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstudios, deleteEstudio, saveEstudio } from '../store.js'

function fmt(num) {
  if (num == null || isNaN(num)) return '—'
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num) + ' €'
}

function timeAgo(isoDate) {
  if (!isoDate) return ''
  const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000)
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `hace ${Math.floor(diff / 86400)}d`
  return new Date(isoDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

const COLUMNAS = [
  { id: 'borrador',    label: 'Borrador',    icon: '📝', color: '#64748B', light: '#F1F5F9', border: '#CBD5E1' },
  { id: 'enviado',     label: 'Enviado',     icon: '📤', color: '#2563EB', light: '#EFF6FF', border: '#BFDBFE' },
  { id: 'aceptado',   label: 'Aceptado',   icon: '✅', color: '#16a34a', light: '#F0FDF4', border: '#BBF7D0' },
  { id: 'contratado', label: 'Contratado', icon: '🤝', color: '#ffffff', light: '#1B2D26', border: '#2d4a3e' },
  { id: 'perdido',    label: 'Perdido',    icon: '❌', color: '#E8655D', light: '#FFF5F5', border: '#FECACA' },
]

// ── Tarjeta Kanban ────────────────────────────────────────────────────────────
function KanbanCard({ estudio, onDelete, onDragStart, isDragging }) {
  const navigate = useNavigate()
  const tipo = estudio.analisis?.cliente?.tipo_suministro === 'gas' ? '🔥' : estudio.analisis ? '⚡' : '—'
  const ahorro = estudio.analisis?.recomendacion?.ahorro
  const comision = estudio.analisis?.recomendacion?.comision
  const empresa = estudio.analisis?.cliente?.empresa_actual
  const num = estudio.numero ? `#${String(estudio.numero).padStart(3, '0')}` : null

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', estudio.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(estudio.id)
      }}
      style={{
        background: 'white',
        border: '1px solid #E2EAE8',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 8,
        cursor: 'grab',
        opacity: isDragging ? 0.45 : 1,
        boxShadow: isDragging ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'opacity 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}
    >
      {/* Header: número + tipo + borrar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {num && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#F0FDF4', padding: '2px 6px', borderRadius: 6 }}>
              {num}
            </span>
          )}
          <span style={{ fontSize: 12 }}>{tipo}</span>
          {empresa && (
            <span style={{ fontSize: 11, color: '#94a3b8', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {empresa}
            </span>
          )}
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(estudio.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 14, padding: '2px 4px', lineHeight: 1, borderRadius: 4 }}
          title="Eliminar"
        >
          ✕
        </button>
      </div>

      {/* Cliente */}
      <div
        onClick={() => navigate(`/estudio/${estudio.id}`)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2D26', marginBottom: 2, lineHeight: 1.3 }}>
          {estudio.clienteNombre || 'Sin nombre'}
        </div>
        {estudio.nombre && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {estudio.nombre}
          </div>
        )}

        {/* Stats */}
        {(ahorro || comision) && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {ahorro && (
              <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 8, padding: '6px 8px' }}>
                <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 700, marginBottom: 1 }}>AHORRO/AÑO</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>+{fmt(Math.round(ahorro))}</div>
              </div>
            )}
            {comision && (
              <div style={{ flex: 1, background: '#F5F7F6', borderRadius: 8, padding: '6px 8px' }}>
                <div style={{ fontSize: 9, color: '#527870', fontWeight: 700, marginBottom: 1 }}>COMISIÓN</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#3A9890' }}>{fmt(Math.round(comision))}</div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#CBD5E1' }}>{timeAgo(estudio.createdAt)}</span>
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Ver →</span>
        </div>
      </div>
    </div>
  )
}

// ── Columna Kanban ────────────────────────────────────────────────────────────
function KanbanColumn({ col, cards, dragOver, onDragOver, onDragLeave, onDrop, onDelete, onCardDragStart, dragId, busqueda }) {
  const totalAhorro = cards.reduce((s, e) => s + (e.analisis?.recomendacion?.ahorro || 0), 0)
  const totalComision = cards.reduce((s, e) => s + (e.analisis?.recomendacion?.comision || 0), 0)
  const isContratado = col.id === 'contratado'

  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(col.id) }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop(col.id) }}
      style={{
        width: 264,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 14,
        border: dragOver ? `2px solid ${isContratado ? '#22c55e' : col.color}` : '2px solid transparent',
        transition: 'border-color 0.15s',
        background: dragOver ? (isContratado ? 'rgba(34,197,94,0.06)' : col.light + 'aa') : 'transparent',
      }}
    >
      {/* Header */}
      <div style={{
        background: col.light,
        borderRadius: '12px 12px 0 0',
        padding: '12px 14px',
        border: `1px solid ${col.border}`,
        borderBottom: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{col.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: isContratado ? '#22c55e' : col.color }}>
              {col.label}
            </span>
            <span style={{
              background: isContratado ? 'rgba(34,197,94,0.2)' : `${col.color}22`,
              color: isContratado ? '#22c55e' : col.color,
              fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
            }}>
              {cards.length}
            </span>
          </div>
        </div>
        {cards.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
            {totalAhorro > 0 && (
              <span style={{ fontSize: 10, color: isContratado ? '#22c55e' : col.color, fontWeight: 600 }}>
                +{fmt(Math.round(totalAhorro))} ahorro
              </span>
            )}
            {totalComision > 0 && (
              <span style={{ fontSize: 10, color: isContratado ? 'rgba(255,255,255,0.5)' : '#94a3b8', fontWeight: 600 }}>
                {fmt(Math.round(totalComision))} com.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{
        flex: 1,
        background: '#F8FAFC',
        border: `1px solid ${col.border}`,
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        padding: '10px 10px 4px',
        minHeight: 120,
      }}>
        {cards.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 12px',
            color: '#CBD5E1', fontSize: 12, fontWeight: 500,
          }}>
            {busqueda ? 'Sin coincidencias' : 'Arrastra aquí'}
          </div>
        ) : (
          cards.map(e => (
            <KanbanCard
              key={e.id}
              estudio={e}
              onDelete={onDelete}
              onDragStart={onCardDragStart}
              isDragging={dragId === e.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function EstudiosPage() {
  const navigate = useNavigate()
  const [estudios, setEstudios] = useState(getEstudios)
  const [busqueda, setBusqueda] = useState('')
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function recargar() { setEstudios(getEstudios()) }

  function handleDrop(nuevoEstado) {
    if (!dragId) return
    const estudio = estudios.find(e => e.id === dragId)
    if (estudio && estudio.estado !== nuevoEstado) {
      saveEstudio({ ...estudio, estado: nuevoEstado })
      recargar()
    }
    setDragId(null)
    setDragOver(null)
  }

  function handleDelete(id) {
    deleteEstudio(id)
    recargar()
    setConfirmDelete(null)
  }

  const filtrados = estudios.filter(e =>
    !busqueda ||
    (e.clienteNombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.analisis?.cliente?.empresa_actual || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  // Totales globales
  const totalAhorro = estudios.reduce((s, e) => s + (e.analisis?.recomendacion?.ahorro || 0), 0)
  const totalComision = estudios.reduce((s, e) => s + (e.analisis?.recomendacion?.comision || 0), 0)
  const contratados = estudios.filter(e => e.estado === 'contratado').length

  return (
    <div style={{ height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar cliente, proyecto o empresa..."
          style={{
            flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10,
            border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none', background: 'white',
          }}
        />
        <button
          onClick={() => navigate('/estudio/nuevo')}
          style={{
            background: '#16a34a', color: 'white', border: 'none',
            padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          ➕ Nuevo estudio
        </button>
      </div>

      {/* Stats rápidas */}
      {estudios.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { label: 'Total estudios', value: estudios.length, color: '#1B2D26' },
            { label: 'Contratados', value: contratados, color: '#16a34a' },
            { label: 'Ahorro generado', value: totalAhorro > 0 ? '+' + fmt(Math.round(totalAhorro)) : '—', color: '#16a34a' },
            { label: 'Comisiones', value: totalComision > 0 ? fmt(Math.round(totalComision)) : '—', color: '#3A9890' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 10, padding: '8px 14px',
              border: '1px solid #E2EAE8', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Kanban board */}
      <div
        onDragEnd={() => { setDragId(null); setDragOver(null) }}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 16,
          alignItems: 'flex-start',
          minHeight: 420,
        }}
      >
        {COLUMNAS.map(col => (
          <KanbanColumn
            key={col.id}
            col={col}
            cards={filtrados.filter(e => e.estado === col.id)}
            dragOver={dragOver === col.id}
            dragId={dragId}
            busqueda={busqueda}
            onDragOver={colId => setDragOver(colId)}
            onDragLeave={() => setDragOver(null)}
            onDrop={handleDrop}
            onDelete={id => setConfirmDelete(id)}
            onCardDragStart={id => setDragId(id)}
          />
        ))}
      </div>

      {/* Instrucción drag */}
      {estudios.length > 0 && (
        <p style={{ fontSize: 11, color: '#CBD5E1', textAlign: 'center', marginTop: 4 }}>
          Arrastra las tarjetas entre columnas para cambiar el estado
        </p>
      )}

      {/* Empty state total */}
      {estudios.length === 0 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '60px 24px',
          textAlign: 'center', border: '1px solid #D8E8E4',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 15, color: '#527870', marginBottom: 20, fontWeight: 500 }}>
            Aún no hay estudios. ¡Crea el primero!
          </p>
          <button
            onClick={() => navigate('/estudio/nuevo')}
            style={{
              background: '#16a34a', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ➕ Crear primer estudio
          </button>
        </div>
      )}

      {/* Modal confirmación borrar */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', textAlign: 'center' }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1B2D26' }}>Eliminar estudio</h3>
            <p style={{ fontSize: 13, color: '#527870', marginBottom: 24 }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, background: '#F5F7F6', border: '1px solid #D8E8E4', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#527870' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ flex: 1, background: '#E8655D', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'white' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        [draggable=true]:active { cursor: grabbing; }
      `}</style>
    </div>
  )
}

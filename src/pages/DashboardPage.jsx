import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstudios } from '../store.js'
import { useAuth } from '../auth.js'

function fmt(num) {
  if (num == null) return '—'
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num) + ' €'
}

const ESTADO_COLORS = {
  borrador: { bg: '#F1F5F9', color: '#64748B' },
  enviado: { bg: '#EFF6FF', color: '#3B82F6' },
  aceptado: { bg: '#EBF8EA', color: '#16a34a' },
  contratado: { bg: '#1B2D26', color: '#22c55e' },
  perdido: { bg: '#FDEAE9', color: '#E8655D' },
}

function EstadoBadge({ estado }) {
  const colors = ESTADO_COLORS[estado] || ESTADO_COLORS.borrador
  return (
    <span style={{
      background: colors.bg, color: colors.color,
      fontSize: 11, fontWeight: 700, padding: '3px 9px',
      borderRadius: 20, textTransform: 'capitalize',
    }}>
      {estado}
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const estudios = getEstudios()

  const now = new Date()
  const estudiosMes = estudios.filter(e => {
    const d = new Date(e.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const ahorroTotal = estudios.reduce((sum, e) => {
    const ahorro = e.analisis?.recomendacion?.ahorro || 0
    return sum + ahorro
  }, 0)

  const comisionTotal = estudios.reduce((sum, e) => {
    const comision = e.analisis?.recomendacion?.comision || 0
    return sum + comision
  }, 0)

  const ultimos = estudios.slice(0, 5)

  const kpis = [
    { label: 'Total estudios', value: estudios.length, icon: '📁', color: '#55B8B0', bg: '#E3F5F3' },
    { label: 'Este mes', value: estudiosMes.length, icon: '📅', color: '#22c55e', bg: '#EBF8EA' },
    { label: 'Ahorro total calculado', value: fmt(Math.round(ahorroTotal)), icon: '💰', color: '#16a34a', bg: '#EBF8EA' },
    { label: 'Comisiones estimadas', value: fmt(Math.round(comisionTotal)), icon: '📈', color: '#3A9890', bg: '#E3F5F3' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2D26' }}>
            Hola, {profile?.full_name || profile?.email} 👋
          </h2>
          <p style={{ fontSize: 13, color: '#527870', marginTop: 2 }}>
            Aquí tienes el resumen de tu actividad
          </p>
        </div>
        <button
          onClick={() => navigate('/estudio/nuevo')}
          style={{
            background: '#16a34a', color: 'white', border: 'none',
            padding: '12px 20px', borderRadius: 12, fontSize: 14,
            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          ➕ Nuevo estudio
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{
            background: 'white', borderRadius: 16, padding: '20px',
            border: '1px solid #D8E8E4', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: kpi.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#527870', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Últimos estudios */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #D8E8E4', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #D8E8E4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2D26' }}>Últimos estudios</h3>
          <button
            onClick={() => navigate('/estudios')}
            style={{ background: 'none', border: 'none', fontSize: 13, color: '#55B8B0', cursor: 'pointer', fontWeight: 600 }}
          >
            Ver todos →
          </button>
        </div>

        {ultimos.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 14, color: '#527870', marginBottom: 16 }}>
              Aún no hay estudios. ¡Crea tu primero!
            </p>
            <button
              onClick={() => navigate('/estudio/nuevo')}
              style={{
                background: '#16a34a', color: 'white', border: 'none',
                padding: '12px 24px', borderRadius: 10, fontSize: 14,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              ➕ Nuevo estudio
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F5F7F6' }}>
                  {['Cliente', 'Proyecto', 'Tipo', 'Ahorro/año', 'Estado', 'Fecha'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 11,
                      fontWeight: 700, color: '#527870', textTransform: 'uppercase',
                      letterSpacing: 0.5, whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ultimos.map((e, i) => {
                  const tipo = e.analisis?.cliente?.tipo_suministro === 'gas' ? '🔥 Gas' : '⚡ Luz'
                  const ahorro = e.analisis?.recomendacion?.ahorro
                  return (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/estudio/${e.id}`)}
                      style={{
                        borderTop: i > 0 ? '1px solid #F0F4F3' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={ev => ev.currentTarget.style.background = '#F5F7F6'}
                      onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1B2D26' }}>
                        {e.clienteNombre || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#527870' }}>
                        {e.nombre || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#527870' }}>
                        {e.analisis ? tipo : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                        {ahorro ? `+${fmt(Math.round(ahorro))}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <EstadoBadge estado={e.estado} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#527870', whiteSpace: 'nowrap' }}>
                        {new Date(e.createdAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

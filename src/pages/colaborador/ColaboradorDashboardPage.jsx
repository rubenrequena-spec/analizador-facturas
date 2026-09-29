import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth.js'
import { supabase } from '../../supabase.js'
import FilaEnvio from './FilaEnvio.jsx'

const COLORS = { dark: '#1B2D26', green: '#16a34a', muted: '#527870', border: '#D8E8E4', bg: '#F5F7F6' }

export default function ColaboradorDashboardPage() {
  const { colaborador } = useAuth()
  const navigate = useNavigate()
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

  const porEstado = { nuevo: 0, en_tramite: 0, completado: 0 }
  for (const d of docs) porEstado[d.estado] = (porEstado[d.estado] || 0) + 1

  const kpis = [
    { label: 'Total enviados', value: docs.length, icon: '📋', color: '#55B8B0', bg: '#E3F5F3' },
    { label: 'Nuevos', value: porEstado.nuevo, icon: '🆕', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'En trámite', value: porEstado.en_tramite, icon: '⏳', color: '#B45309', bg: '#FEF3C7' },
    { label: 'Completados', value: porEstado.completado, icon: '✅', color: '#16a34a', bg: '#EBF8EA' },
  ]

  const accesos = [
    { to: '/colaborador/enviar', label: 'Enviar documentación', desc: 'Sube el contrato o los documentos de un cliente', icon: '📎' },
    { to: '/colaborador/calculadora', label: 'Calculadora de facturas', desc: 'Sube una factura y ve el ahorro estimado', icon: '🧮' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.dark }}>
          Hola, {colaborador?.nombre_comercial} 👋
        </h2>
        <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
          Aquí tienes el resumen de tu actividad
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{
            background: 'white', borderRadius: 16, padding: 20,
            border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: kpi.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {accesos.map(a => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            style={{
              background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20,
              textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start',
            }}
          >
            <div style={{ fontSize: 24 }}>{a.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark, marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>{a.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.dark }}>Últimos envíos</h3>
          <button
            onClick={() => navigate('/colaborador/envios')}
            style={{ background: 'none', border: 'none', fontSize: 13, color: '#55B8B0', cursor: 'pointer', fontWeight: 600 }}
          >
            Ver todos →
          </button>
        </div>
        {loading ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Cargando…</div>
        ) : docs.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 14 }}>Aún no has enviado nada.</p>
            <button
              onClick={() => navigate('/colaborador/enviar')}
              style={{ background: COLORS.green, color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              📎 Enviar documentación
            </button>
          </div>
        ) : (
          docs.slice(0, 5).map((d, i) => <FilaEnvio key={d.id} envio={d} bordered={i > 0} />)
        )}
      </div>
    </div>
  )
}

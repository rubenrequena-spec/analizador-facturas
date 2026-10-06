import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.js'
import { supabase, abrirDocumento } from '../supabase.js'
import { ESTADO_LABEL, ESTADO_COLOR } from './colaborador/FilaEnvio.jsx'

const ORIGEN_LABEL = { inmobiliaria: 'Inmobiliaria', colaborador: 'Colaborador', directo: 'Cliente directo' }

// RLS decide qué filas llegan: el comercial solo las suyas, el admin todas.
export default function ContratosPage() {
  const { isAdmin } = useAuth()
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('contratos')
      .select('*, comercial:profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setContratos(data || [])
        setLoading(false)
      })
  }, [])

  async function handleEstado(c, estado) {
    setContratos(prev => prev.map(x => (x.id === c.id ? { ...x, estado } : x)))
    await supabase.from('contratos').update({ estado }).eq('id', c.id)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #D8E8E4', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #D8E8E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2D26' }}>
            📝 {isAdmin ? 'Contratos' : 'Mis contratos'} ({contratos.length})
          </h3>
          <Link
            to="/contratos/nuevo"
            style={{ background: '#16a34a', color: 'white', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
          >
            ➕ Nuevo contrato
          </Link>
        </div>
        {loading ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#527870', fontSize: 13 }}>Cargando…</div>
        ) : contratos.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#527870', fontSize: 13 }}>
            Todavía no hay contratos. Pulsa "Nuevo contrato" para subir el primero.
          </div>
        ) : (
          contratos.map((c, i) => {
            const color = ESTADO_COLOR[c.estado] || ESTADO_COLOR.nuevo
            return (
              <div key={c.id} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid #F0F4F3' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2D26' }}>
                      {c.cliente}{c.servicio && ` · ${c.servicio}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#527870', marginTop: 2 }}>
                      {ORIGEN_LABEL[c.origen]}{c.origen_nombre && `: ${c.origen_nombre}`}
                      {(c.telefono || c.email) && ' · '}
                      {[c.telefono, c.email].filter(Boolean).join(' · ')}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(c.created_at).toLocaleString('es-ES')}
                      {isAdmin && c.comercial && ` · ${c.comercial.full_name || c.comercial.email}`}
                    </div>
                  </div>
                  {isAdmin ? (
                    <select
                      value={c.estado}
                      onChange={e => handleEstado(c, e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #D8E8E4', fontSize: 13, fontWeight: 600, color: '#1B2D26', background: 'white' }}
                    >
                      {Object.entries(ESTADO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: color.bg, color: color.color }}>
                      {ESTADO_LABEL[c.estado] || c.estado}
                    </span>
                  )}
                </div>
                {c.notas && (
                  <div style={{ fontSize: 13, color: '#1B2D26', marginTop: 10, background: '#F5F7F6', borderRadius: 8, padding: '8px 12px' }}>
                    {c.notas}
                  </div>
                )}
                {Array.isArray(c.archivos) && c.archivos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {c.archivos.map((a, j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => abrirDocumento(a.path)}
                        style={{ border: 'none', cursor: 'pointer', fontSize: 12, color: '#16a34a', fontWeight: 600, background: '#EBF8EA', borderRadius: 8, padding: '6px 10px' }}
                      >
                        📎 {a.nombre || `documento ${j + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

import React from 'react'

export const ESTADO_LABEL = { nuevo: 'Nuevo', en_tramite: 'En trámite', completado: 'Completado' }
export const ESTADO_COLOR = {
  nuevo: { bg: '#EFF6FF', color: '#3B82F6' },
  en_tramite: { bg: '#FEF3C7', color: '#B45309' },
  completado: { bg: '#EBF8EA', color: '#16a34a' },
}

export default function FilaEnvio({ envio, bordered = true }) {
  const c = ESTADO_COLOR[envio.estado] || ESTADO_COLOR.nuevo
  return (
    <div style={{ padding: '14px 20px', borderTop: bordered ? '1px solid #F0F4F3' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 12, color: '#527870' }}>
          {new Date(envio.created_at).toLocaleString('es-ES')}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color }}>
          {ESTADO_LABEL[envio.estado] || envio.estado}
        </span>
      </div>
      {envio.notas && <div style={{ fontSize: 13, color: '#1B2D26', marginTop: 6 }}>{envio.notas}</div>}
      {Array.isArray(envio.archivos) && envio.archivos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {envio.archivos.map((a, j) => (
            <a key={j} href={a.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, textDecoration: 'none', background: '#EBF8EA', borderRadius: 8, padding: '5px 9px' }}>
              📎 {a.nombre || `documento ${j + 1}`}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

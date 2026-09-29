import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabase.js'
import FilaEnvio from './FilaEnvio.jsx'

const COLORS = { muted: '#527870', border: '#D8E8E4' }

export default function ColaboradorEnviosPage() {
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

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', background: 'white', borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
      {loading ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Cargando…</div>
      ) : docs.length === 0 ? (
        <div style={{ padding: '32px 24px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Todavía no has enviado nada.</div>
      ) : (
        docs.map((d, i) => <FilaEnvio key={d.id} envio={d} bordered={i > 0} />)
      )}
    </div>
  )
}

import React, { useRef, useState } from 'react'

const COLORS = { dark: '#1B2D26', green: '#16a34a', muted: '#527870', border: '#D8E8E4', bg: '#F5F7F6', red: '#E8655D' }

function fmt(num) {
  if (num == null) return '—'
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num) + ' €'
}

export default function ColaboradorCalculadoraPage() {
  const [file, setFile] = useState(null)
  const [base64, setBase64] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)

  function handleFile(f) {
    setFile(f)
    setMediaType(f.type || 'image/jpeg')
    setError('')
    setResultado(null)
    const reader = new FileReader()
    reader.onload = e => setBase64(e.target.result.split(',')[1])
    reader.readAsDataURL(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  async function analizar() {
    if (!base64) return
    setLoading(true)
    setError('')
    setResultado(null)
    try {
      const res = await fetch('/api/analyze-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType, fileName: file?.name }),
      })
      if (!res.ok) {
        let errDetail = `Error ${res.status}`
        try { const b = await res.json(); errDetail = b.details || b.error || errDetail } catch (_) {}
        throw new Error(errDetail)
      }
      const data = await res.json()
      setResultado(data)
    } catch (err) {
      setError(err.message || 'No se pudo analizar la factura.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setBase64(null)
    setResultado(null)
    setError('')
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16 }}>
        Sube la factura de luz o gas de tu cliente y verás el ahorro estimado con las mejores tarifas disponibles — útil para enseñárselo antes de tramitar nada.
      </p>

      {!resultado && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'white', borderRadius: 16, border: `2px dashed ${dragOver ? COLORS.green : COLORS.border}`,
            padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
          />
          <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
          {file ? (
            <p style={{ fontSize: 14, color: COLORS.dark, fontWeight: 600 }}>{file.name}</p>
          ) : (
            <>
              <p style={{ fontSize: 14, color: COLORS.dark, fontWeight: 600, marginBottom: 4 }}>Arrastra la factura aquí o haz clic</p>
              <p style={{ fontSize: 12, color: COLORS.muted }}>PDF o imagen</p>
            </>
          )}
        </div>
      )}

      {file && !resultado && (
        <button
          onClick={analizar}
          disabled={loading}
          style={{
            width: '100%', marginTop: 16, background: loading ? '#94a3b8' : COLORS.green, color: 'white', border: 'none',
            padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Analizando…' : 'Analizar factura'}
        </button>
      )}

      {error && <div style={{ marginTop: 12, fontSize: 13, color: COLORS.red }}>{error}</div>}

      {resultado && (
        <div>
          <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, marginBottom: 4 }}>COSTE ACTUAL ESTIMADO</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.dark }}>{fmt(resultado.coste_actual_anual)}<span style={{ fontSize: 13, fontWeight: 500, color: COLORS.muted }}> /año</span></div>
          </div>

          {(resultado.opciones || []).map((op, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.dark }}>Opción {op.posicion}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#EBF8EA', color: COLORS.green }}>
                  Ahorra {fmt(op.ahorro_anual)}/año
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.dark, marginBottom: 4 }}>{fmt(op.coste_anual_estimado)} <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.muted }}>/año estimado</span></div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Ahorro mensual aproximado: {fmt(op.ahorro_mensual)}</div>
              {op.nota && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, fontStyle: 'italic' }}>{op.nota}</div>}
            </div>
          ))}

          <button
            onClick={reset}
            style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.muted, padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Analizar otra factura
          </button>
        </div>
      )}
    </div>
  )
}

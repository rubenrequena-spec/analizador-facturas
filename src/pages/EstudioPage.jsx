import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEstudios, saveEstudio, getClientes } from '../store.js'

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(num) {
  if (num == null || isNaN(num)) return '—'
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num) + ' €'
}

function limpiarTexto(txt) {
  if (!txt) return txt
  return txt.replace(/[Gg]ual[uú]/g, 'nuestra red comercial')
}

const LOADING_MSGS = [
  'Leyendo tu factura...',
  'Comparando con todas las tarifas...',
  'Calculando comisiones...',
  'Preparando el informe...',
]

// ── Componente ResultadoAnalisis ──────────────────────────────────────────────
function ResultadoAnalisis({ data, estudioId, onGuardado }) {
  const navigate = useNavigate()
  const clientes = getClientes()
  const [showComisiones, setShowComisiones] = useState(true)
  const [showAdvertencias, setShowAdvertencias] = useState(false)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [nombreProyecto, setNombreProyecto] = useState('')
  const [estado, setEstado] = useState('borrador')
  const [guardado, setGuardado] = useState(false)

  const c = data.cliente || {}
  const rec = data.recomendacion || {}
  const opciones = data.opciones || []
  const advertencias = data.advertencias || []

  const costeMensualActual = c.coste_actual_anual_con_iva ? Math.round(c.coste_actual_anual_con_iva / 12) : null
  const precioKwhActual = c.precio_energia_kwh ? Number(c.precio_energia_kwh).toFixed(4) : null
  const nuevoCosto = (c.coste_actual_anual_con_iva && rec.ahorro) ? Math.round(c.coste_actual_anual_con_iva - rec.ahorro) : null
  const costeMensualNuevo = nuevoCosto ? Math.round(nuevoCosto / 12) : null
  const precioKwhNuevo = (nuevoCosto && c.consumo_anual_kwh) ? (nuevoCosto / c.consumo_anual_kwh).toFixed(3) : null

  function handleGuardar() {
    const estudio = {
      id: estudioId || 'estudio-' + Date.now(),
      nombre: nombreProyecto,
      clienteNombre,
      clienteId: clienteId || null,
      analisis: data,
      estado,
    }
    saveEstudio(estudio)
    setGuardado(true)
    if (onGuardado) onGuardado(estudio)
  }

  function generarMensaje() {
    const tipo = c.tipo_suministro === 'gas' ? 'gas' : 'luz'
    const actual = c.coste_actual_anual_con_iva ? Math.round(c.coste_actual_anual_con_iva) + '€/año' : '—'
    const ahorro = rec.ahorro ? Math.round(rec.ahorro) + '€' : '—'
    const compania = rec.compania || '—'
    const tarifa = rec.tarifa || ''
    const permLinea = c.permanencia ? `\n⚠️ Permanencia hasta: ${c.permanencia}` : ''
    const tieneAhorro = rec.ahorro && rec.ahorro > 0
    const ahorroLinea = tieneAhorro
      ? `💰 Ahorro estimado: *+${ahorro} al año*`
      : `📋 Hemos encontrado una opción más adecuada para tu perfil de consumo`
    return `🌿 *Análisis de factura — Finanzas Healthy*

Hola 👋 He revisado tu factura de *${tipo}* y esto es lo que encontré:

⚡ *Tu situación actual*
• Compañía: ${c.empresa_actual || '—'}
• Coste actual: *${actual}*${permLinea}

✅ *Nuestra recomendación*
• ${compania}${tarifa ? ' · ' + tarifa : ''}
${ahorroLinea}

🔄 El cambio es *gratuito*, sin permanencia y lo gestionamos nosotros de principio a fin.

¿Te interesa? Cualquier duda estoy a tu disposición 😊`
  }

  function buildClientReport() {
    const tipo = c.tipo_suministro === 'gas' ? '🔥 Gas' : '⚡ Luz'
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Informe energético — Finanzas Healthy</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F7F6; color: #1B2D26; padding: 24px; }
  .card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 1px solid #D8E8E4; }
  .badge { display: inline-block; background: #FEF2D5; color: #7a5520; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-bottom: 10px; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #F0F4F3; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .label { color: #527870; }
  .val { font-weight: 600; }
  .rec { background: linear-gradient(135deg, #3A9890, #6DC462); color: white; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .rec-title { font-size: 10px; opacity: 0.75; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
  .rec-name { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
  .rec-tarifa { font-size: 13px; opacity: 0.85; margin-bottom: 14px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat { background: rgba(255,255,255,0.18); border-radius: 10px; padding: 12px; }
  .stat-l { font-size: 10px; opacity: 0.75; margin-bottom: 4px; }
  .stat-v { font-size: 20px; font-weight: 800; }
  .motivo { font-size: 12px; opacity: 0.85; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); }
  .nota { font-size: 11px; color: #7a5520; background: #FEF2D5; border-radius: 10px; padding: 12px; margin-top: 12px; }
  h1 { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
  p.sub { font-size: 13px; color: #527870; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>🌿 Informe Energético</h1>
<p class="sub">Elaborado por Finanzas Healthy</p>

<div class="card">
  <div class="badge">SITUACIÓN ACTUAL</div>
  <div class="row"><span class="label">Compañía</span><span class="val">${c.empresa_actual || '—'}</span></div>
  <div class="row"><span class="label">Tipo de suministro</span><span class="val">${tipo} · ${c.tipo_acceso || '—'}</span></div>
  <div class="row"><span class="label">Consumo anual</span><span class="val">${c.consumo_anual_kwh ? c.consumo_anual_kwh.toLocaleString('es-ES') + ' kWh' : '—'}</span></div>
  ${c.potencia_p1_kw ? `<div class="row"><span class="label">Potencia contratada</span><span class="val">${c.potencia_p1_kw} kW</span></div>` : ''}
  ${precioKwhActual ? `<div class="row"><span class="label">Precio energía/kWh</span><span class="val">${precioKwhActual} €/kWh</span></div>` : ''}
  <div class="row"><span class="label">Coste actual/año</span><span class="val" style="color:#E8655D;font-size:17px">${fmt(c.coste_actual_anual_con_iva)}</span></div>
  ${costeMensualActual ? `<div class="row"><span class="label">Equivalente mensual</span><span class="val">≈ ${fmt(costeMensualActual)}/mes</span></div>` : ''}
  ${c.permanencia ? `<div class="row"><span class="label">Permanencia</span><span class="val" style="color:#E8655D">⚠️ Sí, hasta ${c.permanencia}</span></div>` : ''}
</div>

${rec.compania ? `<div class="rec">
  <div class="rec-title">⭐ RECOMENDACIÓN PARA TI</div>
  <div class="rec-name">${rec.compania}</div>
  <div class="rec-tarifa">${rec.tarifa || ''}</div>
  <div class="stat-grid">
    <div class="stat">
      <div class="stat-l">Ahorro estimado/año</div>
      <div class="stat-v">${fmt(rec.ahorro)}</div>
    </div>
    ${nuevoCosto ? `<div class="stat">
      <div class="stat-l">Nuevo coste estimado</div>
      <div class="stat-v">${fmt(nuevoCosto)}/año</div>
    </div>` : ''}
  </div>
  ${rec.motivo ? `<div class="motivo">${limpiarTexto(rec.motivo)}</div>` : ''}
</div>` : ''}

<div class="nota">⚠️ Los datos son estimados basados en la factura analizada. El ahorro real puede variar según el perfil de consumo real y condiciones del contrato.</div>
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) {
      setTimeout(() => { win.print(); URL.revokeObjectURL(url) }, 800)
    }
  }

  const cardStyle = {
    background: 'white', borderRadius: 16, padding: '18px 20px',
    marginBottom: 14, border: '1px solid #D8E8E4',
  }

  const rowStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 0', borderBottom: '1px solid #F0F4F3', fontSize: 13,
  }

  return (
    <div>
      {/* Toggle comisiones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={() => setShowComisiones(!showComisiones)}
          title={showComisiones ? 'Ocultar comisiones' : 'Mostrar comisiones'}
          style={{
            background: showComisiones ? '#EBF8EA' : 'white',
            border: `1.5px solid ${showComisiones ? '#4A9E40' : '#D8E8E4'}`,
            borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {showComisiones ? '🙈' : '👁️'}
        </button>
      </div>

      {/* Situación actual */}
      <div style={cardStyle}>
        <div style={{
          display: 'inline-block', background: '#FEF2D5', color: '#7a5520',
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, marginBottom: 10,
        }}>
          SITUACIÓN ACTUAL
        </div>
        {[
          ['Compañía', c.empresa_actual || '—'],
          ['Tipo', `${c.tipo_suministro === 'gas' ? '🔥 Gas' : '⚡ Luz'} · ${c.tipo_acceso || '—'}`],
          ['Consumo anual', c.consumo_anual_kwh ? c.consumo_anual_kwh.toLocaleString('es-ES') + ' kWh' : '—'],
          c.potencia_p1_kw ? ['Potencia', c.potencia_p1_kw + ' kW'] : null,
          precioKwhActual ? ['Precio energía/kWh', precioKwhActual + ' €/kWh'] : null,
        ].filter(Boolean).map(([label, val]) => (
          <div key={label} style={rowStyle}>
            <span style={{ color: '#527870' }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{val}</span>
          </div>
        ))}
        <div style={rowStyle}>
          <span style={{ color: '#527870' }}>Permanencia</span>
          <span style={{ fontWeight: 600, color: c.permanencia ? '#E8655D' : '#4A9E40' }}>
            {c.permanencia ? `⚠️ Sí · hasta ${c.permanencia}` : '✓ NO'}
          </span>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={{ color: '#527870' }}>Lo que paga ahora</span>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#E8655D' }}>
            {fmt(c.coste_actual_anual_con_iva)}/año
          </span>
        </div>
        {costeMensualActual && (
          <div style={{ ...rowStyle, borderBottom: 'none', opacity: 0.7, marginTop: -4 }}>
            <span style={{ color: '#527870', fontSize: 11 }}>Equivalente mensual</span>
            <span style={{ fontWeight: 600, fontSize: 12 }}>≈ {fmt(costeMensualActual)}/mes</span>
          </div>
        )}
      </div>

      {/* Recomendación */}
      {rec.compania && (
        <div style={{
          background: 'linear-gradient(135deg, #3A9890, #6DC462)',
          color: 'white', borderRadius: 16, padding: '18px 20px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', marginBottom: 6 }}>
            ⭐ RECOMENDACIÓN
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 3 }}>{rec.compania}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 14 }}>{rec.tarifa}</div>

          {nuevoCosto && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px',
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 2 }}>Paga ahora</div>
                <div style={{ fontSize: 16, fontWeight: 700, textDecoration: 'line-through', opacity: 0.7 }}>
                  {fmt(c.coste_actual_anual_con_iva)}
                </div>
                {costeMensualActual && (
                  <div style={{ fontSize: 10, opacity: 0.6 }}>≈ {fmt(costeMensualActual)}/mes</div>
                )}
              </div>
              <div style={{ fontSize: 20, opacity: 0.6 }}>→</div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 2 }}>Nuevo coste/año</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(nuevoCosto)}</div>
                {costeMensualNuevo && (
                  <div style={{ fontSize: 10, opacity: 0.75 }}>≈ {fmt(costeMensualNuevo)}/mes</div>
                )}
              </div>
            </div>
          )}

          {precioKwhActual && precioKwhNuevo && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[
                ['Precio actual/kWh', precioKwhActual + ' €', true],
                ['Precio nuevo/kWh', precioKwhNuevo + ' €', false],
              ].map(([label, val, strikethrough]) => (
                <div key={label} style={{
                  flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 8,
                  padding: '7px 10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, textDecoration: strikethrough ? 'line-through' : 'none', opacity: strikethrough ? 0.7 : 1 }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 4 }}>Ahorro cliente/año</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(rec.ahorro)}</div>
            </div>
            {showComisiones && (
              <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 4 }}>Rentabilidad aprox.</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(rec.comision)}</div>
              </div>
            )}
          </div>
          {rec.motivo && (
            <div style={{
              fontSize: 12, opacity: 0.85, marginTop: 12, paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.2)',
            }}>
              {limpiarTexto(rec.motivo)}
            </div>
          )}
        </div>
      )}

      {/* Todas las opciones */}
      {opciones.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#527870', margin: '18px 0 10px' }}>
            Todas las opciones
          </div>
          {opciones.map((op, i) => {
            const esTop = i === 0
            const ahorroPos = op.ahorro_anual > 0
            const costeMensualOp = op.coste_anual_estimado ? Math.round(op.coste_anual_estimado / 12) : null
            const retroLabel = op.retrocomision_meses_sin_riesgo != null
              ? (op.retrocomision_meses_sin_riesgo === 0
                ? '⚠️ Retrocomisión: riesgo año completo'
                : `⏱ Retrocomisión: garantizada a partir del mes ${op.retrocomision_meses_sin_riesgo}`)
              : null
            return (
              <div key={i} style={{
                background: 'white', borderRadius: 16, padding: '14px 18px', marginBottom: 10,
                border: esTop ? '2px solid #4A9E40' : '1px solid #D8E8E4',
              }}>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px',
                  borderRadius: 20, marginBottom: 8,
                  background: esTop ? '#4A9E40' : '#D8E8E4',
                  color: esTop ? 'white' : '#527870',
                }}>
                  {esTop ? '🏆 Mejor ahorro' : `#${op.posicion}`}
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{op.compania}</div>
                    <div style={{ fontSize: 12, color: '#527870', marginTop: 2 }}>{op.tarifa}</div>
                  </div>
                  <span style={{
                    background: ahorroPos ? '#EBF8EA' : '#FDEAE9',
                    color: ahorroPos ? '#4A9E40' : '#E8655D',
                    fontSize: 14, fontWeight: 800, padding: '5px 10px', borderRadius: 10,
                  }}>
                    {ahorroPos ? '+' : ''}{fmt(op.ahorro_anual)}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#F5F7F6', borderRadius: 10, padding: 9 }}>
                    <div style={{ fontSize: 10, color: '#527870', marginBottom: 2 }}>Coste est./año</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(op.coste_anual_estimado)}</div>
                    {costeMensualOp && (
                      <div style={{ fontSize: 10, color: '#527870', marginTop: 2 }}>≈ {fmt(costeMensualOp)}/mes</div>
                    )}
                  </div>
                  {showComisiones && (
                    <div style={{ background: '#F5F7F6', borderRadius: 10, padding: 9 }}>
                      <div style={{ fontSize: 10, color: '#527870', marginBottom: 2 }}>Rentabilidad aprox.</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#4A9E40' }}>{fmt(op.comision_total)}</div>
                    </div>
                  )}
                </div>
                {showComisiones && retroLabel && (
                  <div style={{ fontSize: 11, color: '#527870', marginTop: 8, paddingTop: 8, borderTop: '1px solid #D8E8E4' }}>
                    {retroLabel}
                  </div>
                )}
                {op.nota && (
                  <div style={{ fontSize: 11, color: '#527870', marginTop: 8, paddingTop: 8, borderTop: '1px solid #D8E8E4' }}>
                    {limpiarTexto(op.nota)}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* Advertencias */}
      {advertencias.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setShowAdvertencias(!showAdvertencias)}
            style={{
              width: '100%', background: '#FEF2D5', border: '1px solid #e6d5a8',
              borderRadius: showAdvertencias ? '10px 10px 0 0' : 10,
              padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#7a5520',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: showAdvertencias ? 'none' : undefined,
            }}
          >
            <span>ℹ️ Info del análisis ({advertencias.length})</span>
            <span style={{ fontSize: 11, transition: 'transform 0.25s', display: 'inline-block', transform: showAdvertencias ? 'rotate(180deg)' : 'none' }}>▼</span>
          </button>
          {showAdvertencias && (
            <div style={{
              background: '#FEF2D5', border: '1px solid #e6d5a8', borderTop: 'none',
              borderRadius: '0 0 10px 10px', overflow: 'hidden',
            }}>
              {advertencias.map((av, i) => (
                <div key={i} style={{
                  fontSize: 12, color: '#7a5520', padding: '9px 14px',
                  borderTop: i > 0 ? '1px solid rgba(176,112,48,0.15)' : 'none',
                  display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.45,
                }}>
                  <span style={{ fontWeight: 900 }}>·</span>
                  {limpiarTexto(av)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nota estimación */}
      <div style={{
        background: '#FEF2D5', border: '1px solid #e6d5a8', borderRadius: 10,
        padding: '10px 14px', marginBottom: 16, fontSize: 11, color: '#7a5520', lineHeight: 1.5,
      }}>
        ⚠️ <strong>Datos estimados.</strong> Los cálculos se basan en los datos de esta factura y pueden variar según el perfil de consumo real. Las rentabilidades comerciales son aproximadas.
      </div>

      {/* Guardar estudio */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '18px 20px',
        border: '1px solid #D8E8E4', marginBottom: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2D26', marginBottom: 14 }}>
          💾 Guardar estudio
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#527870', marginBottom: 5 }}>
              Nombre del cliente *
            </label>
            <input
              value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)}
              placeholder="Ej: Juan García"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#527870', marginBottom: 5 }}>
              Cliente existente
            </label>
            <select
              value={clienteId}
              onChange={e => {
                const sel = clientes.find(c => c.id === e.target.value)
                setClienteId(e.target.value)
                if (sel) setClienteNombre(sel.nombre)
              }}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none', background: 'white',
              }}
            >
              <option value="">— Nuevo cliente —</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` (${c.empresa})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#527870', marginBottom: 5 }}>
              Nombre del proyecto *
            </label>
            <input
              value={nombreProyecto}
              onChange={e => setNombreProyecto(e.target.value)}
              placeholder="Ej: Factura luz oct 2024"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#527870', marginBottom: 5 }}>
              Estado pipeline
            </label>
            <select
              value={estado}
              onChange={e => setEstado(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none', background: 'white',
              }}
            >
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado</option>
              <option value="aceptado">Aceptado</option>
              <option value="contratado">Contratado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleGuardar}
          disabled={!clienteNombre || !nombreProyecto}
          style={{
            width: '100%', background: (!clienteNombre || !nombreProyecto) ? '#94a3b8' : '#4A9E40',
            color: 'white', border: 'none', padding: '12px', borderRadius: 10,
            fontSize: 14, fontWeight: 700, cursor: (!clienteNombre || !nombreProyecto) ? 'not-allowed' : 'pointer',
          }}
        >
          {guardado ? '✓ Guardado' : '💾 Guardar estudio'}
        </button>
        {guardado && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#4A9E40', marginTop: 8, fontWeight: 600 }}>
            Estudio guardado correctamente
          </p>
        )}
      </div>

      {/* Botones compartir */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={buildClientReport}
          style={{
            background: 'white', border: '1.5px solid #D8E8E4', borderRadius: 12,
            padding: 13, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#1B2D26',
          }}
        >
          📄 PDF para cliente
        </button>
        <button
          onClick={() => {
            const msg = generarMensaje()
            window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')
          }}
          style={{
            background: '#25D366', color: 'white', border: 'none',
            borderRadius: 12, padding: 13, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          💬 WhatsApp
        </button>
      </div>
    </div>
  )
}

// ── Formulario manual ─────────────────────────────────────────────────────────
function FormularioManual({ onResultado }) {
  const [form, setForm] = useState({
    companiaActual: '', tipoAcceso: '2.0TD', tipoSuministro: 'electricidad',
    potenciaP1: '', potenciaP2: '', consumoAnual: '', costeActualAnual: '', precioEnergiaKwh: '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function calcular() {
    const consumo = parseFloat(form.consumoAnual) || 0
    const coste = parseFloat(form.costeActualAnual) || 0
    const precio = parseFloat(form.precioEnergiaKwh) || (coste && consumo ? coste / consumo : 0)

    const ahorroEstimado = coste * 0.15
    const nuevoCoste = coste - ahorroEstimado

    const resultado = {
      cliente: {
        empresa_actual: form.companiaActual || 'Desconocida',
        tipo_acceso: form.tipoAcceso,
        tipo_suministro: form.tipoSuministro,
        potencia_p1_kw: parseFloat(form.potenciaP1) || null,
        potencia_p2_kw: parseFloat(form.potenciaP2) || null,
        consumo_anual_kwh: consumo,
        coste_actual_anual_con_iva: coste,
        precio_energia_kwh: precio ? parseFloat(precio.toFixed(4)) : null,
        permanencia: null,
      },
      recomendacion: {
        compania: 'Oferta orientativa',
        tarifa: 'Basado en tu perfil de consumo',
        ahorro: Math.round(ahorroEstimado),
        comision: Math.round(ahorroEstimado * 0.5),
        motivo: 'Estimación orientativa basada en los datos introducidos. Sube la factura para un análisis preciso.',
      },
      opciones: [
        {
          posicion: 1,
          compania: 'Oferta estimada',
          tarifa: form.tipoAcceso,
          coste_anual_estimado: Math.round(nuevoCoste),
          ahorro_anual: Math.round(ahorroEstimado),
          comision_total: Math.round(ahorroEstimado * 0.5),
          retrocomision_meses_sin_riesgo: null,
          nota: 'Estimación orientativa — sube la factura real para un análisis preciso con tarifas actualizadas.',
        },
      ],
      advertencias: ['Este análisis es una estimación basada en datos introducidos manualmente. Para un análisis preciso, sube la factura real.'],
    }
    onResultado(resultado)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #D8E8E4', fontSize: 13, outline: 'none', background: 'white',
  }
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#527870', marginBottom: 5,
  }
  const groupStyle = { marginBottom: 14 }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={groupStyle}>
          <label style={labelStyle}>Compañía actual</label>
          <input value={form.companiaActual} onChange={e => set('companiaActual', e.target.value)} placeholder="Ej: Endesa" style={inputStyle} />
        </div>
        <div style={groupStyle}>
          <label style={labelStyle}>Tipo suministro</label>
          <select value={form.tipoSuministro} onChange={e => set('tipoSuministro', e.target.value)} style={inputStyle}>
            <option value="electricidad">Electricidad</option>
            <option value="gas">Gas</option>
          </select>
        </div>
        <div style={groupStyle}>
          <label style={labelStyle}>Tipo acceso</label>
          <select value={form.tipoAcceso} onChange={e => set('tipoAcceso', e.target.value)} style={inputStyle}>
            {['2.0TD', '3.0TD', '6.1TD', 'RL1', 'RL2', 'RL3'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={groupStyle}>
          <label style={labelStyle}>Potencia P1 (kW)</label>
          <input type="number" value={form.potenciaP1} onChange={e => set('potenciaP1', e.target.value)} placeholder="Ej: 5.75" style={inputStyle} />
        </div>
        {['2.0TD', '3.0TD'].includes(form.tipoAcceso) && (
          <div style={groupStyle}>
            <label style={labelStyle}>Potencia P2 (kW)</label>
            <input type="number" value={form.potenciaP2} onChange={e => set('potenciaP2', e.target.value)} placeholder="Ej: 5.75" style={inputStyle} />
          </div>
        )}
        <div style={groupStyle}>
          <label style={labelStyle}>Consumo anual (kWh)</label>
          <input type="number" value={form.consumoAnual} onChange={e => set('consumoAnual', e.target.value)} placeholder="Ej: 3500" style={inputStyle} />
        </div>
        <div style={groupStyle}>
          <label style={labelStyle}>Coste actual anual (€)</label>
          <input type="number" value={form.costeActualAnual} onChange={e => set('costeActualAnual', e.target.value)} placeholder="Ej: 850" style={inputStyle} />
        </div>
        <div style={groupStyle}>
          <label style={labelStyle}>Precio energía/kWh actual (€)</label>
          <input type="number" step="0.0001" value={form.precioEnergiaKwh} onChange={e => set('precioEnergiaKwh', e.target.value)} placeholder="Ej: 0.1850" style={inputStyle} />
        </div>
      </div>
      <button
        onClick={calcular}
        disabled={!form.consumoAnual || !form.costeActualAnual}
        style={{
          width: '100%', background: (!form.consumoAnual || !form.costeActualAnual) ? '#94a3b8' : '#4A9E40',
          color: 'white', border: 'none', padding: '14px', borderRadius: 12,
          fontSize: 15, fontWeight: 700, cursor: (!form.consumoAnual || !form.costeActualAnual) ? 'not-allowed' : 'pointer',
          marginTop: 4,
        }}
      >
        Calcular ahorro estimado
      </button>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function EstudioPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('factura')
  const [analisis, setAnalisis] = useState(null)
  const [estudioExistente, setEstudioExistente] = useState(null)

  // Drag & drop / file upload
  const [file, setFile] = useState(null)
  const [base64, setBase64] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Loading
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [error, setError] = useState('')

  // Cargar estudio existente si viene de /estudio/:id
  useEffect(() => {
    if (id) {
      const estudios = getEstudios()
      const found = estudios.find(e => e.id === id)
      if (found) {
        setEstudioExistente(found)
        if (found.analisis) setAnalisis(found.analisis)
      }
    }
  }, [id])

  // Rotación de mensajes de carga
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setLoadingMsg(m => (m + 1) % LOADING_MSGS.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [loading])

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function handleFile(f) {
    setFile(f)
    setMediaType(f.type || 'image/jpeg')
    setError('')
    const reader = new FileReader()
    reader.onload = e => setBase64(e.target.result.split(',')[1])
    reader.readAsDataURL(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  async function analizarFactura() {
    if (!base64) return
    setLoading(true)
    setLoadingMsg(0)
    setError('')
    setAnalisis(null)
    try {
      const res = await fetch('/api/analyze', {
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
      setAnalisis(data)
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 16px', border: 'none', borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: active ? '#4A9E40' : 'transparent',
    color: active ? 'white' : '#527870',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {estudioExistente && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/estudios')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#527870', fontSize: 13 }}
          >
            ← Volver a estudios
          </button>
          <span style={{ color: '#D8E8E4' }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2D26' }}>
            {estudioExistente.nombre || 'Estudio sin nombre'}
          </span>
          {estudioExistente.clienteNombre && (
            <span style={{ fontSize: 12, color: '#527870' }}>— {estudioExistente.clienteNombre}</span>
          )}
        </div>
      )}

      {/* Tabs */}
      {!analisis && (
        <div style={{
          display: 'flex', gap: 6, background: '#F5F7F6', borderRadius: 12,
          padding: 5, marginBottom: 20, border: '1px solid #D8E8E4',
        }}>
          <button style={tabStyle(tab === 'factura')} onClick={() => setTab('factura')}>
            📄 Subir factura
          </button>
          <button style={tabStyle(tab === 'manual')} onClick={() => setTab('manual')}>
            ✏️ Manual
          </button>
        </div>
      )}

      {/* Modo factura */}
      {!analisis && tab === 'factura' && (
        <>
          {/* Zona drag & drop */}
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: dragOver ? '#EBF8EA' : 'white',
                border: `2px dashed ${dragOver ? '#6DC462' : '#D8E8E4'}`,
                borderRadius: 16, padding: '40px 24px', textAlign: 'center',
                cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 48, display: 'block', marginBottom: 14 }}>📄</span>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: '#1B2D26' }}>
                Sube la factura del cliente
              </h2>
              <p style={{ fontSize: 13, color: '#527870', marginBottom: 20 }}>
                PDF o foto · Luz o gas · Cualquier compañía
              </p>
              <button
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                style={{
                  background: '#4A9E40', color: 'white', border: 'none',
                  padding: '13px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                📄 Seleccionar factura
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]) }}
              />
            </div>
          ) : (
            <div style={{
              background: 'white', borderRadius: 16, padding: 14, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #D8E8E4',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 10, background: '#F5F7F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
              }}>
                {file.type.startsWith('image/') ? '🖼️' : '📄'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: '#527870' }}>{formatSize(file.size)}</div>
              </div>
              <button
                onClick={() => { setFile(null); setBase64(null); setError('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#527870', padding: 4 }}
              >
                ✕
              </button>
            </div>
          )}

          {file && !loading && (
            <button
              onClick={analizarFactura}
              style={{
                width: '100%', background: '#4A9E40', color: 'white', border: 'none',
                padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
                cursor: 'pointer', marginBottom: 24,
              }}
            >
              ⚡ Analizar factura
            </button>
          )}
        </>
      )}

      {/* Modo manual */}
      {!analisis && tab === 'manual' && (
        <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid #D8E8E4', marginBottom: 16 }}>
          <FormularioManual onResultado={data => { setAnalisis(data); }} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{
            width: 44, height: 44,
            border: '4px solid #EBF8EA', borderTopColor: '#4A9E40',
            borderRadius: '50%', margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 5, color: '#1B2D26' }}>
            {LOADING_MSGS[loadingMsg]}
          </h3>
          <p style={{ fontSize: 13, color: '#527870' }}>
            Analizando con inteligencia artificial...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          background: '#FDEAE9', borderRadius: 16, padding: 18, marginBottom: 16, textAlign: 'center',
        }}>
          <h3 style={{ color: '#E8655D', fontSize: 15, marginBottom: 6 }}>⚠️ No se pudo analizar</h3>
          <p style={{ color: '#7f1d1d', fontSize: 13 }}>{error}</p>
          <button
            onClick={() => { setError(''); setFile(null); setBase64(null) }}
            style={{
              marginTop: 12, background: 'white', border: '1px solid #E8655D',
              color: '#E8655D', borderRadius: 8, padding: '8px 16px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Resultado */}
      {analisis && !loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              onClick={() => { setAnalisis(null); setFile(null); setBase64(null); setError('') }}
              style={{
                background: '#F5F7F6', border: '1px solid #D8E8E4', borderRadius: 8,
                padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#527870',
              }}
            >
              🔄 Nuevo análisis
            </button>
          </div>
          <ResultadoAnalisis
            data={analisis}
            estudioId={estudioExistente?.id}
            onGuardado={(estudio) => {
              if (!id) navigate(`/estudio/${estudio.id}`, { replace: true })
            }}
          />
        </>
      )}
    </div>
  )
}

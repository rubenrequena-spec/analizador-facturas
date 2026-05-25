// ─────────────────────────────────────────────────────────────────────────────
// TARIFAS VIGENTES — actualizar aquí cuando cambien los precios
// Última actualización: Mayo 2026
// ─────────────────────────────────────────────────────────────────────────────

export const FECHA_ACTUALIZACION = 'Mayo 2026'

// ── ELECTRICIDAD 2.0TD ───────────────────────────────────────────────────────
// Precios SIN IVA ni impuesto eléctrico
export const ELECTRICIDAD_20TD = `
ELECTRICIDAD 2.0TD — Precios sin IVA ni impuesto eléctrico:
- Endesa TEMPO:           energía 0,1196 €/kWh | P1: 44,70 €/kW/año | P2: 17,73 €/kW/año (dto 26% año 1)
- Endesa Simply:          energía 0,1626 €/kWh | P1: 38,70 €/kW/año | P2: 11,73 €/kW/año
- Endesa Open Plana:      energía 0,1532 €/kWh | P1: 38,70 €/kW/año | P2: 11,73 €/kW/año
- Gana Energía 24h:       energía 0,1190 €/kWh | P1=P2: 32,64 €/kW/año (solo Península)
- Gana Precio Mercado:    energía ~precio OMIE | P1: 27,71 €/kW/año | P2: 0,73 €/kW/año
- Naturgy Por Uso:        energía 0,1099 €/kWh | P1: 44,91 €/kW/año | P2: 13,63 €/kW/año
- Iberdrola Plan Estable: energía 0,1686 €/kWh | P1: 39,99 €/kW/año | P2: 21,99 €/kW/año
- Repsol CDR V29:         energía 0,1399 €/kWh | P1=P2: 29,90 €/kW/año
- Repsol CDR V30:         energía 0,1199 €/kWh | P1=P2: 29,89 €/kW/año
- Plenitude POWER:        energía indexada pool ~0,204 €/kWh orientativo | P1: 27,71 €/kW/año | P2: 0,73 €/kW/año
- Plenitude POWER+:       precio orientativo ~0,216 €/kWh

FÓRMULA COSTE ANUAL 2.0TD (sin IVA):
coste = (P1_kW × P1_€/año) + (P2_kW × P2_€/año) + (kWh × €/kWh)
Luego: × 1,0511 (impuesto eléctrico 5,11%) × 1,21 (IVA)
`

// ── ELECTRICIDAD 3.0TD ───────────────────────────────────────────────────────
export const ELECTRICIDAD_30TD = `
ELECTRICIDAD 3.0TD — Precios sin IVA ni impuesto eléctrico:
- Endesa Pyme Simply:       energía 0,1473 €/kWh (precio único) | P1: 21,877 €/kW/año | P2: 12,118 €/kW/año | P3: 5,982 €/kW/año | P4: 5,386 €/kW/año | P5: 4,014 €/kW/año | P6: 2,942 €/kW/año
- Endesa Pyme Open Plana:   energía 0,1389 €/kWh (precio único 24h) | P1: 21,877 €/kW/año | P2: 12,118 €/kW/año | P3: 5,982 €/kW/año | P4: 5,386 €/kW/año | P5: 4,014 €/kW/año | P6: 2,942 €/kW/año
- TotalEnergies Clásica:    energía P1:0,1982 €/kWh | P2:0,1674 €/kWh | P3:0,1275 €/kWh | P4:0,1073 €/kWh | P5:0,0989 €/kWh | P6:0,1118 €/kWh | Potencia P1:20,38 €/kW/año | P2:10,62 €/kW/año | P3:5,24 €/kW/año | P4:4,57 €/kW/año | P5:3,71 €/kW/año | P6:2,94 €/kW/año
- Iberdrola 3.0TD / Plenitude 3.0TD: sin precios disponibles

FÓRMULA COSTE ANUAL 3.0TD (sin IVA):
coste = Σ(Pi_kW × precio_Pi_€/kW/año) + Σ(Pi_kWh × precio_Pi_€/kWh)
Luego: × 1,0511 (impuesto eléctrico) × 1,21 (IVA)
Si no hay desglose de consumo por periodo: usar el precio único de energía con kWh total. Para la potencia: calcular Σ(Pi_kW × precio_Pi_€/kW/año) usando los kW contratados por periodo que aparecen en la factura (ej: 8/8/8/8/8/17,5 kW → P1:8×21,877 + P2:8×12,118 + ... + P6:17,5×2,942). Indicar "(estimación orientativa)" en advertencias.
`

// ── GAS ──────────────────────────────────────────────────────────────────────
// Precios SIN IVA ni impuesto de hidrocarburos (0,00234 €/kWh)
export const GAS = `
GAS — Precios sin IVA ni imp. hidrocarburos (0,00234 €/kWh):
- Naturgy RL1: 0,07953 €/kWh + 5,15 €/mes fijo
- Naturgy RL2: 0,07743 €/kWh + 9,15 €/mes fijo
- Naturgy RL3: 0,07399 €/kWh + 19,76 €/mes fijo
- Endesa RL1:  0,07443 €/kWh + 7,18 €/mes fijo
- Endesa RL2:  0,07128 €/kWh + 14,60 €/mes fijo
- Endesa RL3:  0,0666  €/kWh + 30,67 €/mes fijo
- Gana RL1:    (coste~0,07€) + 0,011 €/kWh + 3,93 €/mes fijo
- Gana RL2:    (coste~0,07€) + 0,006 €/kWh + 8,11 €/mes fijo
- Gana RL3:    (coste~0,07€) + 0,004 €/kWh + 18,82 €/mes fijo
- Repsol RL1:  0,08990 €/kWh + 6,90 €/mes fijo
- Repsol RL2:  0,08990 €/kWh + 11,90 €/mes fijo
- Repsol RL3:  0,08990 €/kWh + 15,90 €/mes fijo

FÓRMULA COSTE ANUAL GAS (sin IVA):
coste = (fijo_mes × 12) + (kWh × (precio_variable + 0,00234))
Luego: × 1,21 (IVA)
`

// ── COMISIONES (uso interno — no incluir en wizard público) ──────────────────
export const COMISIONES = `
=== COMISIONES ===

ELECTRICIDAD 2.0TD:
- Endesa Hogar ≤10kW: 105€ | >10kW: 170€
- Plenitude POWER: 96€ | POWER+: 73,60€ | FACIL: 70€
- Repsol V29: 72€ | Naturgy: 70€ | Gana 24h: 70€
- Iberdrola A Tu Medida Ámbito1: 70€ | Fuera ámbito: 60€
- Repsol V30: 46,80€

GAS HOGAR:
- Naturgy RL1/RL2/RL3: 70€ | Gana RL3: 70€
- Endesa gas: 65€ | Gana RL2: 50€ | Repsol gas: 46,80€ | Gana RL1: 40€

EMPRESA 3.0TD:
- Endesa Pyme 15-30kW (0-5MW consumo): 212€
- Iberdrola 20-50kW Ámbito1: 302€ | Plenitude POWER: 156,80€

COMISIONES 3.0TD — TotalEnergies Clásica (usar tier TE2 por defecto):
Consumo anual kWh | TE1  | TE2  | TE3  | TE4  | TE5
0 - 1.500         | 64€  | 94€  | 103€ | 160€ | 212€
1.501 - 3.000     | 80€  | 115€ | 126€ | 200€ | 240€
3.001 - 5.000     | 92€  | 120€ | 128€ | 240€ | 280€
5.001 - 10.000    | 121€ | 136€ | 151€ | 280€ | 320€
10.001 - 20.000   | 152€ | 201€ | 226€ | 340€ | 396€
20.001 - 30.000   | 220€ | 289€ | 326€ | 528€ | 624€
30.001 - 40.000   | 267€ | 347€ | 397€ | 620€ | 748€
40.001 - 50.000   | 316€ | 397€ | 455€ | 720€ | 936€
50.001 - 75.000   | 448€ | 523€ | 606€ | 936€ | 1200€
75.001 - 100.000  | 560€ | 679€ | 790€ | 1320€| 1360€
100.001 - 150.000 | 720€ | 856€ | 1002€| 1640€| 1840€
La retrocomisión de TotalEnergies 3.0TD es 0 meses (riesgo año completo).

RETROCOMISIÓN (meses sin riesgo):
- Endesa Hogar: 2 meses | Naturgy/Repsol Hogar: 4 meses | Gana: 3 meses
- Iberdrola 2.0TD: 2 meses | Plenitude: riesgo todo el año (0 meses)
- TotalEnergies 3.0TD: riesgo todo el año (0 meses)
- Endesa Pyme 3.0TD: 2 meses

PERMANENCIA PARA EL CLIENTE (contratos nuevos):
- Tarifas 2.0TD: sin permanencia habitual
- Tarifas 3.0TD y gas: permanencia habitual de 1 año. Indicarlo siempre en el campo "nota" de la opción.
`

// ── Bloque completo de tarifas para wizard público (sin comisiones) ───────────
export const BLOQUE_TARIFAS_PUBLICO = `
=== DATOS DE TARIFAS VIGENTES (${FECHA_ACTUALIZACION}) ===${ELECTRICIDAD_20TD}${ELECTRICIDAD_30TD}${GAS}`

// ── Bloque completo de tarifas para uso interno (con comisiones) ──────────────
export const BLOQUE_TARIFAS_INTERNO = `
=== DATOS DE TARIFAS (${FECHA_ACTUALIZACION}) ===${ELECTRICIDAD_20TD}${ELECTRICIDAD_30TD}${GAS}${COMISIONES}`

import Anthropic from "@anthropic-ai/sdk";

// Endpoint público para el wizard — mismas tarifas que la app de comerciales
// pero SIN datos internos (comisiones, retrocomisiones, etc.)

const SYSTEM_PROMPT = `Eres un asesor de ahorro energético de Finanzas Healthy. Cuando recibes una factura de energía, extraes los datos clave, calculas el coste con TODAS las tarifas disponibles y devuelves las 3 mejores opciones ordenadas por mayor ahorro.

IMPORTANTE: NO incluyas los nombres de las compañías en las opciones. El cliente verá "Opción 1, 2, 3" sin saber la compañía hasta que un asesor le contacte.

SIEMPRE responde en formato JSON con esta estructura exacta (sin texto adicional):
{
  "empresa_actual": "nombre de la compañía actual",
  "tarifa_actual": "nombre de la tarifa actual o null",
  "tipo_acceso": "2.0TD / 3.0TD / 6.1TD / RL1 / RL2 / RL3",
  "tipo_suministro": "electricidad / gas",
  "consumo_anual_kwh": número,
  "coste_actual_anual": número (coste anual CON IVA),
  "coste_actual_mensual": número (coste mensual medio CON IVA),
  "precio_energia_kwh_actual": número o null (precio medio de energía SIN potencia ni impuestos, extraído del desglose),
  "permanencia": null o "mes año" si hay penalización real por cancelación anticipada,
  "opciones": [
    {
      "posicion": 1,
      "coste_anual_estimado": número (coste anual estimado CON IVA),
      "ahorro_anual": número (ahorro anual estimado en €),
      "ahorro_mensual": número (ahorro mensual estimado en €),
      "nota": "condición relevante para el cliente (permanencia, precio indexado, etc.) o null"
    },
    { "posicion": 2, ... },
    { "posicion": 3, ... }
  ],
  "advertencias": ["advertencias relevantes para el cliente, array vacío si no hay ninguna"]
}

=== DATOS DE TARIFAS VIGENTES (Mayo 2026) ===

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

ELECTRICIDAD 3.0TD — Precios sin IVA ni impuesto eléctrico:
- Endesa Pyme Simply:    energía 0,1473 €/kWh (precio único) | P1: 21,877 €/kW/año | P2: 12,118 €/kW/año | P3: 5,982 €/kW/año | P4: 5,386 €/kW/año | P5: 4,014 €/kW/año | P6: 2,942 €/kW/año
- TotalEnergies Clásica: energía P1:0,1982 €/kWh | P2:0,1674 €/kWh | P3:0,1275 €/kWh | P4:0,1073 €/kWh | P5:0,0989 €/kWh | P6:0,1118 €/kWh | Potencia P1:20,38 €/kW/año | P2:10,62 €/kW/año | P3:5,24 €/kW/año | P4:4,57 €/kW/año | P5:3,71 €/kW/año | P6:2,94 €/kW/año
- Iberdrola 3.0TD / Plenitude 3.0TD: sin precios disponibles

FÓRMULA COSTE ANUAL 3.0TD (sin IVA):
coste = Σ(Pi_kW × precio_Pi_€/kW/año) + Σ(Pi_kWh × precio_Pi_€/kWh)
Luego: × 1,0511 (impuesto eléctrico) × 1,21 (IVA)
Si no hay desglose por periodo: usar precio único Endesa (0,1473 €/kWh) con kWh total y promedio ponderado de potencia. Indicar "(estimación orientativa)" en advertencias.

GAS — Precios sin IVA ni imp. hidrocarburos (0,00234 €/kWh):
- Naturgy RL1: 0,07953 €/kWh + 5,15 €/mes fijo
- Naturgy RL2: 0,07743 €/kWh + 9,15 €/mes fijo
- Naturgy RL3: 0,07399 €/kWh + 19,76 €/mes fijo
- Endesa RL1:  0,07443 €/kWh + 7,18 €/mes fijo
- Endesa RL2:  0,07128 €/kWh + 14,60 €/mes fijo
- Endesa RL3:  0,0666  €/kWh + 30,67 €/mes fijo
- Gana RL1:    0,07000 €/kWh + 3,93 €/mes fijo
- Gana RL2:    0,07000 €/kWh + 8,11 €/mes fijo
- Repsol RL1:  0,08990 €/kWh + 6,90 €/mes fijo
- Repsol RL2:  0,08990 €/kWh + 11,90 €/mes fijo

FÓRMULA COSTE ANUAL GAS (sin IVA):
coste = (fijo_mes × 12) + (kWh × (precio_variable + 0,00234))
Luego: × 1,21 (IVA)

=== REGLAS DE CÁLCULO Y RECOMENDACIÓN ===
1. Extrae todos los datos de la factura. Si no aparece el consumo anual, calcula desde el periodo facturado.
2. Si no aparece el coste actual anual, calcula desde el importe de la factura.
3. IMPORTANTE: compara SIEMPRE el cliente con tarifas de su mismo tipo de acceso.
   - Cliente 2.0TD → comparar SOLO con tarifas 2.0TD.
   - Cliente 3.0TD → comparar SOLO con tarifas 3.0TD (Endesa Pyme Simply y TotalEnergies Clásica).
   - Cliente gas RL1/RL2/RL3 → comparar con su tipo de acceso de gas.
   NUNCA compares un 3.0TD contra tarifas 2.0TD ni viceversa.
4. Calcula el coste estimado con CADA tarifa disponible para el tipo de acceso del cliente.
5. OPCIONES (devuelve las 3 mejores ordenadas por mayor ahorro):
   - Para 2.0TD: incluir solo tarifas de PRECIO FIJO (excluir Plenitude POWER/POWER+ y Gana Precio Mercado de las posiciones 1-3 salvo que sean las únicas). Calcular con cada tarifa fija disponible.
   - Para 3.0TD: calcular con Endesa Pyme Simply y TotalEnergies Clásica.
   - Para gas: calcular con todas las tarifas del mismo tipo de acceso (RL1, RL2 o RL3).
   - Si hay menos de 3 tarifas distintas: devuelve las que haya con posiciones 1, 2, 3.
   - Si la compañía actual ya es la más barata: ahorro_anual = 0 en todas las opciones, indicarlo en advertencias.
6. Para 3.0TD con desglose por periodo: calcular exacto por P1..P6. Sin desglose: usar precio único Endesa.
7. Si Gana Energía y el cliente no está en Península: excluirla.
8. PERMANENCIA: Lee el campo "Permanencia" de la factura.
   - Si dice "NO" → permanencia = null.
   - Si dice "SÍ" o hay fecha de penalización por cancelación anticipada → pon esa fecha (ej: 'ene 2027').
   - La "fecha fin de contrato" NO es permanencia.
9. precio_energia_kwh_actual: precio medio de energía extraído del desglose (solo término energía, sin potencia ni impuestos). Para 3.0TD: media ponderada P1..P6 por consumo.
10. Campo "nota" en cada opción: indicar si hay permanencia de 1 año, si es precio indexado, o si hay alguna condición relevante para el cliente. null si no hay nada relevante.
11. NO incluyas nombres de compañías en opciones, ni comisiones, ni datos internos.`;

export default async function handler(req, res) {
  // CORS — permite llamadas desde el wizard público
  const allowedOrigins = [
    "https://finanzashealthy.com",
    "https://www.finanzashealthy.com",
    "http://localhost:5173",
    "http://localhost:4173",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (origin && origin.endsWith(".vercel.app")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ error: "No se ha recibido ninguna imagen" });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const isPdf = (mediaType || "").toLowerCase().includes("pdf");
    const fileContent = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: image } }
      : { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } };

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          fileContent,
          { type: "text", text: "Analiza esta factura de energía y devuelve el JSON con el análisis completo para el cliente." },
        ],
      }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo extraer el análisis de la factura");

    const analysis = JSON.parse(jsonMatch[0]);

    // Filtro de seguridad — nunca devolver nombres de compañías en opciones ni datos internos
    const allowed = [
      "empresa_actual", "tarifa_actual", "tipo_acceso", "tipo_suministro",
      "consumo_anual_kwh", "coste_actual_anual", "coste_actual_mensual",
      "precio_energia_kwh_actual", "permanencia",
      "opciones", "advertencias",
    ];
    const safe = {};
    for (const k of allowed) {
      if (analysis[k] !== undefined) safe[k] = analysis[k];
    }
    // Limpiar las opciones: solo campos permitidos, sin nombres de compañía
    if (Array.isArray(safe.opciones)) {
      safe.opciones = safe.opciones.slice(0, 3).map((op, i) => ({
        posicion: op.posicion || (i + 1),
        coste_anual_estimado: op.coste_anual_estimado ?? null,
        ahorro_anual: op.ahorro_anual ?? 0,
        ahorro_mensual: op.ahorro_mensual ?? 0,
        nota: op.nota ?? null,
      }));
    }

    return res.status(200).json(safe);
  } catch (error) {
    console.error("[analyze-wizard]", error.message);
    return res.status(500).json({ error: "No se pudo analizar la factura", details: error.message });
  }
}

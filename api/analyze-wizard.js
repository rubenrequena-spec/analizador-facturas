import Anthropic from "@anthropic-ai/sdk";

// Endpoint público para el wizard — SIN datos de comisiones ni información interna

const SYSTEM_PROMPT = `Eres un asesor de ahorro energético de Finanzas Healthy. Cuando recibes una factura de energía, extraes los datos clave y calculas cuánto puede ahorrar el cliente cambiando de compañía.

SIEMPRE responde en formato JSON con esta estructura exacta (sin texto adicional):
{
  "empresa_actual": "nombre de la compañía actual, o null si no se puede determinar",
  "tarifa_actual": "nombre de la tarifa actual, o null",
  "coste_actual_mensual": número,
  "coste_actual_anual": número,
  "empresa_recomendada": "nombre de la compañía recomendada",
  "tarifa_recomendada": "nombre de la tarifa recomendada",
  "ahorro_mensual": número,
  "ahorro_anual": número,
  "opciones": [
    { "empresa": "nombre", "tarifa": "nombre", "ahorro_mensual": número, "ahorro_anual": número, "nota": "string o null" }
  ],
  "motivo": "explicación breve centrada en el beneficio para el cliente",
  "advertencias": []
}

=== TARIFAS VIGENTES (Mayo 2026) ===

ELECTRICIDAD 2.0TD (sin IVA):
- Endesa TEMPO:          0,1196 €/kWh | P1: 44,70 €/kW/año | P2: 17,73 €/kW/año
- Endesa Simply:         0,1626 €/kWh | P1: 38,70 €/kW/año | P2: 11,73 €/kW/año
- Endesa Open Plana:     0,1532 €/kWh | P1: 38,70 €/kW/año | P2: 11,73 €/kW/año
- Gana Energía 24h:      0,1190 €/kWh | P1=P2: 32,64 €/kW/año (solo Península)
- Naturgy Por Uso:       0,1099 €/kWh | P1: 44,91 €/kW/año | P2: 13,63 €/kW/año
- Iberdrola Plan Estable: 0,1686 €/kWh | P1: 39,99 €/kW/año | P2: 21,99 €/kW/año
- Repsol CDR V29:        0,1399 €/kWh | P1=P2: 29,90 €/kW/año
- Repsol CDR V30:        0,1199 €/kWh | P1=P2: 29,89 €/kW/año

FÓRMULA: coste = [(P1_kW×P1) + (P2_kW×P2) + (kWh×€/kWh)] × 1,0511 × 1,21

GAS (sin IVA):
- Naturgy RL1: 0,07953 €/kWh + 5,15 €/mes | Endesa RL1: 0,07443 €/kWh + 7,18 €/mes
- Gana RL1: 0,07000 €/kWh + 3,93 €/mes    | Repsol RL1: 0,08990 €/kWh + 6,90 €/mes
FÓRMULA GAS: [(fijo×12) + (kWh×€/kWh)] × 1,21

REGLAS:
1. Extrae todos los datos. Si no hay consumo anual, calcula desde el periodo facturado.
2. Calcula coste con CADA tarifa del tipo de acceso del cliente.
3. Ordena opciones por mayor ahorro primero.
4. 2.0TD: recomendar siempre precio fijo (nunca indexado).
5. Si el cliente no está en Endesa y Endesa produce ahorro positivo: recomendar Endesa TEMPO.
6. Si ya está en Endesa o Endesa es más cara: recomendar la mejor tarifa fija.
7. motivo: solo beneficio para el cliente. NUNCA mencionar comisiones ni términos internos.
8. Si la tarifa actual ya es la más barata: ahorro_mensual=0, indicarlo en advertencias.`;

export default async function handler(req, res) {
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
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: [fileContent, { type: "text", text: "Analiza esta factura y devuelve el JSON con el ahorro estimado para el cliente." }] }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo extraer el análisis");
    const analysis = JSON.parse(jsonMatch[0]);

    // Filtro de seguridad: nunca devolver datos de comisiones
    const allowed = ["empresa_actual","tarifa_actual","coste_actual_mensual","coste_actual_anual",
      "empresa_recomendada","tarifa_recomendada","ahorro_mensual","ahorro_anual","opciones","motivo","advertencias"];
    const safe = {};
    for (const k of allowed) { if (analysis[k] !== undefined) safe[k] = analysis[k]; }
    if (Array.isArray(safe.opciones)) {
      safe.opciones = safe.opciones.map(({ empresa, tarifa, ahorro_mensual, ahorro_anual, nota }) =>
        ({ empresa, tarifa, ahorro_mensual, ahorro_anual, nota: nota || null }));
    }
    return res.status(200).json(safe);
  } catch (error) {
    console.error("[analyze-wizard]", error.message);
    return res.status(500).json({ error: "No se pudo analizar la factura", details: error.message });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { BLOQUE_TARIFAS_PUBLICO } from "./tarifas.js";

// Endpoint público para el wizard — mismas tarifas que la app de comerciales
// pero SIN datos internos (comisiones, retrocomisiones, etc.)

const SYSTEM_PROMPT = `Eres un asesor de ahorro energético de Finanzas Healthy. Cuando recibes una factura de energía, extraes los datos clave, calculas el coste con TODAS las tarifas disponibles y devuelves las 3 mejores opciones ordenadas por mayor ahorro.

IMPORTANTE: NO incluyas los nombres de las compañías en las opciones. El cliente verá "Opción 1, 2, 3" sin saber la compañía hasta que un asesor le contacte.

SIEMPRE responde en formato JSON con esta estructura exacta (sin texto adicional):
{
  "nombre_cliente": "nombre completo del titular del contrato extraído de la factura, o null si no aparece",
  "empresa_actual": "nombre de la compañía actual",
  "tarifa_actual": "nombre de la tarifa actual o null",
  "tipo_acceso": "2.0TD / 3.0TD / 6.1TD / RL1 / RL2 / RL3",
  "tipo_suministro": "electricidad / gas",
  "consumo_anual_kwh": número,
  "coste_actual_anual": número (coste anual CON IVA),
  "coste_actual_mensual": número (coste mensual medio CON IVA),
  "precio_energia_kwh_actual": número o null (precio medio de energía SIN potencia ni impuestos, extraído del desglose),
  "precio_potencia_p1_actual": número o null (precio del término de potencia P1 en €/kW/año de la tarifa actual, extraído de la factura),
  "precio_potencia_p2_actual": número o null (precio del término de potencia P2 en €/kW/año de la tarifa actual, o null si no aplica),
  "potencia_p1_kw": número o null (potencia contratada P1 en kW, extraída de la factura),
  "potencia_p2_kw": número o null (potencia contratada P2 en kW, o null si tarifa 3.0TD o gas),
  "permanencia": null o "mes año" si hay penalización real por cancelación anticipada,
  "fecha_fin_contrato": null o "mes año" (fecha de vencimiento del contrato actual, si aparece en la factura; NO es lo mismo que permanencia),
  "opciones": [
    {
      "posicion": 1,
      "companiaInterna": "nombre de la compañía (campo interno, no mostrar al cliente en la UI)",
      "tarifaInterna": "nombre de la tarifa (campo interno, no mostrar al cliente en la UI)",
      "coste_anual_estimado": número (coste anual estimado CON IVA),
      "ahorro_anual": número (ahorro anual estimado en €),
      "ahorro_mensual": número (ahorro mensual estimado en €),
      "precio_energia_kwh_estimado": número o null (precio de energía €/kWh SIN potencia ni impuestos de la nueva tarifa),
      "precio_potencia_p1": número o null (precio del término de potencia P1 en €/kW/año de la nueva tarifa),
      "precio_potencia_p2": número o null (precio del término de potencia P2 en €/kW/año de la nueva tarifa, o null si no aplica),
      "nota": "condición relevante para el cliente (permanencia, precio indexado, etc.) o null"
    },
    { "posicion": 2, ... },
    { "posicion": 3, ... }
  ],
  "advertencias": ["solo advertencias técnicas relevantes para el cliente: consumo estimado, periodos incompletos, etc. NUNCA incluir nombres de compañías ni tarifas en este campo"]
}
${BLOQUE_TARIFAS_PUBLICO}
=== REGLAS DE CÁLCULO Y RECOMENDACIÓN ===
1. Extrae todos los datos de la factura. Si no aparece el consumo anual, extrapola desde el periodo facturado (kWh_periodo × 365 / días_periodo).
2. COSTE ACTUAL: usa SIEMPRE el importe total de la factura extrapolado a 12 meses como coste_actual_anual. NUNCA recalcules cuánto "debería" costar la tarifa actual — usa el importe real pagado.
3. CÁLCULO DEL AHORRO: ahorro_anual = coste_actual_anual - coste_estimado_nueva_tarifa. El coste_actual_anual es el importe real de la factura anualizado, sin ajustes.
4. IMPORTANTE: compara SIEMPRE el cliente con tarifas de su mismo tipo de acceso.
   - Cliente 2.0TD → comparar SOLO con tarifas 2.0TD.
   - Cliente 3.0TD → comparar SOLO con tarifas 3.0TD (Endesa Pyme Simply, Endesa Pyme Open Plana y TotalEnergies Clásica).
   - Cliente gas RL1/RL2/RL3 → comparar con su tipo de acceso de gas.
   NUNCA compares un 3.0TD contra tarifas 2.0TD ni viceversa.
4. Calcula el coste estimado con CADA tarifa disponible para el tipo de acceso del cliente.
5. OPCIONES (devuelve las 3 mejores ordenadas por mayor ahorro):
   - Para 2.0TD: incluir solo tarifas de PRECIO FIJO (excluir Plenitude POWER/POWER+ y Gana Precio Mercado de las posiciones 1-3 salvo que sean las únicas). Calcular con cada tarifa fija disponible.
   - Para 3.0TD: calcular con Endesa Pyme Simply, Endesa Pyme Open Plana y TotalEnergies Clásica.
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
10. precio_potencia_p1_actual / precio_potencia_p2_actual: extráelos del desglose de la factura (término de potencia en €/kW/año o €/kW/día × 365). Si la factura no los desglosa, pon null.
11. precio_potencia_p1 / precio_potencia_p2 en cada opción: usa los precios de potencia de las tarifas del bloque de tarifas (término fijo de potencia). Si la tarifa no tiene término de potencia diferenciado (gas), pon null.
12. Campo "nota" en cada opción: indicar si hay permanencia de 1 año, si es precio indexado, o si hay alguna condición relevante para el cliente. null si no hay nada relevante.
13. NO incluyas nombres de compañías en opciones, ni comisiones, ni datos internos.`;

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
      max_tokens: 4000,
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
      "nombre_cliente", "empresa_actual", "tarifa_actual", "tipo_acceso", "tipo_suministro",
      "consumo_anual_kwh", "coste_actual_anual", "coste_actual_mensual",
      "precio_energia_kwh_actual", "precio_potencia_p1_actual", "precio_potencia_p2_actual",
      "potencia_p1_kw", "potencia_p2_kw", "permanencia",
      "fecha_fin_contrato", "opciones", "advertencias",
    ];
    const safe = {};
    for (const k of allowed) {
      if (analysis[k] !== undefined) safe[k] = analysis[k];
    }
    // Limpiar las opciones: solo campos permitidos, sin nombres de compañía
    if (Array.isArray(safe.opciones)) {
      safe.opciones = safe.opciones.slice(0, 3).map((op, i) => ({
        posicion: op.posicion || (i + 1),
        companiaInterna: op.companiaInterna ?? null,
        tarifaInterna: op.tarifaInterna ?? null,
        coste_anual_estimado: op.coste_anual_estimado ?? null,
        ahorro_anual: op.ahorro_anual ?? 0,
        ahorro_mensual: op.ahorro_mensual ?? 0,
        precio_energia_kwh_estimado: op.precio_energia_kwh_estimado ?? null,
        precio_potencia_p1: op.precio_potencia_p1 ?? null,
        precio_potencia_p2: op.precio_potencia_p2 ?? null,
        nota: op.nota ?? null,
      }));
    }

    return res.status(200).json(safe);
  } catch (error) {
    console.error("[analyze-wizard]", error.message);
    return res.status(500).json({ error: "No se pudo analizar la factura", details: error.message });
  }
}

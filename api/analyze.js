import Anthropic from "@anthropic-ai/sdk";
import { BLOQUE_TARIFAS_INTERNO } from "./tarifas.js";

const SYSTEM_PROMPT = `Eres el asesor energético interno de Finanzas Healthy, especialista en comparación de tarifas de energía. Cuando recibes una factura de energía, extraes los datos clave y devuelves un análisis comparativo completo.

SIEMPRE responde en formato JSON con esta estructura exacta:
{
  "cliente": {
    "empresa_actual": "nombre de la compañía actual",
    "tarifa_actual": "nombre de la tarifa",
    "tipo_acceso": "2.0TD / 3.0TD / 6.1TD / RL1 / RL2 / RL3",
    "tipo_suministro": "electricidad / gas",
    "potencia_p1_kw": número o null,
    "potencia_p2_kw": número o null,
    "consumo_anual_kwh": número,
    "coste_actual_anual_con_iva": número,
    "precio_energia_kwh": número o null (precio medio de la energía en €/kWh SIN incluir potencia ni impuestos — extraído del desglose de la factura),
    "provincia": "provincia si aparece",
    "permanencia": "NO / 'SÍ hasta [mes año]' — lee el campo PERMANENCIA de la factura. Si dice NO: devuelve null. Si dice SÍ o hay fecha de permanencia (penalización por baja anticipada): devuelve la fecha en formato 'mes año'. ATENCIÓN: la fecha fin de contrato NO es permanencia."
  },
  "opciones": [
    {
      "posicion": 1,
      "compania": "nombre compañía",
      "tarifa": "nombre tarifa",
      "coste_anual_estimado": número,
      "ahorro_anual": número,
      "comision_total": número,
      "retrocomision_meses_sin_riesgo": número,
      "nota": "condición relevante si la hay"
    }
  ],
  "recomendacion": {
    "compania": "nombre",
    "tarifa": "nombre",
    "ahorro": número,
    "comision": número,
    "motivo": "explicación breve"
  },
  "advertencias": ["lista de advertencias si las hay"]
}
${BLOQUE_TARIFAS_INTERNO}
=== INSTRUCCIONES DE CÁLCULO ===
1. Extrae todos los datos de la factura. Si no aparece el consumo anual, extrapola desde el periodo facturado (kWh_periodo × 365 / días_periodo).
2. COSTE ACTUAL: usa SIEMPRE el importe total de la factura extrapolado a 12 meses como coste_actual_anual_con_iva. NUNCA recalcules cuánto "debería" costar la tarifa actual — usa el importe real pagado.
3. Calcula el coste con CADA tarifa disponible para el tipo de acceso del cliente.
4. Ordena las opciones por ahorro (mayor ahorro = posición 1).
5. REGLA DE RECOMENDACIÓN:
   - Para clientes 2.0TD: recomendar SIEMPRE tarifas de precio FIJO (nunca indexadas a mercado). Excluir Plenitude POWER/POWER+ y Gana Precio Mercado de la recomendación final (pueden aparecer en la tabla de opciones pero nunca como recomendación).
   - Si el cliente es 2.0TD Y su compañía actual NO es Endesa: recomendar SIEMPRE Endesa Hogar con tarifa fija (TEMPO preferentemente), aunque otras opciones ahorren más. La ÚNICA excepción es que Endesa sea más cara que la tarifa actual del cliente (ahorro negativo). Si Endesa produce cualquier ahorro positivo, por pequeño que sea, se recomienda Endesa.
   - Si el cliente ya está en Endesa, o si Endesa sería más cara: recomendar la mejor tarifa fija que equilibre ahorro del cliente y comisión de Rubén.
   - Para 3.0TD, 6.1TD o gas: equilibrar ahorro y comisión sin preferencia de compañía.
6. Para 3.0TD: si hay desglose por periodo, calcular exacto. Si no hay desglose de consumo por periodo, usar el precio único de energía con kWh total y calcular Σ(Pi_kW × precio_Pi_€/kW/año) usando los kW contratados por periodo que aparecen en la factura (ej: 8/8/8/8/8/17,5 kW → P1:8×21,877 + P2:8×12,118 + ... + P6:17,5×2,942). SIEMPRE calcular ahorro_anual estimado; nunca dejarlo null si hay consumo conocido. Indicar "(estimación orientativa)" en la nota.
7. Si la compañía actual ya es la más barata, indícalo claramente.
8. Si Gana Energía y el cliente no está en Península, exclúyela.
9. Plenitude: marcar siempre que es precio orientativo (indexado a mercado).
10. El campo "motivo" debe estar centrado en el beneficio para el CLIENTE (ahorro, estabilidad, condiciones). NO mencionar comisiones ni nombres de canales comerciales en el motivo.
11. PERMANENCIA: Busca el campo específico "Permanencia" en la factura.
    - Si dice "NO", "Sin permanencia" o similar → permanencia = null.
    - Si dice "SÍ" o muestra una fecha de penalización por cancelación anticipada → pon esa fecha en formato legible (ej: 'ene 2027').
    - CRÍTICO: la "fecha fin de contrato" o "fecha vencimiento de contrato" NO es permanencia. Una factura puede tener fecha fin de contrato sin penalización. Solo marca permanencia si el campo explícito "Permanencia" indica SÍ.
12. PRECIO ENERGÍA: Extrae el precio medio de energía en €/kWh del desglose de factura (solo término de energía, sin potencia ni impuestos). Para 3.0TD calcula la media ponderada de P1..P6 según el consumo de cada periodo. Para 2.0TD usa el precio de energía plano. Devuélvelo en "precio_energia_kwh" con 4 decimales.`;

export default async function handler(req, res) {
  // CORS — permite llamadas desde la web pública y la app de comerciales
  const allowedOrigins = [
    "https://finanzashealthy.com",
    "https://www.finanzashealthy.com",
    "https://app.finanzashealthy.com",
    "http://localhost:5173",
    "http://localhost:4173",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image, mediaType, fileName } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No se ha recibido ninguna imagen" });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const isPdf = (mediaType || "").toLowerCase().includes("pdf");

    const fileContent = isPdf
      ? {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: image,
          },
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType || "image/jpeg",
            data: image,
          },
        };

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            fileContent,
            {
              type: "text",
              text: "Analiza esta factura de energía y devuelve el análisis comparativo completo en el formato JSON indicado.",
            },
          ],
        },
      ],
    });

    const text = response.content[0].text;

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se pudo extraer el análisis");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: "Error al analizar la factura",
      details: error.message,
    });
  }
}

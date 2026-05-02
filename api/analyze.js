import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Eres el asesor energético interno de Finanzas Healthy, especialista en comparación de tarifas del canal Gualú. Cuando recibes una factura de energía, extraes los datos clave y devuelves un análisis comparativo completo.

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
    "provincia": "provincia si aparece"
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

=== DATOS DE TARIFAS (Abril-Mayo 2026) ===

ELECTRICIDAD 2.0TD:
- Endesa TEMPO: energía 0,1196€/kWh | P1: 44,70€/kW/año | P2: 17,73€/kW/año
- Endesa Simply: energía 0,1626€/kWh | P1: 38,70€/kW/año | P2: 11,73€/kW/año
- Gana Energía 24h: energía 0,119€/kWh | P1=P2: 32,64€/kW/año (solo Península)
- Naturgy Por Uso: energía 0,1099€/kWh | P1: 44,91€/kW/año | P2: 13,63€/kW/año
- Iberdrola Plan Estable: energía 0,1686€/kWh | P1: 39,99€/kW/año | P2: 21,99€/kW/año
- Repsol CDR V29: energía 0,1399€/kWh | P1=P2: 29,90€/kW/año
- Repsol CDR V30: energía 0,1199€/kWh | P1=P2: 29,89€/kW/año
- Plenitude POWER: ~0,204€/kWh orientativo | P1: 27,71€/kW/año | P2: 0,73€/kW/año

FÓRMULA ELECTRICIDAD: coste = (P1×precio_P1) + (P2×precio_P2) + (kWh×precio_energía), luego ×1,0511 ×1,21

GAS:
- Naturgy RL1: 0,07953€/kWh + 5,15€/mes | Endesa RL1: 0,07443€/kWh + 7,18€/mes
- Naturgy RL2: 0,07743€/kWh + 9,15€/mes | Endesa RL2: 0,07128€/kWh + 14,60€/mes
- Gana RL1: 0,07€+0,011€/kWh + 3,93€/mes | Repsol RL1: 0,0899€/kWh + 6,90€/mes

FÓRMULA GAS: coste = (fijo_mes×12) + (kWh×(precio+0,00234)), luego ×1,21

=== COMISIONES CANAL GUALÚ ===
ELECTRICIDAD 2.0TD: Endesa ≤10kW: 105€ | >10kW: 170€ | Plenitude POWER: 96€ | Repsol V29: 72€ | Naturgy/Gana/Iberdrola: 70€ | Repsol V30: 46,80€
GAS: Naturgy/Gana RL3: 70€ | Endesa: 65€ | Gana RL2: 50€ | Repsol: 46,80€ | Gana RL1: 40€
EMPRESA 3.0TD: Endesa Pyme: 212€ | Iberdrola: 302€ | Plenitude: 156,80€
RETROCOMISIÓN: Endesa Hogar: 2 meses | Naturgy/Repsol: 4 meses | Gana: 3 meses | Plenitude: riesgo todo el año

=== INSTRUCCIONES ===
1. Extrae todos los datos de la factura.
2. Calcula el coste con CADA tarifa disponible.
3. Ordena opciones por ahorro (mayor ahorro = posición 1).
4. REGLA DE RECOMENDACIÓN 2.0TD: recomendar SIEMPRE tarifa fija. Si compañía actual NO es Endesa, recomendar Endesa TEMPO salvo que Endesa sea más cara (ahorro negativo). Si ya está en Endesa o Endesa es más cara, recomendar mejor tarifa fija por ahorro+comisión.
5. Para 3.0TD/6.1TD/gas: equilibrar ahorro y comisión sin preferencia.
6. Si Gana Energía y cliente no está en Península, excluirla.
7. Plenitude: marcar siempre como precio orientativo (indexado a mercado).`;

export default async function handler(req, res) {
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

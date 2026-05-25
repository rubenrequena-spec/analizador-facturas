import Anthropic from "@anthropic-ai/sdk";
import { BLOQUE_TARIFAS_INTERNO } from "./tarifas.js";

const SYSTEM_PROMPT = `Eres el asesor energético interno de Finanzas Healthy, especialista en comparación de tarifas de energía. Recibes datos de un cliente introducidos manualmente y devuelves un análisis comparativo completo.

SIEMPRE responde en formato JSON con esta estructura exacta:
{
  "cliente": {
    "nombre_cliente": null,
    "empresa_actual": "nombre de la compañía actual",
    "tarifa_actual": "nombre de la tarifa si se conoce, o null",
    "tipo_acceso": "2.0TD / 3.0TD / 6.1TD / RL1 / RL2 / RL3",
    "tipo_suministro": "electricidad / gas",
    "potencia_p1_kw": número o null,
    "potencia_p2_kw": número o null,
    "consumo_anual_kwh": número,
    "coste_actual_anual_con_iva": número,
    "precio_energia_kwh": número o null,
    "provincia": null,
    "permanencia": null
  },
  "opciones": [
    {
      "posicion": 1,
      "compania": "nombre compañía",
      "tarifa": "nombre tarifa",
      "coste_anual_estimado": número,
      "ahorro_anual": número,
      "precio_energia_kwh_estimado": número o null,
      "precio_potencia_p1": número o null,
      "precio_potencia_p2": número o null,
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
  "advertencias": ["Análisis basado en datos introducidos manualmente. Para mayor precisión, sube la factura real."]
}
${BLOQUE_TARIFAS_INTERNO}
=== INSTRUCCIONES DE CÁLCULO ===
1. Usa los datos del cliente tal como se proporcionan.
2. COSTE ACTUAL: usa el coste_actual_anual proporcionado como base. NUNCA lo recalcules.
3. Calcula el coste con CADA tarifa disponible para el tipo de acceso del cliente.
4. Ordena las opciones por ahorro (mayor ahorro = posición 1).
5. REGLA DE RECOMENDACIÓN:
   - Para clientes 2.0TD: recomendar SIEMPRE tarifas de precio FIJO (nunca indexadas a mercado). Excluir Plenitude POWER/POWER+ y Gana Precio Mercado de la recomendación final.
   - Si el cliente es 2.0TD Y su compañía actual NO es Endesa: recomendar SIEMPRE Endesa Hogar con tarifa fija (TEMPO preferentemente), aunque otras opciones ahorren más. La ÚNICA excepción es que Endesa sea más cara que la tarifa actual del cliente (ahorro negativo).
   - Si el cliente ya está en Endesa, o si Endesa sería más cara: recomendar la mejor tarifa fija que equilibre ahorro del cliente y comisión de Rubén.
   - Para 3.0TD, 6.1TD o gas: equilibrar ahorro y comisión sin preferencia de compañía.
6. Para 3.0TD: usa el precio único de energía con kWh total y calcula Σ(Pi_kW × precio_Pi_€/kW/año) con los kW contratados. SIEMPRE calcula ahorro_anual estimado.
7. Si la compañía actual ya es la más barata, indícalo claramente en advertencias.
8. Si Gana Energía y el cliente no está en Península, exclúyela.
9. Plenitude: marcar siempre que es precio orientativo (indexado a mercado).
10. El campo "motivo" debe estar centrado en el beneficio para el CLIENTE. NO mencionar comisiones.
11. PRECIOS POR OPCIÓN: incluye "precio_energia_kwh_estimado", "precio_potencia_p1" y "precio_potencia_p2" con los valores exactos del bloque de tarifas para esa tarifa.`;

export default async function handler(req, res) {
  const allowedOrigins = [
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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    companiaActual, tipoAcceso, tipoSuministro,
    potenciaP1, potenciaP2,
    consumoAnual, costeActualAnual,
    precioEnergiaKwh, precioPotenciaP1, precioPotenciaP2,
  } = req.body;

  if (!consumoAnual || !costeActualAnual) {
    return res.status(400).json({ error: "Consumo anual y coste actual son obligatorios" });
  }

  const clienteTexto = `Datos del cliente:
- Compañía actual: ${companiaActual || "Desconocida"}
- Tipo de acceso: ${tipoAcceso || "2.0TD"}
- Tipo de suministro: ${tipoSuministro || "electricidad"}
- Potencia P1 contratada: ${potenciaP1 ? potenciaP1 + " kW" : "desconocida"}
- Potencia P2 contratada: ${potenciaP2 ? potenciaP2 + " kW" : "no aplica"}
- Consumo anual: ${consumoAnual} kWh
- Coste actual anual con IVA: ${costeActualAnual} €
- Precio energía actual (€/kWh): ${precioEnergiaKwh || "no indicado"}
- Precio potencia P1 actual (€/kW/año): ${precioPotenciaP1 || "no indicado"}
- Precio potencia P2 actual (€/kW/año): ${precioPotenciaP2 || "no indicado"}

Calcula la comparativa completa con todas las tarifas disponibles para este tipo de acceso y devuelve el JSON.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: clienteTexto }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo extraer el análisis");

    const analysis = JSON.parse(jsonMatch[0]);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error("[analyze-manual]", error.message);
    return res.status(500).json({ error: "Error al calcular el análisis", details: error.message });
  }
}

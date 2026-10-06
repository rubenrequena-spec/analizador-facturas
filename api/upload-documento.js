import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { z } from "zod";

// Emite una URL de subida firmada (un solo uso) al bucket PRIVADO `documentos`.
// La usan la página pública de inmobiliarias, los colaboradores y los contratos
// de los comerciales: el navegador
// solo puede subir el archivo que aquí se autoriza, nunca leer. Mismo patrón que
// api/upload.js de la web. Los límites del bucket son la segunda barrera.

const EXT = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const schema = z.object({
  contentType: z.string().refine((t) => t in EXT),
  size: z.number().int().positive().max(10 * 1024 * 1024),
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Archivo no permitido (PDF, JPG, PNG o WEBP, máx. 10 MB)" });

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Cada carpeta tiene su política RLS de lectura (ver supabase/*.sql):
  // - colaborador con sesión: `colaborador/<colaborador_id>/` (lo ve su empresa)
  // - comercial/admin con sesión: `contratos/<su id>/` (lo ve él y el admin)
  // - sin sesión (página pública): `inmobiliaria/` (solo el admin)
  let carpeta = "inmobiliaria";
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (token) {
    const { data: u, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !u?.user) return res.status(401).json({ error: "Sesión inválida" });
    const { data: cu } = await admin
      .from("colaborador_usuarios")
      .select("colaborador_id")
      .eq("id", u.user.id)
      .eq("active", true)
      .maybeSingle();
    if (cu?.colaborador_id) {
      carpeta = `colaborador/${cu.colaborador_id}`;
    } else {
      const { data: staff } = await admin
        .from("profiles")
        .select("id")
        .eq("id", u.user.id)
        .eq("active", true)
        .maybeSingle();
      if (staff) carpeta = `contratos/${staff.id}`;
    }
  }
  const path = `${carpeta}/${randomUUID()}.${EXT[parsed.data.contentType]}`; // nunca el nombre del usuario
  const { data, error } = await admin.storage.from("documentos").createSignedUploadUrl(path);
  if (error) {
    console.error("[upload-documento] no se pudo firmar", error.message); // sin PII
    return res.status(502).json({ error: "No se pudo preparar la subida" });
  }
  return res.status(200).json({ path: data.path, token: data.token });
}
// ponytail: sin rate limiting; añadir Turnstile o regla de Firewall de Vercel si hay abuso medido.

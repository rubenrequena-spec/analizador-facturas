import { createClient } from "@supabase/supabase-js";

// Crea el acceso de una persona de un colaborador (inmobiliaria u otro tipo):
// usuario de Supabase Auth + su fila en `colaborador_usuarios`. Requiere
// SUPABASE_SERVICE_ROLE_KEY (solo servidor) porque crear usuarios de Auth no
// se puede hacer con la anon key. El caller debe demostrar que es un admin
// interno activo antes de nada — nunca lo hace el propio colaborador.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No autenticado" });

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const anonClient = createClient(url, anonKey);
  const { data: callerData, error: callerErr } = await anonClient.auth.getUser(token);
  if (callerErr || !callerData?.user) return res.status(401).json({ error: "Sesión inválida" });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role, active")
    .eq("id", callerData.user.id)
    .single();
  if (!callerProfile || callerProfile.role !== "admin" || callerProfile.active === false) {
    return res.status(403).json({ error: "Solo un administrador puede dar de alta accesos de colaboradores" });
  }

  const { colaborador_id, nombre, email, password } = req.body || {};
  if (!colaborador_id || !nombre || !email || !password || password.length < 6) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const { data: colaborador } = await admin.from("colaboradores").select("id").eq("id", colaborador_id).single();
  if (!colaborador) return res.status(400).json({ error: "Colaborador no encontrado" });

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) return res.status(400).json({ error: createErr.message });

  const { error: rowErr } = await admin.from("colaborador_usuarios").insert({
    id: created.user.id,
    colaborador_id,
    email,
    full_name: nombre,
    active: true,
  });
  if (rowErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ error: rowErr.message });
  }

  return res.status(200).json({ ok: true });
}

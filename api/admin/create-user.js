import { createClient } from "@supabase/supabase-js";

// Crea un comercial: usuario de Supabase Auth + su fila en `profiles`.
// Requiere SUPABASE_SERVICE_ROLE_KEY (solo servidor, nunca con prefijo VITE_)
// porque crear usuarios de Auth no se puede hacer con la anon key.
// El caller debe demostrar que es un admin activo antes de nada.

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
    return res.status(403).json({ error: "Solo un administrador puede crear usuarios" });
  }

  const { nombre, email, password } = req.body || {};
  if (!nombre || !email || !password || password.length < 6) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) return res.status(400).json({ error: createErr.message });

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    email,
    full_name: nombre,
    role: "comercial",
    active: true,
  });
  if (profileErr) {
    // El usuario de Auth ya se creó; sin fila en profiles no podría entrar igualmente
    // (las policies exigen una fila activa), así que lo deshacemos para no dejar huérfanos.
    await admin.auth.admin.deleteUser(created.user.id);
    return res.status(400).json({ error: profileErr.message });
  }

  return res.status(200).json({ ok: true });
}

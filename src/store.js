const ESTUDIOS_KEY = 'fh_estudios'
const CLIENTES_KEY = 'fh_clientes'

// ── Estudios ──────────────────────────────────────────────
export function getEstudios() {
  try {
    const raw = localStorage.getItem(ESTUDIOS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveEstudio(estudio) {
  const estudios = getEstudios()
  const idx = estudios.findIndex(e => e.id === estudio.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    estudios[idx] = { ...estudio, updatedAt: now }
  } else {
    estudios.unshift({
      id: estudio.id || 'estudio-' + Date.now(),
      nombre: estudio.nombre || '',
      clienteNombre: estudio.clienteNombre || '',
      clienteId: estudio.clienteId || null,
      analisis: estudio.analisis || null,
      estado: estudio.estado || 'borrador',
      createdAt: now,
      updatedAt: now,
      ...estudio
    })
  }
  localStorage.setItem(ESTUDIOS_KEY, JSON.stringify(estudios))
  return estudios.find(e => e.id === estudio.id) || estudios[0]
}

export function deleteEstudio(id) {
  const estudios = getEstudios().filter(e => e.id !== id)
  localStorage.setItem(ESTUDIOS_KEY, JSON.stringify(estudios))
}

// ── Clientes ──────────────────────────────────────────────
export function getClientes() {
  try {
    const raw = localStorage.getItem(CLIENTES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCliente(cliente) {
  const clientes = getClientes()
  const idx = clientes.findIndex(c => c.id === cliente.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    clientes[idx] = { ...cliente, updatedAt: now }
  } else {
    clientes.unshift({
      id: cliente.id || 'cliente-' + Date.now(),
      nombre: cliente.nombre || '',
      empresa: cliente.empresa || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      createdAt: now,
      updatedAt: now,
      ...cliente
    })
  }
  localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientes))
}

export function deleteCliente(id) {
  const clientes = getClientes().filter(c => c.id !== id)
  localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientes))
}

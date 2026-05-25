const SESSION_KEY = 'fh_session'
const USERS_KEY = 'fh_users'

const DEFAULT_ADMIN = {
  id: 'admin-1',
  nombre: 'Admin',
  email: 'admin@finanzashealthy.com',
  password: 'FH2024admin',
  rol: 'admin',
  createdAt: new Date('2024-01-01').toISOString()
}

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    const hasAdmin = users.some(u => u.email === DEFAULT_ADMIN.email)
    if (!hasAdmin) return [DEFAULT_ADMIN, ...users]
    return users
  } catch {
    return [DEFAULT_ADMIN]
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function login(email, password) {
  const users = getUsers()
  const user = users.find(u => u.email === email && u.password === password)
  if (!user) return false
  const session = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return true
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getComerciales() {
  return getUsers()
}

export function createUser({ nombre, email, password }) {
  const users = getUsers()
  if (users.some(u => u.email === email)) {
    throw new Error('Ya existe un usuario con ese email')
  }
  const newUser = {
    id: 'user-' + Date.now(),
    nombre,
    email,
    password,
    rol: 'comercial',
    createdAt: new Date().toISOString()
  }
  const toSave = users.filter(u => u.email !== DEFAULT_ADMIN.email)
  toSave.push(newUser)
  if (!toSave.some(u => u.email === DEFAULT_ADMIN.email)) {
    toSave.unshift(DEFAULT_ADMIN)
  }
  saveUsers(toSave)
  return newUser
}

export function deleteUser(id) {
  if (id === DEFAULT_ADMIN.id) throw new Error('No se puede eliminar el admin')
  const users = getUsers()
  const filtered = users.filter(u => u.id !== id)
  const toSave = filtered.filter(u => u.email !== DEFAULT_ADMIN.email)
  saveUsers(toSave)
}

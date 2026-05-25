import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getSession } from '../auth.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Si ya tiene sesión, redirigir
  if (getSession()) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    const ok = login(email, password)
    setLoading(false)
    if (ok) {
      navigate('/')
    } else {
      setError('Credenciales incorrectas')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #dcfce7 0%, #f0fdf4 40%, #ffffff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '40px 36px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 4px 32px rgba(27,45,38,0.10)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/assets/logo-finanzas-healthy.png" alt="Finanzas Healthy" style={{ height: 52, width: 'auto', marginBottom: 16, objectFit: 'contain' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1B2D26', marginBottom: 6 }}>
            Acceso Comerciales
          </h1>
          <p style={{ fontSize: 14, color: '#527870' }}>
            Dashboard de gestión — Finanzas Healthy
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B2D26', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@finanzashealthy.com"
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid #D8E8E4', fontSize: 14, outline: 'none',
                color: '#1B2D26', background: '#F5F7F6',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#22c55e'}
              onBlur={e => e.target.style.borderColor = '#D8E8E4'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B2D26', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid #D8E8E4', fontSize: 14, outline: 'none',
                color: '#1B2D26', background: '#F5F7F6',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#22c55e'}
              onBlur={e => e.target.style.borderColor = '#D8E8E4'}
            />
          </div>

          {error && (
            <div style={{
              background: '#FDEAE9', border: '1px solid #E8655D', borderRadius: 10,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#E8655D',
              fontWeight: 500, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#94a3b8' : '#16a34a',
              color: 'white', border: 'none', padding: '14px', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

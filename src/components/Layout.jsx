import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { getSession, logout } from '../auth.js'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/estudio/nuevo', label: 'Nuevo Estudio', icon: '➕' },
  { to: '/estudios', label: 'Mis Estudios', icon: '📁' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
]

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/estudio/nuevo': 'Nuevo Estudio',
  '/estudios': 'Mis Estudios',
  '/clientes': 'Clientes',
  '/admin': 'Administración',
}

export default function Layout() {
  const session = getSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const pageTitle = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => location.pathname.startsWith(path))?.[1] || 'Dashboard'

  const navItems = [...NAV_ITEMS]
  if (session?.rol === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: '⚙️' })
  }

  const sidebarStyle = {
    width: 220,
    minHeight: '100vh',
    background: '#1B2D26',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    transition: 'transform 0.25s',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7F6' }}>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 99, display: 'none'
          }}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside style={{
        ...sidebarStyle,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
      }} className="sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src="/assets/logo-finanzas-healthy.png" alt="Finanzas Healthy" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderLeft: isActive ? '3px solid #22c55e' : '3px solid transparent',
                background: isActive ? 'rgba(109,196,98,0.15)' : 'transparent',
                color: isActive ? '#22c55e' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.15s',
                marginBottom: 2,
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Usuario + logout */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
            {session?.rol === 'admin' ? '⚙️ Admin' : '👤 Comercial'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 10, wordBreak: 'break-all' }}>
            {session?.nombre}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', background: 'rgba(232,101,93,0.15)', border: '1px solid rgba(232,101,93,0.3)',
              color: '#E8655D', borderRadius: 8, padding: '8px 12px', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }} className="main-content">
        {/* Topbar */}
        <div style={{
          background: 'white', borderBottom: '1px solid #D8E8E4',
          padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
          gap: 12, position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hamburger-btn"
            style={{
              display: 'none', background: 'none', border: 'none',
              fontSize: 20, cursor: 'pointer', color: '#1B2D26', padding: '4px 8px',
            }}
          >
            ☰
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1B2D26' }}>{pageTitle}</h1>
        </div>

        {/* Page content */}
        <div style={{ padding: 24, flex: 1 }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-220px) !important; }
          .sidebar.open { transform: translateX(0) !important; }
          .main-content { margin-left: 0 !important; }
          .hamburger-btn { display: flex !important; }
          .sidebar-overlay { display: block !important; }
        }
      `}</style>
    </div>
  )
}

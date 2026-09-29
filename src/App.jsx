import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth.js'
import Layout from './components/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EstudioPage from './pages/EstudioPage.jsx'
import EstudiosPage from './pages/EstudiosPage.jsx'
import ClientesPage from './pages/ClientesPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import TarifasPage from './pages/TarifasPage.jsx'
import InmobiliariasPage from './pages/InmobiliariasPage.jsx'
import InmobiliariasPublicPage from './pages/InmobiliariasPublicPage.jsx'

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#527870', fontSize: 14 }}>
        Cargando…
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inmobiliarias" element={<InmobiliariasPublicPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="estudio/nuevo" element={<EstudioPage />} />
            <Route path="estudio/:id" element={<EstudioPage />} />
            <Route path="estudios" element={<EstudiosPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="tarifas" element={<TarifasPage />} />
            <Route path="documentos-inmobiliarias" element={<InmobiliariasPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

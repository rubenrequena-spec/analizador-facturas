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
import ColaboradoresPage from './pages/ColaboradoresPage.jsx'
import ColaboradorLoginPage from './pages/colaborador/ColaboradorLoginPage.jsx'
import ColaboradorPortalPage from './pages/colaborador/ColaboradorPortalPage.jsx'

function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#527870', fontSize: 14 }}>
      Cargando…
    </div>
  )
}

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Loading />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireColaboradorAuth({ children }) {
  const { isColaborador, loading } = useAuth()
  if (loading) return <Loading />
  if (!isColaborador) return <Navigate to="/colaborador/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inmobiliarias" element={<InmobiliariasPublicPage />} />
          <Route path="/colaborador/login" element={<ColaboradorLoginPage />} />
          <Route
            path="/colaborador"
            element={
              <RequireColaboradorAuth>
                <ColaboradorPortalPage />
              </RequireColaboradorAuth>
            }
          />
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
            <Route path="colaboradores" element={<ColaboradoresPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getSession } from './auth.js'
import Layout from './components/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EstudioPage from './pages/EstudioPage.jsx'
import EstudiosPage from './pages/EstudiosPage.jsx'
import ClientesPage from './pages/ClientesPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

function RequireAuth({ children }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

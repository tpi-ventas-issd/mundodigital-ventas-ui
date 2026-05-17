import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { Layout } from  './components/Layout'
import { PrivateRoute } from './components/PrivateRoute'
import { LoginPage } from './pages/Login'
import { NuevaVentaPage } from './pages/NuevaVenta'
import { HistorialVentasPage } from './pages/HistorialVentas'
import { ClientesPage } from './pages/Clientes'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/ventas/nueva" replace />} />
            <Route path="ventas/nueva" element={<NuevaVentaPage />} />
            <Route path="ventas"       element={<HistorialVentasPage />} />
            <Route path="clientes"     element={<ClientesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/ventas/nueva" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

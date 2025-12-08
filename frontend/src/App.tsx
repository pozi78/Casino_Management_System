import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SalonFilterProvider } from './context/SalonFilterContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Salones from './pages/Salones';
import Maquinas from './pages/Maquinas';
import Usuarios from './pages/Usuarios';
import Recaudaciones from './pages/Recaudaciones';
import RecaudacionDetail from './pages/RecaudacionDetail';
import Configuracion from './pages/Configuracion';

// ProtectedRoute Component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <SalonFilterProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="salones" element={<Salones />} />
              <Route path="maquinas" element={<Maquinas />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="recaudaciones" element={<Recaudaciones />} />
              <Route path="recaudaciones/:id" element={<RecaudacionDetail />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SalonFilterProvider>
    </AuthProvider>
  );
}

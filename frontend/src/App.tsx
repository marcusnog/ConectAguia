import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import CadastroPage from "@/pages/CadastroPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import TermosPage from "@/pages/TermosPage";
import FormBuilderPage from "@/pages/FormBuilderPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { manager, isLoading } = useAuth();
  if (isLoading) return null;
  return manager ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<CadastroPage />} />
          <Route path="/termos" element={<TermosPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/form-builder"
            element={
              <PrivateRoute>
                <FormBuilderPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  manager: Manager | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [manager, setManager] = useState<Manager | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("manager");
    if (token && saved) {
      setManager(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("manager", JSON.stringify(data.manager));
    setManager(data.manager);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("manager");
    setManager(null);
  }

  return (
    <AuthContext.Provider value={{ manager, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

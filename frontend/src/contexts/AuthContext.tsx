import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  manager: Manager | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [manager, setManager] = useState<Manager | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("manager");
    if (saved) {
      setManager(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    // token salvo como httpOnly cookie pelo backend — não acessível aqui
    localStorage.setItem("manager", JSON.stringify(data.manager));
    setManager(data.manager);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("manager");
      setManager(null);
    }
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

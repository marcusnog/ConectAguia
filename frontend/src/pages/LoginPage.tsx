import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Credenciais inválidas. Verifique e-mail e senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eff4ff] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-[#c4c6cd] p-10 w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#041627]">ConectAguia</h1>
          <p className="text-sm text-[#44474c] mt-1">Acesso restrito — gestores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#44474c] mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74777d] pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 border border-[#c4c6cd] rounded-lg pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                placeholder="gestor@conectaguia.com.br"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#44474c] mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74777d] pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 border border-[#c4c6cd] rounded-lg pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777d] hover:text-[#44474c]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#0054cd] hover:bg-[#0040a1] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

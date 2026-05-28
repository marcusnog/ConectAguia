import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ProviderDrawer from "@/components/ProviderDrawer";

type ProviderStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

interface Provider {
  id: string;
  name: string;
  documentType: "CPF" | "CNPJ";
  document: string;
  email: string;
  phone: string;
  serviceType: string;
  status: ProviderStatus;
  termsAccepted: boolean;
  createdAt: string;
}

const STATUS_LABELS: Record<ProviderStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  ARCHIVED: "Arquivado",
};

const STATUS_COLORS: Record<ProviderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function DashboardPage() {
  const { manager, logout } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProviderStatus | "">("");
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<ProviderStatus, number>>({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  });

  const limit = 20;

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/providers?${params}`);
      setProviders(data.providers);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchCounts = useCallback(async () => {
    const statuses: ProviderStatus[] = ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"];
    const results = await Promise.all(
      statuses.map((s) =>
        api.get(`/providers?status=${s}&limit=1`).then((r) => ({ s, total: r.data.total }))
      )
    );
    const next = { PENDING: 0, APPROVED: 0, REJECTED: 0, ARCHIVED: 0 };
    results.forEach(({ s, total }) => { next[s] = total; });
    setCounts(next);
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, providers]);

  async function updateStatus(id: string, status: ProviderStatus) {
    setUpdating(id);
    try {
      await api.patch(`/providers/${id}/status`, { status });
      fetchProviders();
    } finally {
      setUpdating(null);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#c4c6cd] px-8 h-16 flex items-center justify-between">
        <div>
          <span className="text-[#0054cd] font-bold text-xl">ConectAguia</span>
          <p className="text-xs text-[#44474c]">Dashboard - Gestão de Cadastros</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold">{manager?.name}</span>
          <button
            onClick={() => navigate("/dashboard/form-builder")}
            className="text-[#0054cd] text-sm hover:underline"
          >
            Formulário
          </button>
          <button
            onClick={handleLogout}
            className="text-[#ba1a1a] text-sm hover:underline"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Pendente */}
          <button
            onClick={() => { setStatusFilter(statusFilter === "PENDING" ? "" : "PENDING"); setPage(1); }}
            className={`bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#e2e8f0] p-6 text-left cursor-pointer hover:shadow-[0_8px_20px_rgba(4,22,39,0.08)] transition-all border-l-4 border-l-yellow-500 ${statusFilter === "PENDING" ? "ring-2 ring-[#0054cd]" : ""}`}
          >
            <span className="text-sm font-medium text-[#44474c] block mb-2">Pendente</span>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-[#0b1c30]">{counts.PENDING}</span>
              <span className="material-symbols-outlined text-yellow-500 text-3xl">pending_actions</span>
            </div>
          </button>
          {/* Aprovado */}
          <button
            onClick={() => { setStatusFilter(statusFilter === "APPROVED" ? "" : "APPROVED"); setPage(1); }}
            className={`bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#e2e8f0] p-6 text-left cursor-pointer hover:shadow-[0_8px_20px_rgba(4,22,39,0.08)] transition-all border-l-4 border-l-green-600 ${statusFilter === "APPROVED" ? "ring-2 ring-[#0054cd]" : ""}`}
          >
            <span className="text-sm font-medium text-[#44474c] block mb-2">Aprovado</span>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-[#0b1c30]">{counts.APPROVED}</span>
              <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
            </div>
          </button>
          {/* Recusado */}
          <button
            onClick={() => { setStatusFilter(statusFilter === "REJECTED" ? "" : "REJECTED"); setPage(1); }}
            className={`bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#e2e8f0] p-6 text-left cursor-pointer hover:shadow-[0_8px_20px_rgba(4,22,39,0.08)] transition-all border-l-4 border-l-[#ba1a1a] ${statusFilter === "REJECTED" ? "ring-2 ring-[#0054cd]" : ""}`}
          >
            <span className="text-sm font-medium text-[#44474c] block mb-2">Recusado</span>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-[#0b1c30]">{counts.REJECTED}</span>
              <span className="material-symbols-outlined text-[#ba1a1a] text-3xl">cancel</span>
            </div>
          </button>
          {/* Arquivado */}
          <button
            onClick={() => { setStatusFilter(statusFilter === "ARCHIVED" ? "" : "ARCHIVED"); setPage(1); }}
            className={`bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#e2e8f0] p-6 text-left cursor-pointer hover:shadow-[0_8px_20px_rgba(4,22,39,0.08)] transition-all border-l-4 border-l-[#74777d] ${statusFilter === "ARCHIVED" ? "ring-2 ring-[#0054cd]" : ""}`}
          >
            <span className="text-sm font-medium text-[#44474c] block mb-2">Arquivado</span>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-[#0b1c30]">{counts.ARCHIVED}</span>
              <span className="material-symbols-outlined text-[#74777d] text-3xl">archive</span>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#e2e8f0] p-5 flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, e-mail, documento ou serviço..."
              className="pl-10 h-12 border border-[#c4c6cd] rounded-lg w-full focus:ring-2 focus:ring-[#0054cd] outline-none text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ProviderStatus | "");
              setPage(1);
            }}
            className="h-12 border border-[#c4c6cd] rounded-lg px-3 focus:ring-2 focus:ring-[#0054cd] outline-none w-full md:w-56 text-sm"
          >
            <option value="">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as ProviderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#e2e8f0] overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-[#74777d] text-sm">Carregando...</div>
          ) : providers.length === 0 ? (
            <div className="py-16 text-center text-[#74777d] text-sm">
              Nenhum cadastro encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#eff4ff] border-b border-[#c4c6cd]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider text-left">Nome</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider text-left">Documento</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider text-left">Serviço</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider text-left">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider text-left">Cadastro</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider text-left">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6cd]">
                  {providers.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#eff4ff] transition-colors cursor-pointer"
                      onClick={() => setSelectedId(p.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0b1c30]">{p.name}</div>
                        <div className="text-xs text-[#44474c]">{p.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono">{p.document}</div>
                        <div className="text-xs text-[#74777d]">{p.documentType}</div>
                      </td>
                      <td className="px-6 py-4 text-[#44474c]">{p.serviceType}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#44474c] text-xs">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {p.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => updateStatus(p.id, "APPROVED")}
                                disabled={updating === p.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                                title="Aprovar"
                              >
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                              </button>
                              <button
                                onClick={() => updateStatus(p.id, "REJECTED")}
                                disabled={updating === p.id}
                                className="p-2 text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                title="Recusar"
                              >
                                <span className="material-symbols-outlined text-xl">cancel</span>
                              </button>
                            </>
                          )}
                          {p.status !== "ARCHIVED" && (
                            <button
                              onClick={() => updateStatus(p.id, "ARCHIVED")}
                              disabled={updating === p.id}
                              className="p-2 text-[#74777d] hover:bg-[#eff4ff] rounded-lg transition-colors disabled:opacity-40"
                              title="Arquivar"
                            >
                              <span className="material-symbols-outlined text-xl">archive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-[#eff4ff] border-t border-[#c4c6cd] flex items-center justify-between">
              <span className="text-sm text-[#44474c]">{total} cadastros</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-[#c4c6cd] rounded-lg text-sm disabled:opacity-40 hover:bg-[#e5eeff]"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-[#44474c]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-[#c4c6cd] rounded-lg text-sm disabled:opacity-40 hover:bg-[#e5eeff]"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProviderDrawer providerId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

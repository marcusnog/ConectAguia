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

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ConectAguia</h1>
          <p className="text-xs text-gray-500">Dashboard — Gestão de Cadastros</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{manager?.name}</span>
          <button
            onClick={() => navigate("/dashboard/form-builder")}
            className="text-sm text-blue-600 hover:underline"
          >
            Formulário
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(["PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as ProviderStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(statusFilter === s ? "" : s);
                setPage(1);
              }}
              className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                statusFilter === s ? "ring-2 ring-blue-500" : "border-gray-200"
              }`}
            >
              <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium mb-2 ${STATUS_COLORS[s]}`}>
                {STATUS_LABELS[s]}
              </div>
              <div className="text-2xl font-bold text-gray-900">{counts[s]}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, e-mail, documento ou serviço..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ProviderStatus | "");
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Carregando...</div>
          ) : providers.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Nenhum cadastro encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Documento</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Serviço</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cadastro</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {providers.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedId(p.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-gray-500 text-xs">{p.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-600 font-mono text-xs">{p.document}</div>
                        <div className="text-gray-400 text-xs">{p.documentType}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.serviceType}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {p.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => updateStatus(p.id, "APPROVED")}
                                disabled={updating === p.id}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-40"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => updateStatus(p.id, "REJECTED")}
                                disabled={updating === p.id}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-40"
                              >
                                Recusar
                              </button>
                            </>
                          )}
                          {p.status !== "ARCHIVED" && (
                            <button
                              onClick={() => updateStatus(p.id, "ARCHIVED")}
                              disabled={updating === p.id}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-40"
                            >
                              Arquivar
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
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
              <span className="text-gray-500">{total} cadastros</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
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

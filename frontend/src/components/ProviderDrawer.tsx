import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type DocumentType = "CPF" | "CNPJ";
type ProviderStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

interface ConsentLog {
  id: string;
  ip: string | null;
  userAgent: string | null;
  termsVersion: string;
  acceptedAt: string;
}

interface ProviderDetail {
  id: string;
  name: string;
  documentType: DocumentType;
  document: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  serviceType: string;
  serviceDescription: string | null;
  status: ProviderStatus;
  termsAccepted: boolean;
  termsVersion: string;
  createdAt: string;
  updatedAt: string;
  consentLogs: ConsentLog[];
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

function formatDoc(doc: string, type: DocumentType) {
  if (type === "CPF") {
    return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatPhone(phone: string) {
  return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
}

interface Props {
  providerId: string | null;
  onClose: () => void;
}

export default function ProviderDrawer({ providerId, onClose }: Props) {
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!providerId) {
      setProvider(null);
      return;
    }
    setLoading(true);
    api
      .get(`/providers/${providerId}`)
      .then((r) => setProvider(r.data))
      .finally(() => setLoading(false));
  }, [providerId]);

  const open = !!providerId;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Ficha do Prestador</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {loading && (
              <div className="py-12 text-center text-gray-400 text-sm">
                Carregando...
              </div>
            )}

            {provider && !loading && (
              <>
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[provider.status]}`}
                  >
                    {STATUS_LABELS[provider.status]}
                  </span>
                  <span className="text-xs text-gray-400">
                    Cadastrado em{" "}
                    {new Date(provider.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Dados pessoais */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Dados Pessoais
                  </h3>
                  <dl className="space-y-2">
                    <Row label="Nome" value={provider.name} />
                    <Row
                      label={provider.documentType}
                      value={formatDoc(provider.document, provider.documentType)}
                    />
                    <Row label="E-mail" value={provider.email} />
                    <Row label="Telefone" value={formatPhone(provider.phone)} />
                  </dl>
                </section>

                {/* Endereço */}
                {(provider.address || provider.city) && (
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Endereço
                    </h3>
                    <dl className="space-y-2">
                      {provider.address && <Row label="Endereço" value={provider.address} />}
                      {provider.city && (
                        <Row
                          label="Cidade/UF"
                          value={[provider.city, provider.state].filter(Boolean).join(" / ")}
                        />
                      )}
                      {provider.zipCode && <Row label="CEP" value={provider.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2")} />}
                    </dl>
                  </section>
                )}

                {/* Serviço */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Serviço Prestado
                  </h3>
                  <dl className="space-y-2">
                    <Row label="Tipo" value={provider.serviceType} />
                    {provider.serviceDescription && (
                      <Row label="Descrição" value={provider.serviceDescription} />
                    )}
                  </dl>
                </section>

                {/* LGPD */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Consentimento LGPD
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Termos aceitos — versão {provider.termsVersion}
                    </div>
                  </div>

                  {provider.consentLogs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Log de consentimento:</p>
                      {provider.consentLogs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1"
                        >
                          <div>
                            <span className="font-medium">Data:</span>{" "}
                            {new Date(log.acceptedAt).toLocaleString("pt-BR")}
                          </div>
                          {log.ip && (
                            <div>
                              <span className="font-medium">IP:</span> {log.ip}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Versão:</span> {log.termsVersion}
                          </div>
                          {log.userAgent && (
                            <div className="truncate">
                              <span className="font-medium">Agente:</span> {log.userAgent}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="text-sm text-gray-400 w-24 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-800 break-all">{value}</dd>
    </div>
  );
}

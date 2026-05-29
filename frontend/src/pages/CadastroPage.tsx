import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  validateCPF,
  validateCNPJ,
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCEP,
} from "@/lib/validators";

type FieldType = "TEXT" | "EMAIL" | "PHONE" | "NUMBER" | "TEXTAREA" | "SELECT" | "CHECKBOX";

interface FormConfigField {
  key: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
  options: string[];
  minLength?: number;
  maxLength?: number;
  isCore?: boolean;
  isVisible?: boolean;
}

type FieldValue = string | boolean;

function inputClass() {
  return "w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]";
}

export default function CadastroPage() {
  const [fields, setFields] = useState<FormConfigField[]>([]);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    api
      .get<{ fields: FormConfigField[] }>("/form-config")
      .then((r) => {
        const visible = (r.data.fields ?? []).filter((f) => f.isVisible !== false);
        setFields(visible);
        // default document_type to CPF if field exists
        if (visible.some((f) => f.key === "document_type")) {
          setValues((prev) => ({ ...prev, document_type: "CPF" }));
        }
      })
      .catch(() => {});
  }, []);

  function setValue(key: string, val: FieldValue) {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const field of fields) {
      const val = values[field.key];
      const empty = val === undefined || val === "" || val === false;
      if (field.required && empty) {
        errs[field.key] = `${field.label} é obrigatório`;
        continue;
      }
      if (!empty && typeof val === "string") {
        if (field.key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errs[field.key] = "E-mail inválido";
        }
        if (field.key === "document") {
          const raw = val.replace(/\D/g, "");
          const docType = values["document_type"] as string;
          if (docType === "CPF" && !validateCPF(raw)) errs[field.key] = "CPF inválido";
          if (docType === "CNPJ" && !validateCNPJ(raw)) errs[field.key] = "CNPJ inválido";
        }
        if (field.minLength && val.length < field.minLength) {
          errs[field.key] = `Mínimo ${field.minLength} caracteres`;
        }
        if (field.maxLength && val.length > field.maxLength) {
          errs[field.key] = `Máximo ${field.maxLength} caracteres`;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if ((k === "phone" || k === "document" || k === "zip_code") && typeof v === "string") {
          payload[k] = v.replace(/\D/g, "");
        } else {
          payload[k] = v;
        }
      }
      await api.post("/providers", payload);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Erro ao enviar cadastro. Tente novamente.";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function renderFieldInput(field: FormConfigField) {
    // Special renderers for core fields with masks / custom UX
    if (field.key === "document_type") {
      return (
        <select
          value={String(values[field.key] ?? "CPF")}
          onChange={(e) => {
            setValue(field.key, e.target.value);
            setValue("document", "");
          }}
          className={inputClass()}
        >
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt === "CPF" ? "CPF (Pessoa Física)" : "CNPJ (Pessoa Jurídica)"}</option>
          ))}
        </select>
      );
    }

    if (field.key === "document") {
      const docType = (values["document_type"] as string) || "CPF";
      return (
        <input
          value={String(values[field.key] ?? "")}
          onChange={(e) =>
            setValue(field.key, docType === "CPF" ? maskCPF(e.target.value) : maskCNPJ(e.target.value))
          }
          placeholder={docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
          className={inputClass()}
        />
      );
    }

    if (field.key === "phone") {
      return (
        <input
          value={String(values[field.key] ?? "")}
          onChange={(e) => setValue(field.key, maskPhone(e.target.value))}
          placeholder={field.placeholder || "(00) 00000-0000"}
          className={inputClass()}
        />
      );
    }

    if (field.key === "zip_code") {
      return (
        <input
          value={String(values[field.key] ?? "")}
          onChange={(e) => setValue(field.key, maskCEP(e.target.value))}
          placeholder={field.placeholder || "00000-000"}
          className={inputClass()}
        />
      );
    }

    if (field.key === "state") {
      return (
        <input
          value={String(values[field.key] ?? "")}
          onChange={(e) => setValue(field.key, e.target.value.toUpperCase())}
          placeholder={field.placeholder || "SP"}
          maxLength={2}
          className={inputClass() + " uppercase"}
        />
      );
    }

    if (field.key === "terms_accepted") {
      return (
        <div className="bg-[#eff4ff] rounded-xl p-4 border border-[#c4c6cd]">
          <h2 className="text-sm font-semibold text-[#0b1c30] mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0054cd]">gavel</span>
            {field.label}
          </h2>
          <p className="text-xs text-[#44474c] mb-3">
            Seus dados serão tratados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(values[field.key])}
              onChange={(e) => setValue(field.key, e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#0054cd]"
            />
            <span className="text-sm text-[#44474c]">
              Li e aceito os{" "}
              <a
                href={`${import.meta.env.BASE_URL}termos`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0054cd] hover:underline font-medium"
              >
                Termos de Uso e Política de Privacidade
              </a>
              . Consinto com o tratamento dos meus dados para as finalidades descritas.
            </span>
          </label>
        </div>
      );
    }

    // Generic type-based rendering
    switch (field.type) {
      case "TEXTAREA":
        return (
          <textarea
            rows={3}
            placeholder={field.placeholder}
            value={String(values[field.key] ?? "")}
            onChange={(e) => setValue(field.key, e.target.value)}
            className={inputClass() + " resize-none"}
          />
        );
      case "SELECT":
        return (
          <select
            value={String(values[field.key] ?? "")}
            onChange={(e) => setValue(field.key, e.target.value)}
            className={inputClass()}
          >
            <option value="">Selecione...</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case "CHECKBOX":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(values[field.key])}
              onChange={(e) => setValue(field.key, e.target.checked)}
              className="w-4 h-4 accent-[#0054cd]"
            />
            <span className="text-sm text-[#44474c]">{field.placeholder || field.label}</span>
          </label>
        );
      default:
        return (
          <input
            type={
              field.type === "EMAIL" ? "email" : field.type === "NUMBER" ? "number" : "text"
            }
            placeholder={field.placeholder}
            value={String(values[field.key] ?? "")}
            onChange={(e) => setValue(field.key, e.target.value)}
            className={inputClass()}
          />
        );
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#c4c6cd] p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0b1c30] mb-3">Cadastro enviado com sucesso!</h2>
          <p className="text-[#44474c] text-sm">
            Seu cadastro foi recebido e será analisado em breve. Entraremos em contato pelo e-mail informado.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setValues({});
            }}
            className="mt-6 px-5 py-2 bg-[#0054cd] hover:bg-[#0040a1] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Fazer outro cadastro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <div className="bg-white border-b border-[#c4c6cd] h-16 flex items-center px-8">
        <span className="text-[#0054cd] font-bold text-xl">ConectAguia</span>
      </div>

      <div className="py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0b1c30]">Cadastro de Prestador</h1>
            <p className="text-[#44474c] mt-1">Preencha o formulário abaixo para se cadastrar</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#c4c6cd] p-8 space-y-5"
          >
            {fields.map((field) => (
              <div key={field.key}>
                {field.key !== "terms_accepted" && (
                  <label className="block text-sm font-medium text-[#44474c] mb-1">
                    {field.label}
                    {field.required && " *"}
                  </label>
                )}
                {renderFieldInput(field)}
                {errors[field.key] && (
                  <p className="text-red-500 text-xs mt-1">{errors[field.key]}</p>
                )}
              </div>
            ))}

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0054cd] hover:bg-[#0040a1] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                "Enviando..."
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">send</span>
                  Enviar Cadastro
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

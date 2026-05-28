import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

interface ExtraField {
  key: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
  options: string[];
  minLength?: number;
  maxLength?: number;
}

const schema = z
  .object({
    name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
    documentType: z.enum(["CPF", "CNPJ"]),
    document: z.string().min(11, "Documento inválido"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(14, "Telefone inválido"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().max(2).optional(),
    zipCode: z.string().optional(),
    serviceType: z.string().min(3, "Informe o tipo de serviço"),
    serviceDescription: z.string().optional(),
    termsAccepted: z.boolean().refine((v) => v === true, {
      message: "Você deve aceitar os termos para continuar",
    }),
  })
  .superRefine((data, ctx) => {
    const raw = data.document.replace(/\D/g, "");
    if (data.documentType === "CPF" && !validateCPF(raw)) {
      ctx.addIssue({ code: "custom", path: ["document"], message: "CPF inválido" });
    }
    if (data.documentType === "CNPJ" && !validateCNPJ(raw)) {
      ctx.addIssue({ code: "custom", path: ["document"], message: "CNPJ inválido" });
    }
  });

type FormData = z.infer<typeof schema>;

export default function CadastroPage() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [extraFields, setExtraFields] = useState<ExtraField[]>([]);
  const [extraValues, setExtraValues] = useState<Record<string, string | boolean>>({});
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<{ fields: ExtraField[] }>("/form-config").then((r) => {
      setExtraFields(r.data.fields ?? []);
    }).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { documentType: "CPF" },
  });

  const docType = watch("documentType");

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked =
      docType === "CPF" ? maskCPF(e.target.value) : maskCNPJ(e.target.value);
    setValue("document", masked, { shouldValidate: false });
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("phone", maskPhone(e.target.value), { shouldValidate: false });
  }

  function handleCEPChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("zipCode", maskCEP(e.target.value), { shouldValidate: false });
  }

  function validateExtraFields() {
    const errs: Record<string, string> = {};
    for (const f of extraFields) {
      const val = extraValues[f.key];
      if (f.required && (val === undefined || val === "" || val === false)) {
        errs[f.key] = `${f.label} é obrigatório`;
      }
      if (typeof val === "string" && f.minLength && val.length < f.minLength) {
        errs[f.key] = `Mínimo ${f.minLength} caracteres`;
      }
      if (typeof val === "string" && f.maxLength && val.length > f.maxLength) {
        errs[f.key] = `Máximo ${f.maxLength} caracteres`;
      }
    }
    setExtraErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(data: FormData) {
    if (!validateExtraFields()) return;
    setServerError("");
    try {
      await api.post("/providers", {
        ...data,
        document: data.document.replace(/\D/g, ""),
        phone: data.phone.replace(/\D/g, ""),
        zipCode: data.zipCode?.replace(/\D/g, ""),
        extraFields: extraValues,
      });
      setSuccess(true);
      reset();
      setExtraValues({});
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Erro ao enviar cadastro. Tente novamente.";
      setServerError(msg);
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
          <p className="text-[#44474c] text-sm">Seu cadastro foi recebido e será analisado em breve. Entraremos em contato pelo e-mail informado.</p>
          <button
            onClick={() => setSuccess(false)}
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
      {/* Header bar */}
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
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl shadow-[0_4px_12px_rgba(4,22,39,0.05)] border border-[#c4c6cd] p-8 space-y-6"
        >
          {/* Dados pessoais */}
          <section>
            <h2 className="text-lg font-semibold text-[#0b1c30] mb-4 pb-2 border-b border-[#c4c6cd] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0054cd]">person</span>
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  Nome completo / Razão social *
                </label>
                <input
                  {...register("name")}
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                  placeholder="João Silva"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  Tipo de documento *
                </label>
                <select
                  {...register("documentType")}
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                  onChange={(e) => {
                    setValue("documentType", e.target.value as "CPF" | "CNPJ");
                    setValue("document", "");
                  }}
                >
                  <option value="CPF">CPF (Pessoa Física)</option>
                  <option value="CNPJ">CNPJ (Pessoa Jurídica)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  {docType === "CPF" ? "CPF *" : "CNPJ *"}
                </label>
                <input
                  {...register("document")}
                  onChange={handleDocChange}
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                  placeholder={docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                />
                {errors.document && (
                  <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  E-mail *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  Telefone *
                </label>
                <input
                  {...register("phone")}
                  onChange={handlePhoneChange}
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Endereço */}
          <section>
            <h2 className="text-lg font-semibold text-[#0b1c30] mb-4 pb-2 border-b border-[#c4c6cd] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0054cd]">location_on</span>
              Endereço (opcional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  Endereço
                </label>
                <input
                  {...register("address")}
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  Cidade
                </label>
                <input
                  {...register("city")}
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#44474c] mb-1">
                    UF
                  </label>
                  <input
                    {...register("state")}
                    className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd] uppercase"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#44474c] mb-1">
                    CEP
                  </label>
                  <input
                    {...register("zipCode")}
                    onChange={handleCEPChange}
                    className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Serviço */}
          <section>
            <h2 className="text-lg font-semibold text-[#0b1c30] mb-4 pb-2 border-b border-[#c4c6cd] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0054cd]">construction</span>
              Serviço Prestado
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  Tipo de serviço *
                </label>
                <input
                  {...register("serviceType")}
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                  placeholder="Ex: Encanador, Eletricista, Designer Gráfico..."
                />
                {errors.serviceType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.serviceType.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#44474c] mb-1">
                  Descrição do serviço
                </label>
                <textarea
                  {...register("serviceDescription")}
                  rows={3}
                  className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd] resize-none"
                  placeholder="Descreva brevemente os serviços que você oferece..."
                />
              </div>
            </div>
          </section>

          {/* Campos extras configurados pelo gestor */}
          {extraFields.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-[#041627] mb-4 pb-2 border-b border-[#c4c6cd]">
                Informações Complementares
              </h2>
              <div className="space-y-4">
                {extraFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-[#44474c] mb-1">
                      {field.label} {field.required && "*"}
                    </label>
                    {field.type === "TEXTAREA" ? (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder}
                        value={String(extraValues[field.key] ?? "")}
                        onChange={(e) => setExtraValues((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd] resize-none"
                      />
                    ) : field.type === "SELECT" ? (
                      <select
                        value={String(extraValues[field.key] ?? "")}
                        onChange={(e) => setExtraValues((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                      >
                        <option value="">Selecione...</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "CHECKBOX" ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(extraValues[field.key])}
                          onChange={(e) => setExtraValues((p) => ({ ...p, [field.key]: e.target.checked }))}
                          className="w-4 h-4 accent-[#0054cd]"
                        />
                        <span className="text-sm text-[#44474c]">{field.placeholder || field.label}</span>
                      </label>
                    ) : (
                      <input
                        type={field.type === "NUMBER" ? "number" : field.type === "EMAIL" ? "email" : "text"}
                        placeholder={field.placeholder}
                        value={String(extraValues[field.key] ?? "")}
                        onChange={(e) => setExtraValues((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] focus:border-[#0054cd]"
                      />
                    )}
                    {extraErrors[field.key] && (
                      <p className="text-red-500 text-xs mt-1">{extraErrors[field.key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* LGPD */}
          <section className="bg-[#eff4ff] rounded-xl p-4 border border-[#c4c6cd]">
            <h2 className="text-sm font-semibold text-[#0b1c30] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0054cd]">gavel</span>
              Termos e Privacidade (LGPD)
            </h2>
            <p className="text-xs text-[#44474c] mb-3">
              Seus dados serão tratados conforme a Lei Geral de Proteção de Dados
              (Lei 13.709/2018).
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register("termsAccepted")}
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-[#0054cd]"
              />
              <span className="text-sm text-[#44474c]">
                Li e aceito os{" "}
                <a
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0054cd] hover:underline font-medium"
                >
                  Termos de Uso e Política de Privacidade
                </a>
                . Consinto com o tratamento dos meus dados para as finalidades
                descritas.
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="text-red-500 text-xs mt-2">
                {errors.termsAccepted.message}
              </p>
            )}
          </section>

          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0054cd] hover:bg-[#0040a1] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Enviando..." : (
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

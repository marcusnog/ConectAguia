import { useState } from "react";
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

const schema = z
  .object({
    name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
    documentType: z.enum(["CPF", "CNPJ"]),
    document: z.string().min(11, "Documento inválido"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(14, "Telefone inválido"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z
      .string()
      .max(2)
      .optional()
      .transform((v) => v?.toUpperCase()),
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

  async function onSubmit(data: FormData) {
    setServerError("");
    try {
      await api.post("/providers", {
        ...data,
        document: data.document.replace(/\D/g, ""),
        phone: data.phone.replace(/\D/g, ""),
        zipCode: data.zipCode?.replace(/\D/g, ""),
      });
      setSuccess(true);
      reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Erro ao enviar cadastro. Tente novamente.";
      setServerError(msg);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Cadastro enviado!</h2>
          <p className="text-gray-500">Seu cadastro foi recebido e será analisado em breve.</p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-6 text-blue-600 hover:underline text-sm"
          >
            Fazer outro cadastro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ConectAguia</h1>
          <p className="text-gray-500 mt-1">Cadastro de Prestador de Serviço</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6"
        >
          {/* Dados pessoais */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo / Razão social *
                </label>
                <input
                  {...register("name")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="João Silva"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de documento *
                </label>
                <select
                  {...register("documentType")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {docType === "CPF" ? "CPF *" : "CNPJ *"}
                </label>
                <input
                  {...register("document")}
                  onChange={handleDocChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={docType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                />
                {errors.document && (
                  <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  {...register("phone")}
                  onChange={handlePhoneChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
              Endereço (opcional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  {...register("address")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  {...register("city")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UF
                  </label>
                  <input
                    {...register("state")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    {...register("zipCode")}
                    onChange={handleCEPChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Serviço */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
              Serviço Prestado
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de serviço *
                </label>
                <input
                  {...register("serviceType")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Encanador, Eletricista, Designer Gráfico..."
                />
                {errors.serviceType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.serviceType.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição do serviço
                </label>
                <textarea
                  {...register("serviceDescription")}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Descreva brevemente os serviços que você oferece..."
                />
              </div>
            </div>
          </section>

          {/* LGPD */}
          <section className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h2 className="text-sm font-semibold text-blue-800 mb-2">
              Termos e Privacidade (LGPD)
            </h2>
            <p className="text-xs text-blue-700 mb-3">
              Seus dados serão tratados conforme a Lei Geral de Proteção de Dados
              (Lei 13.709/2018).
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register("termsAccepted")}
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">
                Li e aceito os{" "}
                <a
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors text-sm"
          >
            {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}

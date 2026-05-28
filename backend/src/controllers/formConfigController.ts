import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

const DEFAULT_CORE_FIELDS = [
  { key: "name", label: "Nome completo / Razão social", type: "TEXT", placeholder: "João Silva", required: true, order: 0, options: [], isCore: true, isVisible: true },
  { key: "document_type", label: "Tipo de documento", type: "SELECT", placeholder: "", required: true, order: 1, options: ["CPF", "CNPJ"], isCore: true, isVisible: true },
  { key: "document", label: "CPF / CNPJ", type: "TEXT", placeholder: "000.000.000-00", required: true, order: 2, options: [], isCore: true, isVisible: true },
  { key: "email", label: "E-mail", type: "EMAIL", placeholder: "seu@email.com", required: true, order: 3, options: [], isCore: true, isVisible: true },
  { key: "phone", label: "Telefone", type: "PHONE", placeholder: "(00) 00000-0000", required: true, order: 4, options: [], isCore: true, isVisible: true },
  { key: "address", label: "Endereço", type: "TEXT", placeholder: "Rua, número, bairro", required: false, order: 5, options: [], isCore: true, isVisible: true },
  { key: "city", label: "Cidade", type: "TEXT", placeholder: "", required: false, order: 6, options: [], isCore: true, isVisible: true },
  { key: "state", label: "UF", type: "TEXT", placeholder: "SP", required: false, order: 7, options: [], isCore: true, isVisible: true },
  { key: "zip_code", label: "CEP", type: "TEXT", placeholder: "00000-000", required: false, order: 8, options: [], isCore: true, isVisible: true },
  { key: "service_type", label: "Tipo de serviço", type: "TEXT", placeholder: "Ex: Encanador, Eletricista...", required: true, order: 9, options: [], isCore: true, isVisible: true },
  { key: "service_description", label: "Descrição do serviço", type: "TEXTAREA", placeholder: "Descreva brevemente os serviços que você oferece...", required: false, order: 10, options: [], isCore: true, isVisible: true },
  { key: "terms_accepted", label: "Termos e Privacidade (LGPD)", type: "CHECKBOX", placeholder: "", required: true, order: 11, options: [], isCore: true, isVisible: true },
] as const;

async function getOrSeedDraft() {
  const schema = await prisma.formSchema.findFirst({
    include: { fields: { orderBy: { order: "asc" } } },
    orderBy: { version: "desc" },
  });

  const hasCoreFields = schema?.fields.some((f) => f.isCore) ?? false;
  if (schema && hasCoreFields) return schema;

  const existingCustomFields = (schema?.fields ?? []).filter((f) => !f.isCore);
  const version = schema ? schema.version + 1 : 1;

  return prisma.formSchema.create({
    data: {
      version,
      published: false,
      fields: {
        create: [
          ...DEFAULT_CORE_FIELDS.map((f) => ({
            key: f.key,
            label: f.label,
            type: f.type as any,
            placeholder: f.placeholder || undefined,
            required: f.required,
            order: f.order,
            options: { set: [...f.options] },
            isCore: true,
            isVisible: true,
          })),
          ...existingCustomFields.map((f, i) => ({
            key: f.key,
            label: f.label,
            type: f.type,
            placeholder: f.placeholder ?? undefined,
            required: f.required,
            order: DEFAULT_CORE_FIELDS.length + i,
            options: { set: f.options },
            minLength: f.minLength ?? undefined,
            maxLength: f.maxLength ?? undefined,
            isCore: false,
            isVisible: true,
          })),
        ],
      },
    },
    include: { fields: { orderBy: { order: "asc" } } },
  });
}

export async function getPublishedForm(_req: Request, res: Response) {
  const schema = await prisma.formSchema.findFirst({
    where: { published: true },
    include: {
      fields: {
        where: { isVisible: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { version: "desc" },
  });
  res.json(schema ?? { fields: [] });
}

export async function getDraftForm(_req: AuthRequest, res: Response) {
  const schema = await getOrSeedDraft();
  res.json(schema);
}

export async function saveDraftForm(req: AuthRequest, res: Response) {
  const { fields } = req.body as {
    fields: {
      key: string;
      label: string;
      type: string;
      placeholder?: string;
      required: boolean;
      order: number;
      options?: string[];
      minLength?: number;
      maxLength?: number;
      isCore?: boolean;
      isVisible?: boolean;
    }[];
  };

  const latest = await prisma.formSchema.findFirst({
    orderBy: { version: "desc" },
  });

  const version = latest ? latest.version + 1 : 1;

  const schema = await prisma.formSchema.create({
    data: {
      version,
      published: false,
      fields: {
        create: fields.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type as any,
          placeholder: f.placeholder || undefined,
          required: f.required,
          order: f.order,
          options: { set: f.options ?? [] },
          minLength: f.minLength,
          maxLength: f.maxLength,
          isCore: f.isCore ?? false,
          isVisible: f.isVisible ?? true,
        })),
      },
    },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  res.json(schema);
}

export async function publishForm(req: AuthRequest, res: Response) {
  const id = req.params["id"] as string;

  await prisma.formSchema.updateMany({
    where: { published: true },
    data: { published: false },
  });

  const schema = await prisma.formSchema.update({
    where: { id },
    data: { published: true, publishedAt: new Date() },
    include: { fields: { orderBy: { order: "asc" } } },
  });

  res.json(schema);
}

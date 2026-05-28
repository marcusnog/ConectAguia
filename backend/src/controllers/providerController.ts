import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { DocumentType, ProviderStatus } from "@prisma/client";

const CORE_KEY_MAP: Record<string, string> = {
  name: "name",
  document_type: "documentType",
  document: "document",
  email: "email",
  phone: "phone",
  address: "address",
  city: "city",
  state: "state",
  zip_code: "zipCode",
  service_type: "serviceType",
  service_description: "serviceDescription",
  terms_accepted: "termsAccepted",
};

function mapFields(body: Record<string, unknown>) {
  const providerData: Record<string, unknown> = {};
  const extraFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    const mappedKey = CORE_KEY_MAP[key];
    if (mappedKey) {
      providerData[mappedKey] = value;
    } else {
      extraFields[key] = value;
    }
  }

  return { providerData, extraFields };
}

export async function createProvider(req: Request, res: Response): Promise<void> {
  const { providerData, extraFields } = mapFields(req.body as Record<string, unknown>);

  const email = providerData["email"] as string | undefined;
  const termsAccepted = providerData["termsAccepted"];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "E-mail inválido ou ausente" });
    return;
  }

  if (termsAccepted !== true && termsAccepted !== "true") {
    res.status(400).json({ error: "Aceite dos termos obrigatório (LGPD)" });
    return;
  }

  const existing = await prisma.provider.findFirst({
    where: {
      OR: [
        { email },
        ...(providerData["document"] ? [{ document: providerData["document"] as string }] : []),
      ],
    },
  });

  if (existing) {
    res.status(409).json({ error: "CPF/CNPJ ou e-mail já cadastrado" });
    return;
  }

  const termsVersion = process.env.TERMS_VERSION || "v1.0";

  const provider = await prisma.provider.create({
    data: {
      name: (providerData["name"] as string) ?? null,
      documentType: (providerData["documentType"] as DocumentType) ?? null,
      document: (providerData["document"] as string) ?? null,
      email,
      phone: (providerData["phone"] as string) ?? null,
      address: (providerData["address"] as string) ?? null,
      city: (providerData["city"] as string) ?? null,
      state: (providerData["state"] as string) ?? null,
      zipCode: (providerData["zipCode"] as string) ?? null,
      serviceType: (providerData["serviceType"] as string) ?? null,
      serviceDescription: (providerData["serviceDescription"] as string) ?? null,
      extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
      termsAccepted: true,
      termsVersion,
      consentLogs: {
        create: {
          ip: req.ip,
          userAgent: Array.isArray(req.headers["user-agent"])
            ? req.headers["user-agent"][0]
            : req.headers["user-agent"],
          termsVersion,
        },
      },
    },
  });

  res.status(201).json(provider);
}

export async function listProviders(req: Request, res: Response): Promise<void> {
  const { status, search, page = "1", limit = "20" } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (status) where.status = status as ProviderStatus;
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: "insensitive" } },
      { email: { contains: search as string, mode: "insensitive" } },
      { document: { contains: search as string } },
      { serviceType: { contains: search as string, mode: "insensitive" } },
    ];
  }

  const [providers, total] = await Promise.all([
    prisma.provider.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, documentType: true, document: true,
        email: true, phone: true, serviceType: true,
        status: true, termsAccepted: true, createdAt: true,
      },
    }),
    prisma.provider.count({ where }),
  ]);

  res.json({ providers, total, page: pageNum, limit: limitNum });
}

export async function getProvider(req: Request, res: Response): Promise<void> {
  const id = req.params["id"] as string;

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: { consentLogs: true },
  });

  if (!provider) {
    res.status(404).json({ error: "Prestador não encontrado" });
    return;
  }

  res.json(provider);
}

export async function updateProviderStatus(req: Request, res: Response): Promise<void> {
  const id = req.params["id"] as string;
  const { status } = req.body;

  const validStatuses = ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Status inválido" });
    return;
  }

  const provider = await prisma.provider.update({
    where: { id },
    data: { status: status as ProviderStatus },
  });

  res.json(provider);
}

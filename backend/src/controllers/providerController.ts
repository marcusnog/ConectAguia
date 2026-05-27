import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { DocumentType, ProviderStatus } from "@prisma/client";

export async function createProvider(req: Request, res: Response): Promise<void> {
  const {
    name, documentType, document, email, phone,
    address, city, state, zipCode,
    serviceType, serviceDescription,
    termsAccepted,
  } = req.body;

  if (!termsAccepted) {
    res.status(400).json({ error: "Aceite dos termos obrigatório (LGPD)" });
    return;
  }

  const termsVersion = process.env.TERMS_VERSION || "v1.0-teste";

  const existing = await prisma.provider.findFirst({
    where: { OR: [{ document }, { email }] },
  });

  if (existing) {
    res.status(409).json({ error: "CPF/CNPJ ou e-mail já cadastrado" });
    return;
  }

  const provider = await prisma.provider.create({
    data: {
      name, documentType: documentType as DocumentType, document,
      email, phone, address, city, state, zipCode,
      serviceType, serviceDescription,
      termsAccepted, termsVersion,
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

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
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

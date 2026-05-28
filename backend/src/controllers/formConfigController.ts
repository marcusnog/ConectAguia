import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

export async function getPublishedForm(_req: Request, res: Response) {
  const schema = await prisma.formSchema.findFirst({
    where: { published: true },
    include: { fields: { orderBy: { order: "asc" } } },
    orderBy: { version: "desc" },
  });
  res.json(schema ?? { fields: [] });
}

export async function getDraftForm(_req: AuthRequest, res: Response) {
  const schema = await prisma.formSchema.findFirst({
    include: { fields: { orderBy: { order: "asc" } } },
    orderBy: { version: "desc" },
  });
  res.json(schema ?? { fields: [] });
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
          placeholder: f.placeholder,
          required: f.required,
          order: f.order,
          options: { set: f.options ?? [] },
          minLength: f.minLength,
          maxLength: f.maxLength,
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

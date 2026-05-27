import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email e senha obrigatórios" });
    return;
  }

  const manager = await prisma.manager.findUnique({ where: { email } });

  if (!manager) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const valid = await bcrypt.compare(password, manager.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const token = jwt.sign(
    { managerId: manager.id },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as `${number}${"s" | "m" | "h" | "d"}` }
  );

  res.json({
    token,
    manager: { id: manager.id, name: manager.name, email: manager.email },
  });
}

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const IS_PROD = process.env.NODE_ENV === "production";
const TOKEN_MAX_AGE_SECONDS = 8 * 60 * 60; // 8h

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    maxAge: TOKEN_MAX_AGE_SECONDS * 1000,
    path: "/",
  });
}

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

  const expiresIn = (process.env.JWT_EXPIRES_IN || "8h") as `${number}${"s" | "m" | "h" | "d"}`;
  const token = jwt.sign(
    { managerId: manager.id },
    process.env.JWT_SECRET!,
    { expiresIn }
  );

  setAuthCookie(res, token);

  res.json({
    manager: { id: manager.id, name: manager.name, email: manager.email },
  });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie("token", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    path: "/",
  });
  res.json({ ok: true });
}

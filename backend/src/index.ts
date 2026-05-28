import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import providerRoutes from "./routes/providers";
import formConfigRoutes from "./routes/formConfig";

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://marcusnog.github.io",
]);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/form-config", formConfigRoutes);

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});

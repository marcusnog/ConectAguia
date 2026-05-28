import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createProvider,
  listProviders,
  getProvider,
  updateProviderStatus,
} from "../controllers/providerController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: "Muitas tentativas de cadastro. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Público — cadastro do prestador (com rate limit + validação)
router.post("/", registrationLimiter, createProvider);

// Privado — gestor autenticado
router.get("/", authMiddleware, listProviders);
router.get("/:id", authMiddleware, getProvider);
router.patch("/:id/status", authMiddleware, updateProviderStatus);

export default router;

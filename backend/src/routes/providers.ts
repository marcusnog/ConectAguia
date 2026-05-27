import { Router } from "express";
import {
  createProvider,
  listProviders,
  getProvider,
  updateProviderStatus,
} from "../controllers/providerController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Público — cadastro do prestador
router.post("/", createProvider);

// Privado — gestor autenticado
router.get("/", authMiddleware, listProviders);
router.get("/:id", authMiddleware, getProvider);
router.patch("/:id/status", authMiddleware, updateProviderStatus);

export default router;

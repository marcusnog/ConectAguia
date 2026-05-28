import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getPublishedForm,
  getDraftForm,
  saveDraftForm,
  publishForm,
} from "../controllers/formConfigController";

const router = Router();

router.get("/", getPublishedForm);
router.get("/draft", authMiddleware, getDraftForm);
router.post("/draft", authMiddleware, saveDraftForm);
router.post("/:id/publish", authMiddleware, publishForm);

export default router;

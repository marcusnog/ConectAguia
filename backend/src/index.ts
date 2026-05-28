import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import providerRoutes from "./routes/providers";

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: ["http://localhost:5173", "https://marcusnog.github.io"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});

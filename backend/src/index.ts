import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import domainRoutes from "./routes/domains";
import linkRoutes from "./routes/links";
import miscRoutes from "./routes/misc";
import { authMiddleware } from "./middleware/auth";

export const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public routes (no auth)
app.use("/api", miscRoutes);

// Protected routes
app.use("/api/domains", authMiddleware, domainRoutes);
app.use("/api/links", linkRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Serve frontend in production
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

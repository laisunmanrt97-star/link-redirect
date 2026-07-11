import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { kvPut, kvDelete } from "../services/cloudflare";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod";

const router = Router();
const protectedRouter = Router();

const createSchema = z.object({
  domainId: z.string().uuid(),
  subdomain: z.string().min(1).max(63),
  destinationUrl: z.string().url(),
});

const updateSchema = z.object({
  destinationUrl: z.string().url().optional(),
  active: z.boolean().optional(),
});

// ── Rutas públicas ───────────────────────────────────────────

// Track click (llamado por el Worker vía ctx.waitUntil)
router.post("/:id/track-click", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link) return res.status(404).json({ error: "Link no encontrado" });

  await prisma.$transaction([
    prisma.link.update({ where: { id }, data: { clicks: { increment: 1 } } }),
    prisma.clickEvent.create({ data: { linkId: id } }),
  ]);

  res.status(204).send();
});

// Stats por link
router.get("/:id/stats", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const link = await prisma.link.findUnique({ where: { id }, include: { domain: true } });
  if (!link) return res.status(404).json({ error: "Link no encontrado" });

  const raw = await prisma.$queryRawUnsafe<{ date: Date; count: bigint }[]>(
    `SELECT DATE(date) as date, COUNT(*) as count FROM click_events WHERE link_id = $1 AND date >= $2 GROUP BY DATE(date) ORDER BY date ASC`,
    id,
    sevenDaysAgo
  );

  const stats: { date: string; clicks: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split("T")[0];
    const found = raw.find(
      (r) => r.date.toISOString().split("T")[0] === dayStr
    );
    stats.push({ date: dayStr, clicks: found ? Number(found.count) : 0 });
  }

  res.json({ link, clicksByDay: stats });
});

// ── Rutas protegidas ──────────────────────────────────────────

protectedRouter.use(authMiddleware);

// Listar links
protectedRouter.get("/", async (req: Request, res: Response) => {
  const where = req.query.domainId ? { domainId: req.query.domainId as string } : {};
  const links = await prisma.link.findMany({
    where,
    include: { domain: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(links);
});

// Crear link (Postgres + KV)
protectedRouter.post("/", async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);

  const domain = await prisma.domain.findUnique({ where: { id: data.domainId } });
  if (!domain) return res.status(404).json({ error: "Dominio no encontrado" });

  const existing = await prisma.link.findUnique({
    where: { domainId_subdomain: { domainId: data.domainId, subdomain: data.subdomain } },
  });
  if (existing) return res.status(409).json({ error: "Ese subdominio ya existe en este dominio" });

  const link = await prisma.link.create({
    data: { domainId: data.domainId, subdomain: data.subdomain, destinationUrl: data.destinationUrl },
    include: { domain: true },
  });

  const hostname = `${data.subdomain}.${domain.name}`;
  try {
    await kvPut(hostname, data.destinationUrl);
    await kvPut(`${hostname}:id`, link.id);
  } catch (err) {
    await prisma.link.update({ where: { id: link.id }, data: { active: false } });
    return res.status(201).json({ link, kvError: "No se pudo escribir en Cloudflare KV. Link creado pero inactivo." });
  }

  res.status(201).json(link);
});

// Actualizar link
protectedRouter.patch("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = updateSchema.parse(req.body);
  const link = await prisma.link.findUnique({ where: { id }, include: { domain: true } });
  if (!link) return res.status(404).json({ error: "Link no encontrado" });

  const updated = await prisma.link.update({ where: { id }, data, include: { domain: true } });

  const hostname = `${link.subdomain}.${link.domain.name}`;
  try {
    if (updated.active) {
      await kvPut(hostname, updated.destinationUrl);
      await kvPut(`${hostname}:id`, updated.id);
    } else {
      await kvDelete(hostname);
      await kvDelete(`${hostname}:id`);
    }
  } catch (err) {
    console.error("Error syncing KV:", err);
  }

  res.json(updated);
});

// Eliminar link
protectedRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const link = await prisma.link.findUnique({ where: { id }, include: { domain: true } });
  if (!link) return res.status(404).json({ error: "Link no encontrado" });

  await prisma.link.delete({ where: { id } });

  const hostname = `${link.subdomain}.${link.domain.name}`;
  try {
    await kvDelete(hostname);
    await kvDelete(`${hostname}:id`);
  } catch (err) {
    console.error("Error deleting from KV:", err);
  }

  res.status(204).send();
});

// Mount protected routes
router.use("/", protectedRouter);

export default router;

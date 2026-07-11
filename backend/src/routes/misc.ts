import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { kvPut, listZones } from "../services/cloudflare";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const n8nSchema = z.object({
  domain: z.string().min(1),
  subdomain: z.string().min(1).max(63),
  destination: z.string().url(),
});

// Endpoint para n8n: crear link desde un webhook (autenticado con token)
router.post("/n8n/link", authMiddleware, async (req: Request, res: Response) => {
  const data = n8nSchema.parse(req.body);

  const domain = await prisma.domain.findUnique({ where: { name: data.domain } });
  if (!domain) return res.status(404).json({ error: "Dominio no encontrado. Crealo primero en el dashboard." });

  const existing = await prisma.link.findUnique({
    where: { domainId_subdomain: { domainId: domain.id, subdomain: data.subdomain } },
  });
  if (existing) return res.status(409).json({ error: "Ese subdominio ya existe" });

  const link = await prisma.link.create({
    data: { domainId: domain.id, subdomain: data.subdomain, destinationUrl: data.destination },
    include: { domain: true },
  });

  const hostname = `${data.subdomain}.${domain.name}`;
  try {
    await kvPut(hostname, data.destination);
    await kvPut(`${hostname}:id`, link.id);
  } catch (err) {
    await prisma.link.update({ where: { id: link.id }, data: { active: false } });
    return res.json({ link, kvError: "Link creado en DB pero falló KV. Revisá las credenciales de Cloudflare." });
  }

  res.status(201).json({ url: `https://${hostname}`, link });
});

// Export CSV de todos los links
router.get("/links/export", authMiddleware, async (_req: Request, res: Response) => {
  const links = await prisma.link.findMany({
    include: { domain: true },
    orderBy: { createdAt: "desc" },
  });

  const csv = [
    "subdominio,dominio,url_destino,activo,clicks,creado",
    ...links.map((l: { subdomain: string; domain: { name: string }; destinationUrl: string; active: boolean; clicks: number; createdAt: Date }) =>
      `${l.subdomain},${l.domain.name},${l.destinationUrl},${l.active},${l.clicks},${l.createdAt.toISOString()}`
    ),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=redirect-links.csv");
  res.send(csv);
});

// Proxy para listar zonas de Cloudflare (para el selector del dashboard)
router.get("/cloudflare-zones", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const zones = await listZones();
    res.json(zones);
  } catch (err) {
    res.status(502).json({ error: "Error al conectar con Cloudflare API" });
  }
});

export default router;

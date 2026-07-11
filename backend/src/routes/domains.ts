import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { createWildcardDnsRecord, createWorkerRoute } from "../services/cloudflare";
import { z } from "zod";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  cloudflareZoneId: z.string().optional(),
});

router.get("/", async (_req: Request, res: Response) => {
  const domains = await prisma.domain.findMany({ include: { _count: { select: { links: true } } } });
  res.json(domains);
});

router.post("/", async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  const domain = await prisma.domain.create({ data: { name: data.name } });

  if (data.cloudflareZoneId) {
    try {
      await createWildcardDnsRecord(data.cloudflareZoneId, data.name);
      await createWorkerRoute(data.cloudflareZoneId, `*.${data.name}/*`, "redirect-worker");
      await prisma.domain.update({
        where: { id: domain.id },
        data: { cloudflareZoneId: data.cloudflareZoneId, wildcardConfigured: true },
      });
    } catch (err) {
      return res.status(201).json({ domain, cfError: "No se pudo configurar Cloudflare automáticamente" });
    }
  }

  const updated = await prisma.domain.findUnique({ where: { id: domain.id }, include: { _count: { select: { links: true } } } });
  res.status(201).json(updated);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await prisma.domain.delete({ where: { id: req.params.id as string } });
  res.status(204).send();
});

export default router;

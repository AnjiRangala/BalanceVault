import { Router } from 'express';
import { z } from 'zod';
import { createAuthenticate } from '../middleware/authenticate.js';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

function redactMetadata(value) {
  if (Array.isArray(value)) return value.map(redactMetadata);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => {
    if (/password|secret|token|hash|database|connection|string|sql/i.test(key)) return [key, '[REDACTED]'];
    return [key, redactMetadata(nested)];
  }));
}

export function createAuditRouter(prismaClient) {
  const router = Router();
  router.use(createAuthenticate(prismaClient));

  router.get('/', async (request, response, next) => {
    if (request.auth.role !== 'ADMIN') {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({ error: 'Invalid audit pagination parameters' });
      return;
    }

    const { page, perPage } = parsed.data;
    try {
      const events = await prismaClient.auditLog.findMany({
        skip: (page - 1) * perPage,
        take: perPage + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          actor: { select: { id: true, email: true, role: true } },
        },
      });
      const hasMore = events.length > perPage;
      response.json({
        events: events.slice(0, perPage).map((event) => ({
          ...event,
          metadata: redactMetadata(event.metadata),
        })),
        page,
        perPage,
        hasMore,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

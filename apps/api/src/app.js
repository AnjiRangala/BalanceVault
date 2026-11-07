import cors from 'cors';
import express from 'express';
import { prisma } from './db/prisma.js';
import { createAccountsRouter } from './routes/accounts.routes.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createAuditRouter } from './routes/audit.routes.js';
import { createFinancialTransactionsRouter } from './routes/financial-transactions.routes.js';
import { validateRuntimeConfig } from './config/runtime.js';
import { redisClient } from './config/redis.js';

const runtimeConfig = validateRuntimeConfig();

export function createApp({
  prismaClient = prisma,
  rateLimitRedisClient = redisClient,
  rateLimitNamespace = 'balancevault',
} = {}) {
  const app = express();

  if (runtimeConfig.production) app.set('trust proxy', 1);
  app.use(cors({ origin: runtimeConfig.origins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ application: 'BalanceVault', status: 'healthy' });
  });

  app.get('/api/ready', async (_request, response) => {
    let timeout;
    try {
      await Promise.race([
        prismaClient.$queryRaw`SELECT 1`,
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Readiness query timed out')), runtimeConfig.databaseReadyTimeoutMillis);
          timeout.unref?.();
        }),
      ]);
      response.status(200).json({ application: 'BalanceVault', status: 'ready' });
    } catch {
      response.status(503).json({ application: 'BalanceVault', status: 'not_ready' });
    } finally {
      clearTimeout(timeout);
    }
  });

  app.use('/api/auth', createAuthRouter(prismaClient, {
    redisClient: rateLimitRedisClient,
    keyPrefix: rateLimitNamespace,
  }));
  app.use('/api/audit', createAuditRouter(prismaClient));
  app.use('/api/accounts', createAccountsRouter(prismaClient));
  app.use('/api', createFinancialTransactionsRouter(prismaClient));

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API route not found' });
  });

  app.use((error, _request, response, _next) => {
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
      ? error.status
      : 500;

    if (status >= 500) {
      console.error('Unhandled request error', { name: error?.name ?? 'Error' });
    }

    response.status(status).json({
      error: status >= 500 ? 'Internal server error' : error.message,
    });
  });

  return app;
}

const app = createApp();

export default app;

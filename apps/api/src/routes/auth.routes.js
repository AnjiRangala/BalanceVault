import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { z } from 'zod';
import { createRateLimitSendCommand, requireRedisReady } from '../config/redis.js';
import {
  authenticateCredentials,
  INVALID_CREDENTIALS,
  isUniqueEmailViolation,
  issueAccessToken,
  registerAccountHolder,
  safeUser,
} from '../services/auth.service.js';

const registerSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(12).refine(
    (password) => Buffer.byteLength(password, 'utf8') <= 72,
    'Password must be no more than 72 UTF-8 bytes',
  ),
});

const loginSchema = z.strictObject({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(1024),
});

function createLimiter(limit, message, redisClient, prefix) {
  let limiter;
  return (request, response, next) => {
    limiter ??= rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      passOnStoreError: false,
      // This limiter is instantiated once, on the first request after Redis is
      // verified ready, to avoid opening Redis during non-auth app boot/tests.
      validate: { creationStack: false },
      store: new RedisStore({
        sendCommand: createRateLimitSendCommand(redisClient),
        prefix,
      }),
      handler: (_request, result) => result.status(429).json({ error: message }),
    });
    limiter(request, response, next);
  };
}

export function createAuthRouter(prismaClient, { redisClient, keyPrefix = 'balancevault' }) {
  const router = Router();
  const redisReady = requireRedisReady(redisClient);
  const registrationLimiter = createLimiter(5, 'Too many registration attempts. Try again later.', redisClient, `${keyPrefix}:register:`);
  const loginLimiter = createLimiter(10, 'Too many login attempts. Try again later.', redisClient, `${keyPrefix}:login:`);

  router.post('/register', redisReady, registrationLimiter, async (request, response, next) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Name, valid email, and a valid password are required' });
      return;
    }

    try {
      const user = await registerAccountHolder(prismaClient, {
        email: parsed.data.email,
        password: parsed.data.password,
      });
      const accessToken = issueAccessToken(user);
      response.status(201).json({
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        user: safeUser(user),
      });
    } catch (error) {
      if (isUniqueEmailViolation(error)) {
        response.status(409).json({ error: 'Email is already registered' });
        return;
      }
      next(error);
    }
  });

  router.post('/login', redisReady, loginLimiter, async (request, response, next) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Email and password are required' });
      return;
    }

    try {
      const user = await authenticateCredentials(
        prismaClient,
        parsed.data.email,
        parsed.data.password,
      );
      if (!user) {
        response.status(401).json({ error: INVALID_CREDENTIALS });
        return;
      }
      response.status(200).json({
        accessToken: issueAccessToken(user),
        tokenType: 'Bearer',
        expiresIn: 900,
        user: safeUser(user),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

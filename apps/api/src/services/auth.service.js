import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import {
  ACCESS_TOKEN_LIFETIME_SECONDS,
  getJwtAccessSecret,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from '../config/auth.js';

const BCRYPT_COST = 12;
export const INVALID_CREDENTIALS = 'Invalid email or password';

export function issueAccessToken(user) {
  return jwt.sign(
    { role: user.role },
    getJwtAccessSecret(),
    {
      algorithm: 'HS256',
      subject: user.id,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: ACCESS_TOKEN_LIFETIME_SECONDS,
    },
  );
}

export async function registerAccountHolder(prismaClient, { email, password }) {
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const [user] = await prismaClient.$queryRaw`
    SELECT *
      FROM public.create_account_holder(
        ${id}::uuid,
        ${email}::text,
        ${passwordHash}::text
      )
  `;

  return user;
}

export async function authenticateCredentials(prismaClient, email, password) {
  const user = await prismaClient.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    return null;
  }

  return user;
}

export function isUniqueEmailViolation(error) {
  const driverCause = error?.meta?.driverAdapterError?.cause;
  if (error?.code === 'P2002') {
    const target = error.meta?.target;
    return !target || (Array.isArray(target) ? target.includes('email') : String(target).includes('email'));
  }
  if (error?.meta?.code === '23505' || error?.cause?.code === '23505') return true;
  return driverCause?.originalCode === '23505'
    && driverCause?.constraint?.index === 'User_email_key';
}

export function safeUser(user) {
  return { id: user.id, email: user.email, role: user.role };
}

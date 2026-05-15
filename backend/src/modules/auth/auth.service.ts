import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../../config/db.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const signupUser = async ({ name, email, password }: { name: string; email: string; password: string }) => {
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new ApiError(409, 'Email already in use', 'CONFLICT');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { name, email: normalizedEmail, passwordHash, provider: 'email' },
    select: { id: true, name: true, email: true },
  });

  const token = signToken({ id: user.id });
  return { user, token };
};

export const loginUser = async ({ email, password }: { email: string; password: string }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) throw new ApiError(401, 'Invalid credentials', 'UNAUTHORIZED');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid credentials', 'UNAUTHORIZED');

  const token = signToken({ id: user.id });
  return { user: { id: user.id, name: user.name, email: user.email }, token };
};

export const getUserById = async (id: string) => {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
  return user;
};

export const googleAuthUser = async (credential: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new ApiError(401, 'Invalid Google token', 'UNAUTHORIZED');

  const { sub: googleId, email, name } = payload;
  if (!email) throw new ApiError(400, 'Google account has no email', 'BAD_REQUEST');

  let user = await db.user.findUnique({
    where: { googleId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      user = await db.user.update({
        where: { id: existing.id },
        data: { googleId },
        select: { id: true, name: true, email: true },
      });
    } else {
      user = await db.user.create({
        data: {
          email: email.toLowerCase(),
          name: name ?? email.split('@')[0],
          googleId,
          provider: 'google',
        },
        select: { id: true, name: true, email: true },
      });
    }
  }

  const token = signToken({ id: user.id });
  return { user, token };
};

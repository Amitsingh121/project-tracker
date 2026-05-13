import bcrypt from 'bcryptjs';
import { db } from '../../config/db.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/ApiError.js';

export const signupUser = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new ApiError(409, 'Email already in use', 'CONFLICT');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { name, email: normalizedEmail, passwordHash },
    select: { id: true, name: true, email: true },
  });

  const token = signToken({ id: user.id });
  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) throw new ApiError(401, 'Invalid credentials', 'UNAUTHORIZED');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid credentials', 'UNAUTHORIZED');

  const token = signToken({ id: user.id });
  return { user: { id: user.id, name: user.name, email: user.email }, token };
};

export const getUserById = async (id) => {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
  return user;
};

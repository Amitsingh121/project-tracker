import { verifyToken } from '../utils/jwt.js';
import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required', 'UNAUTHORIZED'));
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true },
    });
    if (!user) return next(new ApiError(401, 'Authentication required', 'UNAUTHORIZED'));
    req.user = user;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
  }
};

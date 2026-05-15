import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload: object): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string): jwt.JwtPayload & { id: string } =>
  jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & { id: string };

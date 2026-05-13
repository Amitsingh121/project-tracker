import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  // TODO: add refresh token rotation - for now 7d expiry is fine for the assessment

export const verifyToken = (token) =>
  jwt.verify(token, env.JWT_SECRET);

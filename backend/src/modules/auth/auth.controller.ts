import type { Request, Response } from 'express';
import { signupUser, loginUser, getUserById, googleAuthUser } from './auth.service.js';

export const signup = async (req: Request, res: Response) => {
  const result = await signupUser(req.body);
  res.status(201).json({ success: true, data: result });
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.json({ success: true, data: result });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await getUserById(req.user.id);
  res.json({ success: true, data: { user } });
};

export const googleAuth = async (req: Request, res: Response) => {
  const result = await googleAuthUser(req.body.credential);
  res.json({ success: true, data: result });
};

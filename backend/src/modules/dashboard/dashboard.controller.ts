import type { Request, Response } from 'express';
import { getDashboard } from './dashboard.service.js';

export const dashboard = async (req: Request, res: Response) => {
  const data = await getDashboard(req.user.id);
  res.json({ success: true, data });
};

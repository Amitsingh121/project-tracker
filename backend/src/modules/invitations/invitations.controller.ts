import type { Request, Response } from 'express';
import * as service from './invitations.service.js';

export const listInvitations = async (req: Request, res: Response) => {
  const invitations = await service.listMyInvitations(req.user.id);
  res.json({ success: true, data: { invitations } });
};

export const acceptInvitation = async (req: Request, res: Response) => {
  await service.respondToInvitation(req.params.id as string, req.user.id, true);
  res.json({ success: true });
};

export const declineInvitation = async (req: Request, res: Response) => {
  await service.respondToInvitation(req.params.id as string, req.user.id, false);
  res.json({ success: true });
};

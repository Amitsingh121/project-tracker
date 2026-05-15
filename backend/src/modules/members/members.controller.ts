import type { Request, Response } from 'express';
import * as service from './members.service.js';

export const addMember = async (req: Request, res: Response) => {
  const invitation = await service.inviteMember(req.params.projectId as string, req.user.id, req.body.email);
  res.status(201).json({ success: true, data: { invitation } });
};

export const removeMember = async (req: Request, res: Response) => {
  await service.removeMember(req.params.projectId as string, req.params.userId as string);
  res.status(204).end();
};

export const changeMemberRole = async (req: Request, res: Response) => {
  const updated = await service.changeMemberRole(
    req.params.projectId as string,
    req.params.userId as string,
    req.body.role,
  );
  res.json({
    success: true,
    data: {
      member: {
        userId: updated.userId,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role,
      },
    },
  });
};

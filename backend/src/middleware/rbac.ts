import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import type { ProjectRole } from '@prisma/client';

export const requireProjectRole =
  (...roles: ProjectRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = (req.params.projectId || req.params.id) as string;
    const userId = req.user.id;

    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!membership) {
      return next(new ApiError(403, 'You are not a member of this project', 'FORBIDDEN'));
    }

    if (roles.length > 0 && !roles.includes(membership.role)) {
      return next(new ApiError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }

    req.membership = membership;
    next();
  };

export const requireTaskAccess = async (req: Request, res: Response, next: NextFunction) => {
  const taskId = req.params.taskId as string;
  const userId = req.user.id;

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) return next(new ApiError(404, 'Task not found', 'NOT_FOUND'));

  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId } },
  });
  if (!membership) {
    return next(new ApiError(403, 'You are not a member of this project', 'FORBIDDEN'));
  }

  req.task = task;
  req.membership = membership;
  next();
};

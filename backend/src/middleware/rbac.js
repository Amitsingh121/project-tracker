import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export const requireProjectRole = (...roles) =>
  async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id;
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

export const requireTaskAccess = async (req, res, next) => {
  const { taskId } = req.params;
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

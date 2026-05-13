import { db } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

const taskInclude = {
  assignee: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
};

const validateDueDate = (dueDate) => {
  if (!dueDate) return;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (new Date(dueDate) < startOfToday) {
    throw new ApiError(422, 'Due date cannot be in the past', 'VALIDATION_ERROR');
  }
};

export const listTasks = async (projectId, filters) => {
  const { status, assigneeId, priority, search } = filters;
  // TODO: would be nice to add pagination here eventually
  return db.task.findMany({
    where: {
      projectId,
      ...(status && { status }),
      ...(assigneeId && { assigneeId }),
      ...(priority && { priority }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
    },
    include: taskInclude,
    orderBy: { createdAt: 'desc' },
  });
};

export const createTask = async (projectId, userId, data) => {
  const { assigneeId, dueDate, ...rest } = data;

  validateDueDate(dueDate);

  if (assigneeId) {
    const member = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!member) {
      throw new ApiError(422, 'Assignee is not a member of this project', 'VALIDATION_ERROR');
    }
  }

  return db.task.create({
    data: {
      ...rest,
      projectId,
      creatorId: userId,
      ...(assigneeId && { assigneeId }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
    },
    include: taskInclude,
  });
};

export const updateTask = async (task, userId, membership, data) => {
  const { role } = membership;
  const isAdmin = role === 'ADMIN';
  const isCreator = task.creatorId === userId;
  const isAssignee = task.assigneeId === userId;

  if (!isAdmin && !isCreator && !isAssignee) {
    throw new ApiError(403, 'You do not have permission to edit this task', 'FORBIDDEN');
  }

  let allowedData = {};

  if (isAdmin) {
    allowedData = { ...data };
  } else {
    if (isCreator) {
      const { assigneeId: _skip, ...creatorFields } = data;
      Object.assign(allowedData, creatorFields);
    }
    if (isAssignee && data.status !== undefined) {
      allowedData.status = data.status;
    }
  }

  if (Object.keys(allowedData).length === 0) {
    throw new ApiError(403, 'No permitted fields to update', 'FORBIDDEN');
  }

  if (allowedData.dueDate !== undefined && allowedData.dueDate !== null) {
    const incoming = new Date(allowedData.dueDate);
    const current = task.dueDate ? new Date(task.dueDate) : null;
    // Only enforce "not in the past" when the due date is actually changing,
    // so users can still update other fields on tasks that are already overdue.
    if (!current || incoming.getTime() !== current.getTime()) {
      validateDueDate(allowedData.dueDate);
    }
    allowedData.dueDate = incoming;
  }

  return db.task.update({
    where: { id: task.id },
    data: allowedData,
    include: taskInclude,
  });
};

export const deleteTask = async (task, userId, membership) => {
  const isAdmin = membership.role === 'ADMIN';
  const isCreator = task.creatorId === userId;

  if (!isAdmin && !isCreator) {
    throw new ApiError(403, 'Only project admins and task creators can delete tasks', 'FORBIDDEN');
  }

  await db.task.delete({ where: { id: task.id } });
};

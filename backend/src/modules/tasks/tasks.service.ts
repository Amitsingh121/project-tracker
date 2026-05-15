import type { ProjectMember, Task } from '@prisma/client';
import { db } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import type { CreateTaskInput, UpdateTaskInput, ListTasksInput } from './tasks.schema.js';

const taskInclude = {
  assignee: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
};

const validateDueDate = (dueDate: string | undefined | null) => {
  if (!dueDate) return;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (new Date(dueDate) < startOfToday) {
    throw new ApiError(422, 'Due date cannot be in the past', 'VALIDATION_ERROR');
  }
};

export const listTasks = async (projectId: string, filters: ListTasksInput) => {
  const { status, assigneeId, priority, search } = filters;
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

export const createTask = async (projectId: string, userId: string, data: CreateTaskInput) => {
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

export const updateTask = async (
  task: Task,
  userId: string,
  membership: ProjectMember,
  data: UpdateTaskInput,
) => {
  const { role } = membership;
  const isAdmin = role === 'ADMIN';
  const isCreator = task.creatorId === userId;
  const isAssignee = task.assigneeId === userId;

  if (!isAdmin && !isCreator && !isAssignee) {
    throw new ApiError(403, 'You do not have permission to edit this task', 'FORBIDDEN');
  }

  let allowedData: UpdateTaskInput = {};

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
    if (!current || incoming.getTime() !== current.getTime()) {
      validateDueDate(allowedData.dueDate);
    }
    (allowedData as Record<string, unknown>).dueDate = incoming;
  }

  return db.task.update({
    where: { id: task.id },
    data: allowedData as Parameters<typeof db.task.update>[0]['data'],
    include: taskInclude,
  });
};

export const deleteTask = async (task: Task, userId: string, membership: ProjectMember) => {
  const isAdmin = membership.role === 'ADMIN';
  const isCreator = task.creatorId === userId;

  if (!isAdmin && !isCreator) {
    throw new ApiError(403, 'Only project admins and task creators can delete tasks', 'FORBIDDEN');
  }

  await db.task.delete({ where: { id: task.id } });
};

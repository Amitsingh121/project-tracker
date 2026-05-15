import type { Request, Response } from 'express';
import * as service from './tasks.service.js';

export const listTasks = async (req: Request, res: Response) => {
  const tasks = await service.listTasks(req.params.projectId as string, req.query as Parameters<typeof service.listTasks>[1]);
  res.json({ success: true, data: { tasks } });
};

export const createTask = async (req: Request, res: Response) => {
  const task = await service.createTask(req.params.projectId as string, req.user.id, req.body);
  res.status(201).json({ success: true, data: { task } });
};

export const updateTask = async (req: Request, res: Response) => {
  const task = await service.updateTask(req.task, req.user.id, req.membership, req.body);
  res.json({ success: true, data: { task } });
};

export const deleteTask = async (req: Request, res: Response) => {
  await service.deleteTask(req.task, req.user.id, req.membership);
  res.status(204).end();
};

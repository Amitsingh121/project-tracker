import * as service from './tasks.service.js';

export const listTasks = async (req, res) => {
  const tasks = await service.listTasks(req.params.projectId, req.query);
  res.json({ success: true, data: { tasks } });
};

export const createTask = async (req, res) => {
  const task = await service.createTask(req.params.projectId, req.user.id, req.body);
  res.status(201).json({ success: true, data: { task } });
};

export const updateTask = async (req, res) => {
  const task = await service.updateTask(req.task, req.user.id, req.membership, req.body);
  res.json({ success: true, data: { task } });
};

export const deleteTask = async (req, res) => {
  await service.deleteTask(req.task, req.user.id, req.membership);
  res.status(204).end();
};

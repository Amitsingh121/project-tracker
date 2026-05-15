import type { Request, Response } from 'express';
import * as service from './projects.service.js';

export const listProjects = async (req: Request, res: Response) => {
  const projects = await service.listMyProjects(req.user.id);
  res.json({ success: true, data: { projects } });
};

export const createProject = async (req: Request, res: Response) => {
  const project = await service.createProject(req.user.id, req.body);
  res.status(201).json({ success: true, data: { project } });
};

export const getProject = async (req: Request, res: Response) => {
  const project = await service.getProjectById(req.params.id as string, req.user.id);
  res.json({ success: true, data: { project } });
};

export const updateProject = async (req: Request, res: Response) => {
  const project = await service.updateProject(req.params.id as string, req.body);
  res.json({ success: true, data: { project } });
};

export const deleteProject = async (req: Request, res: Response) => {
  await service.deleteProject(req.params.id as string);
  res.status(204).end();
};

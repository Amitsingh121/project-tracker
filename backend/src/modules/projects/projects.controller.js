import * as service from './projects.service.js';

export const listProjects = async (req, res) => {
  const projects = await service.listMyProjects(req.user.id);
  res.json({ success: true, data: { projects } });
};

export const createProject = async (req, res) => {
  const project = await service.createProject(req.user.id, req.body);
  res.status(201).json({ success: true, data: { project } });
};

export const getProject = async (req, res) => {
  const project = await service.getProjectById(req.params.id, req.user.id);
  res.json({ success: true, data: { project } });
};

export const updateProject = async (req, res) => {
  const project = await service.updateProject(req.params.id, req.body);
  res.json({ success: true, data: { project } });
};

export const deleteProject = async (req, res) => {
  await service.deleteProject(req.params.id);
  res.status(204).end();
};

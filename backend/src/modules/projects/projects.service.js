import { db } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export const listMyProjects = async (userId) => {
  const memberships = await db.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          _count: { select: { tasks: true, members: true } },
        },
      },
    },
    orderBy: { project: { createdAt: 'desc' } },
  });

  return memberships.map(({ role, project }) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    myRole: role,
    taskCount: project._count.tasks,
    memberCount: project._count.members,
    createdAt: project.createdAt,
  }));
};

export const createProject = async (userId, data) => {
  return db.$transaction(async (tx) => {
    const project = await tx.project.create({ data });
    await tx.projectMember.create({
      data: { projectId: project.id, userId, role: 'ADMIN' },
    });
    return project;
  });
};

export const getProjectById = async (projectId, userId) => {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!project) throw new ApiError(404, 'Project not found', 'NOT_FOUND');

  const myMembership = project.members.find((m) => m.userId === userId);

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    myRole: myMembership?.role,
    members: project.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};

export const updateProject = async (projectId, data) => {
  return db.project.update({ where: { id: projectId }, data });
};

export const deleteProject = async (projectId) => {
  return db.project.delete({ where: { id: projectId } });
};

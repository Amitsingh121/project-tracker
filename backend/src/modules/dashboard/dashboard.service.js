import { db } from '../../config/db.js';

export const getDashboard = async (userId) => {
  const [projects, tasksByStatus, assignedTasks, overdueTasks] = await Promise.all([
    db.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: { _count: { select: { tasks: true } } },
        },
      },
      orderBy: { project: { updatedAt: 'desc' } },
      take: 5,
    }),

    db.task.groupBy({
      by: ['status'],
      where: { project: { members: { some: { userId } } } },
      _count: true,
    }),

    db.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),

    db.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' },
        dueDate: { lt: new Date() },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
  ]);

  const projectIds = projects.map((m) => m.projectId);
  const totalTasks = await db.task.count({
    where: { projectId: { in: projectIds } },
  });

  const taskStatusMap = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  tasksByStatus.forEach((row) => {
    taskStatusMap[row.status] = row._count;
  });

  return {
    totals: { projects: projects.length, tasks: totalTasks },
    tasksByStatus: taskStatusMap,
    myAssignedTasks: assignedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      project: t.project,
    })),
    overdueTasks: overdueTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      project: t.project,
    })),
    recentProjects: projects.map(({ role, project }) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      myRole: role,
      taskCount: project._count.tasks,
      updatedAt: project.updatedAt,
    })),
  };
};

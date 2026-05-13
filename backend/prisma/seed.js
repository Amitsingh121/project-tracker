import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  await db.task.deleteMany();
  await db.projectMember.deleteMany();
  await db.project.deleteMany();
  await db.user.deleteMany();

  const password = await bcrypt.hash('Demo1234!', 10);

  const admin = await db.user.create({
    data: { email: 'admin@demo.com', name: 'Alice Admin', passwordHash: password },
  });

  const member = await db.user.create({
    data: { email: 'member@demo.com', name: 'Bob Member', passwordHash: password },
  });

  const project = await db.project.create({
    data: {
      name: 'Demo Project',
      description: 'A sample project to showcase the app features including tasks, members, and the Kanban board.',
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const now = new Date();
  const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  await db.task.createMany({
    data: [
      {
        projectId: project.id,
        title: 'Set up project infrastructure',
        description: 'Initialize repo, configure CI/CD, set up dev environment.',
        status: 'DONE',
        priority: 'HIGH',
        creatorId: admin.id,
        assigneeId: admin.id,
        dueDate: days(-10),
      },
      {
        projectId: project.id,
        title: 'Design database schema',
        description: 'Define all models and relationships in Prisma schema.',
        status: 'DONE',
        priority: 'HIGH',
        creatorId: admin.id,
        assigneeId: admin.id,
        dueDate: days(-7),
      },
      {
        projectId: project.id,
        title: 'Implement user authentication',
        description: 'JWT-based signup/login with protected routes.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        creatorId: admin.id,
        assigneeId: member.id,
        dueDate: days(5),
      },
      {
        projectId: project.id,
        title: 'Build REST API endpoints',
        description: 'Projects, tasks, members, and dashboard endpoints.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        creatorId: admin.id,
        assigneeId: admin.id,
        dueDate: days(3),
      },
      {
        projectId: project.id,
        title: 'Create React frontend',
        description: 'Pages for login, projects list, project detail, and dashboard.',
        status: 'TODO',
        priority: 'MEDIUM',
        creatorId: admin.id,
        assigneeId: member.id,
        dueDate: days(14),
      },
      {
        projectId: project.id,
        title: 'Add drag-and-drop Kanban board',
        description: 'Allow tasks to be dragged between status columns.',
        status: 'TODO',
        priority: 'MEDIUM',
        creatorId: admin.id,
        dueDate: days(10),
      },
      {
        projectId: project.id,
        title: 'Write unit and integration tests',
        description: 'Cover auth, projects, and task business logic.',
        status: 'TODO',
        priority: 'LOW',
        creatorId: member.id,
        dueDate: days(18),
      },
      {
        projectId: project.id,
        title: 'Fix overdue login page bug',
        description: 'Token refresh not working on page reload.',
        status: 'TODO',
        priority: 'MEDIUM',
        creatorId: member.id,
        assigneeId: member.id,
        dueDate: days(-2),
      },
      {
        projectId: project.id,
        title: 'Deploy to production',
        description: 'Railway for backend, Vercel for frontend, Neon for database.',
        status: 'TODO',
        priority: 'HIGH',
        creatorId: admin.id,
        dueDate: days(21),
      },
    ],
  });

  console.log('✅ Seed complete');
  console.log('👤 admin@demo.com  / Demo1234!  (role: ADMIN)');
  console.log('👤 member@demo.com / Demo1234!  (role: MEMBER)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

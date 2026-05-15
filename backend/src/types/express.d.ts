import type { ProjectMember, Task } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: { id: string; email: string; name: string };
      membership: ProjectMember;
      task: Task;
    }
  }
}

export {};

import { db } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export const addMember = async (projectId, email) => {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw new ApiError(404, 'User with that email not found', 'NOT_FOUND');

  const existing = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (existing) throw new ApiError(409, 'User is already a member of this project', 'CONFLICT');

  const membership = await db.projectMember.create({
    data: { projectId, userId: user.id, role: 'MEMBER' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return {
    userId: membership.userId,
    name: membership.user.name,
    email: membership.user.email,
    role: membership.role,
  };
};

export const removeMember = async (projectId, userId) => {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) throw new ApiError(404, 'Member not found', 'NOT_FOUND');

  if (membership.role === 'ADMIN') {
    const adminCount = await db.projectMember.count({
      where: { projectId, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot remove the last admin of a project', 'BAD_REQUEST');
    }
  }

  await db.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
};

export const changeMemberRole = async (projectId, userId, role) => {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) throw new ApiError(404, 'Member not found', 'NOT_FOUND');

  if (membership.role === 'ADMIN' && role === 'MEMBER') {
    const adminCount = await db.projectMember.count({
      where: { projectId, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot demote the last admin of a project', 'BAD_REQUEST');
    }
  }

  return db.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

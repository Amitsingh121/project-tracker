import type { ProjectRole } from '@prisma/client';
import { db } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendInvitation } from '../invitations/invitations.service.js';

export const inviteMember = async (projectId: string, invitedById: string, email: string) => {
  return sendInvitation(projectId, invitedById, email);
};

export const removeMember = async (projectId: string, userId: string) => {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) throw new ApiError(404, 'Member not found', 'NOT_FOUND');

  if (membership.isOwner) {
    throw new ApiError(403, 'Cannot remove the project owner', 'FORBIDDEN');
  }

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

export const changeMemberRole = async (projectId: string, userId: string, role: ProjectRole) => {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) throw new ApiError(404, 'Member not found', 'NOT_FOUND');

  if (membership.isOwner) {
    throw new ApiError(403, 'Cannot change the role of the project owner', 'FORBIDDEN');
  }

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

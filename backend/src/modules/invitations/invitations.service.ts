import { db } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

const INVITE_EXPIRY_DAYS = 7;

export const sendInvitation = async (projectId: string, invitedById: string, email: string) => {
  const invitee = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true },
  });
  if (!invitee) throw new ApiError(404, 'No user found with that email', 'NOT_FOUND');

  const alreadyMember = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: invitee.id } },
  });
  if (alreadyMember) throw new ApiError(409, 'User is already a member of this project', 'CONFLICT');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invitation = await db.invitation.upsert({
    where: { projectId_inviteeId: { projectId, inviteeId: invitee.id } },
    create: { projectId, inviteeId: invitee.id, invitedById, status: 'PENDING', expiresAt },
    update: { invitedById, status: 'PENDING', expiresAt, createdAt: new Date() },
    include: {
      project: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  return {
    id: invitation.id,
    projectName: invitation.project.name,
    inviteeName: invitee.name,
    inviteeEmail: invitee.email,
    invitedByName: invitation.invitedBy.name,
    expiresAt: invitation.expiresAt,
  };
};

export const listMyInvitations = async (userId: string) => {
  const invitations = await db.invitation.findMany({
    where: { inviteeId: userId, status: 'PENDING', expiresAt: { gt: new Date() } },
    include: {
      project: { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    projectId: inv.project.id,
    projectName: inv.project.name,
    invitedByName: inv.invitedBy.name,
    invitedByEmail: inv.invitedBy.email,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
  }));
};

export const listProjectInvitations = async (projectId: string) => {
  const invitations = await db.invitation.findMany({
    where: { projectId, status: 'PENDING', expiresAt: { gt: new Date() } },
    include: { invitee: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    inviteeName: inv.invitee.name,
    inviteeEmail: inv.invitee.email,
    expiresAt: inv.expiresAt,
  }));
};

export const respondToInvitation = async (invitationId: string, userId: string, accept: boolean) => {
  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw new ApiError(404, 'Invitation not found', 'NOT_FOUND');
  if (invitation.inviteeId !== userId) throw new ApiError(403, 'Not your invitation', 'FORBIDDEN');
  if (invitation.status !== 'PENDING') throw new ApiError(400, 'Invitation already responded to', 'BAD_REQUEST');
  if (invitation.expiresAt < new Date()) throw new ApiError(400, 'Invitation has expired', 'BAD_REQUEST');

  if (accept) {
    await db.$transaction(async (tx) => {
      const existing = await tx.projectMember.findUnique({
        where: { projectId_userId: { projectId: invitation.projectId, userId } },
      });
      if (!existing) {
        await tx.projectMember.create({
          data: { projectId: invitation.projectId, userId, role: 'MEMBER' },
        });
      }
      await tx.invitation.update({ where: { id: invitationId }, data: { status: 'ACCEPTED' } });
    });
  } else {
    await db.invitation.update({ where: { id: invitationId }, data: { status: 'DECLINED' } });
  }
};

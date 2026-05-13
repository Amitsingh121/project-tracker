import * as service from './members.service.js';

export const addMember = async (req, res) => {
  const member = await service.addMember(req.params.projectId, req.body.email);
  res.status(201).json({ success: true, data: { member } });
};

export const removeMember = async (req, res) => {
  await service.removeMember(req.params.projectId, req.params.userId);
  res.status(204).end();
};

export const changeMemberRole = async (req, res) => {
  const updated = await service.changeMemberRole(
    req.params.projectId,
    req.params.userId,
    req.body.role,
  );
  res.json({
    success: true,
    data: {
      member: {
        userId: updated.userId,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role,
      },
    },
  });
};

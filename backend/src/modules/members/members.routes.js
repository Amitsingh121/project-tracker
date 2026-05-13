import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireProjectRole } from '../../middleware/rbac.js';
import { addMemberSchema, changeMemberRoleSchema } from './members.schema.js';
import * as controller from './members.controller.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole('ADMIN')),
  validate(addMemberSchema),
  asyncHandler(controller.addMember),
);

router.patch(
  '/:userId',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole('ADMIN')),
  validate(changeMemberRoleSchema),
  asyncHandler(controller.changeMemberRole),
);

router.delete(
  '/:userId',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole('ADMIN')),
  asyncHandler(controller.removeMember),
);

export default router;

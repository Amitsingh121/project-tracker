import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './invitations.controller.js';

const router = Router();

router.get('/', asyncHandler(requireAuth), asyncHandler(controller.listInvitations));
router.post('/:id/accept', asyncHandler(requireAuth), asyncHandler(controller.acceptInvitation));
router.post('/:id/decline', asyncHandler(requireAuth), asyncHandler(controller.declineInvitation));

export default router;

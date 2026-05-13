import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { dashboard } from './dashboard.controller.js';

const router = Router();

router.get('/', asyncHandler(requireAuth), asyncHandler(dashboard));

export default router;

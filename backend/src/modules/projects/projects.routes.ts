import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireProjectRole } from '../../middleware/rbac.js';
import { createProjectSchema, updateProjectSchema } from './projects.schema.js';
import * as controller from './projects.controller.js';
import membersRouter from '../members/members.routes.js';
import { projectTasksRouter } from '../tasks/tasks.routes.js';
import { listProjectInvitations } from '../invitations/invitations.service.js';

const router = Router();

/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List all projects the current user belongs to
 *     responses:
 *       200:
 *         description: Array of projects with role, task count, and member count
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project (creator becomes ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Project
 *               description:
 *                 type: string
 *                 example: Optional description
 *     responses:
 *       201:
 *         description: Project created
 *       422:
 *         description: Validation error
 */
router.get('/', asyncHandler(requireAuth), asyncHandler(controller.listProjects));
router.post('/', asyncHandler(requireAuth), validate(createProjectSchema), asyncHandler(controller.createProject));

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a single project with members
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 *       403:
 *         description: Not a member
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Projects]
 *     summary: Update project name/description (ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated project
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project and all its tasks (ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/:id',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole()),
  asyncHandler(controller.getProject),
);
router.patch(
  '/:id',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole('ADMIN')),
  validate(updateProjectSchema),
  asyncHandler(controller.updateProject),
);
router.delete(
  '/:id',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole('ADMIN')),
  asyncHandler(controller.deleteProject),
);

router.get(
  '/:projectId/invitations',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole('ADMIN')),
  asyncHandler(async (req, res) => {
    const invitations = await listProjectInvitations(req.params.projectId as string);
    res.json({ success: true, data: { invitations } });
  }),
);

router.use('/:projectId/members', membersRouter);
router.use('/:projectId/tasks', projectTasksRouter);

export default router;

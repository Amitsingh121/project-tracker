import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireProjectRole, requireTaskAccess } from '../../middleware/rbac.js';
import { createTaskSchema, updateTaskSchema, listTasksSchema } from './tasks.schema.js';
import * as controller from './tasks.controller.js';

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks for a project (optionally filter by status/priority)
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *     responses:
 *       200:
 *         description: Array of tasks
 *       403:
 *         description: Not a project member
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task in the project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               assigneeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created
 */
export const projectTasksRouter = Router({ mergeParams: true });

projectTasksRouter.get(
  '/',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole()),
  validate(listTasksSchema, 'query'),
  asyncHandler(controller.listTasks),
);

projectTasksRouter.post(
  '/',
  asyncHandler(requireAuth),
  asyncHandler(requireProjectRole()),
  validate(createTaskSchema),
  asyncHandler(controller.createTask),
);

/**
 * @openapi
 * /tasks/{taskId}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated task
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (ADMIN or task creator only)
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 *       403:
 *         description: Insufficient permissions
 */
const router = Router();

router.patch(
  '/:taskId',
  asyncHandler(requireAuth),
  asyncHandler(requireTaskAccess),
  validate(updateTaskSchema),
  asyncHandler(controller.updateTask),
);

router.delete(
  '/:taskId',
  asyncHandler(requireAuth),
  asyncHandler(requireTaskAccess),
  asyncHandler(controller.deleteTask),
);

export default router;

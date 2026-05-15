import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { serve as swaggerServe, setup as swaggerSetup } from 'swagger-ui-express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { swaggerSpec } from './config/swagger.js';
import authRouter from './modules/auth/auth.routes.js';
import projectsRouter from './modules/projects/projects.routes.js';
import tasksRouter from './modules/tasks/tasks.routes.js';
import dashboardRouter from './modules/dashboard/dashboard.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 }); // might need to bump this in prod

if (env.NODE_ENV !== 'test') {
  app.use(globalLimiter);
  app.use('/api/auth', authLimiter);
}

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/docs', swaggerServe, swaggerSetup(swaggerSpec));

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/dashboard', dashboardRouter);

app.use(errorHandler);

export default app;

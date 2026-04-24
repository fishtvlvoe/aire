import { Router } from 'express';

import { getDbSize } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    db_size: getDbSize(),
    uptime: process.uptime(),
  });
});

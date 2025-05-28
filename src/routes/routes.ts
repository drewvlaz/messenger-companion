import express from 'express';
import webhooks from './webhooks';
import { captureMessageMiddleware } from './middleware/capture.middleware';
import { errorMiddleware } from './middleware/error.middleware';

const routes = express.Router();

routes.use(captureMessageMiddleware());
routes.use('/webhooks', webhooks);
routes.use(errorMiddleware());

export default routes;

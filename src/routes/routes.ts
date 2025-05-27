import express from 'express';
import webhooks from './webhooks';

const routes = express.Router();

routes.use('/webhooks', webhooks);

export default routes;

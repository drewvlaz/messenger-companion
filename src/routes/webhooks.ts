import express, { Request, Response } from 'express';

const webhooks = express.Router();

webhooks.post('/', (req: Request, res: Response) => {
    console.log(req.body);
    res.sendStatus(200);
});

export default webhooks;

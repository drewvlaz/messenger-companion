import express, { NextFunction, Request, Response } from 'express';
import { handleNewMessage } from '../services/bluebubbles/handlers';
import { BBEvent, BBEventType } from '../interface/bluebubble/internal.types';

const webhooks = express.Router();

webhooks.post('/bluebubbles', (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Received bluebubbles event: ', req.body);

        const { type, data } = req.body as BBEvent;
        switch (type) {
            case BBEventType.NEW_MESSAGE:
                // case BBEventType.UPDATED_MESSAGE:
                handleNewMessage(data);
                break;
            default:
                console.log('Unknown event type');
                res.sendStatus(400);
                return;
        }

        res.sendStatus(200);
    } finally {
        next();
    }
});

webhooks.post('/', (req: Request, res: Response) => {
    console.log(req.body);
    res.sendStatus(200);
});

export default webhooks;

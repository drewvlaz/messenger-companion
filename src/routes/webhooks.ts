import express, { Request, Response } from 'express';
import { BBEvent, BBEventType } from '../interface/bluebubble.types';
import { handleNewMessage } from '../services/bluebubbles/handlers';

const webhooks = express.Router();

webhooks.post('/bluebubbles', (req: Request, res: Response) => {
    console.log('Received bluebubbles event: ', req.body);

    const { type, data } = req.body as BBEvent;
    switch (type) {
        case BBEventType.NEW_MESSAGE:
            handleNewMessage(data);
            break;
        default:
            console.log('Unknown event type');
            res.sendStatus(400);
    }

    res.sendStatus(200);
});

webhooks.post('/', (req: Request, res: Response) => {
    console.log(req.body);
    res.sendStatus(200);
});

export default webhooks;

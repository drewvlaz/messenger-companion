import { Request, Response, NextFunction } from 'express';
import { DateTime } from 'luxon';

import { ok } from 'assert';
import { prisma } from '../../db/config';
import { config } from '../../config';
import { asyncMiddlewareHandler } from './utils';
import { BBMessageResponse } from '../../interface/bluebubble/raw.types';
import { BBEvent } from '../../interface/bluebubble/internal.types';

const captureMessage = async (message: BBMessageResponse) => {
    // Determine message participants
    const selfAddress = config.env.SELF_ADDRESS;
    const contactAddress = message.handle?.address;

    // For outgoing messages: I am the sender, contact is recipient
    // For incoming messages: Contact is the sender, I am recipient
    const senderId = message.isFromMe ? selfAddress : contactAddress;
    const recipientId = message.isFromMe ? contactAddress : selfAddress;

    ok(senderId && recipientId);
    await prisma.bbMessage.create({
        data: {
            // Identifiers
            messageId: message.guid,
            senderId,
            recipientId,

            // Message content
            subject: message.subject,
            text: message.text,

            // Date metadata
            dateCreated: DateTime.fromMillis(message.dateCreated).toISO()!,
            dateDelivered: message.dateDelivered
                ? DateTime.fromMillis(message.dateDelivered).toISO()!
                : null,
            dateEdited: message.dateEdited
                ? DateTime.fromMillis(message.dateEdited).toISO()!
                : null,
            dateRetracted: message.dateRetracted
                ? DateTime.fromMillis(message.dateRetracted).toISO()!
                : null,
        },
    });
};

// TODO: maybe move this back to the service -- not sufficiently general enough
// to be middleware
export const captureMessageMiddleware = () => {
    const middlewarFn = async (req: Request, _res: Response, next: NextFunction) => {
        // TODO: maybe use zod to parse?
        const message = req.body as BBEvent;
        await captureMessage(message.data);
        next();
    };
    return asyncMiddlewareHandler(middlewarFn);
};

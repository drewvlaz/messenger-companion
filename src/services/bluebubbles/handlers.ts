import { DateTime } from 'luxon';

import { config } from '../../config';
import { BBReceivedMessage } from '../../interface/bluebubble.types';
import { MessageCommandType } from './types';
import { sendMessage } from './api';
import { prisma } from '../../db/config';

const parseCommand = (message: string) => {
    const [command, ...args] = message.split(' ');

    const isCommand = (message: string) => {
        return message.startsWith('/');
    };

    if (!isCommand(command)) {
        return null;
    }

    switch (command) {
        case '/ask':
            return {
                type: MessageCommandType.ASK,
                args: args.join(' '),
            };
        default:
            return null;
    }
};

const handleCommand = async ({
    type,
    args,
    address,
}: {
    type: MessageCommandType;
    args: string;
    address: string;
}) => {
    switch (type) {
        case MessageCommandType.ASK:
            console.log('Asking:', args);
            // Process the ASK command here
            await sendMessage({
                address,
                message: `Request processed successfully: "${args}"`,
            });
            break;
        default:
            console.log('Unknown command:', type);
            await sendMessage({
                address,
                message: 'Unknown command. Please try again.',
            });
    }
};

const recordMessage = async (message: BBReceivedMessage) => {
    const senderId = message.isFromMe ? config.env.SELF_ADDRESS! : message.handle.address;
    const recipientId = message.isFromMe ? message.handle.address : config.env.SELF_ADDRESS!;
    await prisma.bbMessage.create({
        data: {
            messageId: message.guid,
            senderId,
            recipientId,
            subject: message.subject,
            text: message.text,

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

export const handleNewMessage = async (message: BBReceivedMessage) => {
    await recordMessage(message);

    console.log(`New message from ${message.handle.address}: ${message.text}`);

    const command = parseCommand(message.text);

    switch (message.handle.address) {
        // TODO: stop hardcoding these
        case config.env.JESSE_ADDRESS:
        case config.env.SELF_ADDRESS: {
            if (command) {
                await handleCommand({ ...command, address: message.handle.address });
            }
            break;
        }
        default:
            console.log(`Unrecognized address: ${message.handle.address}. Skipping.`);
            return false;
    }

    // TODO: return typed success/failure
    return true;
};

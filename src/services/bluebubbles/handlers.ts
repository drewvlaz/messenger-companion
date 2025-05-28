import { config } from '../../config';
import { MessageCommandType } from './types';
import { sendMessage } from './api';
import { handleAnalyzeMessage, handleAskQuestion } from './actions';
import { BBMessageResponse } from '../../interface/bluebubble/raw.types';

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
        case '/analyze':
            return {
                type: MessageCommandType.ANALYZE,
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
    recipientAddress,
}: {
    type: MessageCommandType;
    args: string;
    address: string;
    recipientAddress: string;
}) => {
    switch (type) {
        case MessageCommandType.ASK:
            console.log('Asking:', args);
            // Process the ASK command here
            await handleAskQuestion({
                question: args,
                userAddress: address,
            });
            break;
        case MessageCommandType.ANALYZE:
            await handleAnalyzeMessage({
                message: args,
                senderAddress: address,
                recipientAddress,
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

export const handleNewMessage = async (message: BBMessageResponse) => {
    if (!message.handle) {
        return;
    }

    console.log(`New message from ${message.handle.address}: ${message.text}`);

    const command = parseCommand(message.text);
    // Get the recipient address (usually the self address)
    const recipientAddress = config.env.SELF_ADDRESS!;

    switch (message.handle.address) {
        // TODO: stop hardcoding these
        case config.env.JESSE_ADDRESS:
        case config.env.SELF_ADDRESS: {
            if (command) {
                await handleCommand({
                    ...command,
                    address: message.handle.address,
                    recipientAddress,
                });
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

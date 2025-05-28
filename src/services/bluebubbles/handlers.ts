import { config } from '../../config';
import { MessageCommandType } from './types';
import { sendMessage } from './api';
import { handleAnalyzeMessage, handleAskQuestion } from './actions';
import { BBMessageResponse } from '../../interface/bluebubble/raw.types';
import { captureMessage } from '../../routes/middleware/capture.middleware';

const parseCommand = (message: string) => {
    const [command, ...args] = message.split(' ');
    const isCommand = (message: string) => message.startsWith('/');
    if (!isCommand(command)) return null;

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
}: {
    type: MessageCommandType;
    args: string;
    address: string;
}) => {
    try {
        switch (type) {
            case MessageCommandType.ASK:
                console.log('Asking:', args, address);
                await handleAskQuestion({
                    question: args,
                    userAddress: address,
                });
                break;
            case MessageCommandType.ANALYZE:
                console.log('Analyzing:', args);
                await handleAnalyzeMessage({
                    message: args,
                    userAddress: address,
                });
                break;
            default:
                console.log('Unknown command:', type);
                await sendMessage({
                    address,
                    message: 'Unknown command. Please try again.',
                });
        }
    } catch (error) {
        console.error('Error in handleCommand:', error);
        await sendMessage({
            address,
            message: 'Sorry, I encountered an error while processing your command.',
        });
    }
};

export const handleNewMessage = async (message: BBMessageResponse) => {
    if (!message.handle) {
        return;
    }
    await captureMessage(message);

    console.log(`New message from ${message.handle.address}: ${message.text}`);

    const command = parseCommand(message.text);

    switch (message.handle.address) {
        // TODO: stop hardcoding these
        case config.env.JESSE_ADDRESS:
        case config.env.SELF_ADDRESS: {
            if (command) {
                await handleCommand({
                    ...command,
                    address: message.handle.address,
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

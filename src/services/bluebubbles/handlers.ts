import { config } from '../../config';
import { BBReceivedMessage } from '../../interface/bluebubble.types';
import { MessageCommandType } from './types';

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

const handleCommand = ({ type, args }: { type: MessageCommandType; args: string }) => {
    switch (type) {
        case MessageCommandType.ASK:
            console.log('Asking:', args);
            break;
        default:
            console.log('Unknown command:', type);
    }
};

export const handleNewMessage = (message: BBReceivedMessage) => {
    console.log('New message from:', message.handle.address);
    console.log(message.text);

    switch (message.handle.address) {
        // TODO: stop hardcoding these
        case config.env.SELF_ADDRESS: {
            console.log(parseCommand(message.text));
            console.log('New message from self');
            break;
        }
        case config.env.JESSE_ADDRESS:
            console.log('New message from Jesse');
            break;
        default:
            console.log('New message from unknown address');
            return false;
    }

    // TODO: return typed success/failure
    return true;
};

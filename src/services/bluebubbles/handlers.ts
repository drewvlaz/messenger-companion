import { config } from '../../config';
import { BBMessage } from '../../interface/bluebubble.types';

export const handleNewMessage = (message: BBMessage) => {
    console.log('New message from:', message.handle.address);
    console.log(message.text);

    switch (message.handle.address) {
        // TODO: stop hardcoding these
        case config.env.SELF_ADDRESS:
            console.log('New message from self');
            break;
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

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../../config';
import { BBSendMessageMethod, BBMessage } from '../../interface/bluebubble/internal.types';

const IMESSAGE_GUID_PREFIX = 'iMessage;-;';

export async function sendMessage({ address, message }: { address: string; message: string }) {
    const data = {
        chatGuid: `${IMESSAGE_GUID_PREFIX}${address}`,
        tempGuid: uuidv4(),
        message,
        method: BBSendMessageMethod.PRIVATE_API,
        subject: '',
        effectId: '',
        selectedMessageGuid: '',
    } as BBMessage;

    await axios
        .request({
            method: 'POST',
            url: `${config.env.BLUEBUBBLE_HOST}:${config.env.BLUEBUBBLE_PORT}/api/v1/message/text`,
            headers: {
                'Content-Type': 'application/json',
            },
            params: {
                password: config.env.BLUEBUBBLE_PASSWORD,
            },
            data,
        })
        .then((response) => {
            console.log('Response:', response.data);
            console.log('Error:', response.data.error);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

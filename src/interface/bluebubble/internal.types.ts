import { BBMessageResponse } from './raw.types';

export enum BBEventType {
    NEW_MESSAGE = 'new-message',
    // TODO: add more event types
}

type BBEventData = BBMessageResponse;

export enum BBSendMessageMethod {
    APPLE_SCRIPT = 'apple-script',
    PRIVATE_API = 'private-api',
}

export type BBMessage = {
    // "chatGuid": "iMessage;+;xxxxxxxxxxxx",
    // "tempGuid": "",
    // "message": "Hello World!",
    // "method": "apple-script",
    // "subject": "",
    // "effectId": "",
    // "selectedMessageGuid": ""
    chatGuid: string;
    tempGuid: string;
    message: string;
    method: BBSendMessageMethod;
    subject: string;
    effectId: string;
    selectedMessageGuid: string;
    partIndex: number;
};

export type BBEvent = {
    type: BBEventType;
    data: BBEventData;
};

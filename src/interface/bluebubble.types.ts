export enum BBEventType {
    NEW_MESSAGE = 'new-message',
    // TODO: add more event types
}

type BBEventData = BBReceivedMessage;

export type BBReceivedMessage = {
    originalROWID: number;
    guid: string;
    text: string;
    attributedBody: string | null;
    handle:
        | {
              originalROWID: number;
              address: string;
              service: string;
              uncanonicalizedId: string | null;
              country: string;
          }
        | undefined;
    handleId: number;
    otherHandle: number;
    attachments: [];
    subject: string | null;
    error: number;
    dateCreated: number;
    dateRead: number | null;
    dateDelivered: number | null;
    dateEdited: number | null;
    dateRetracted: number | null;
    isDelivered: boolean;
    isFromMe: boolean;
    hasDdResults: boolean;
    isArchived: boolean;
    itemType: number;
    groupTitle: string | null;
    groupActionType: number;
    balloonBundleId: string | null;
    associatedMessageGuid: string | null;
    associatedMessageType: string | null;
    expressiveSendStyleId: string | null;
    threadOriginatorGuid: string | null;
    hasPayloadData: boolean;
    chats: [[Object]];
    messageSummaryInfo: string | null;
    payloadData: string | null;
    partCount: number;
};

export enum BBSentMessageMethod {
    APPLE_SCRIPT = 'apple-script',
    PRIVATE_API = 'private-api',
}

export type BBSentMessage = {
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
    method: BBSentMessageMethod;
    subject: string;
    effectId: string;
    selectedMessageGuid: string;
    partIndex: number;
};

export type BBEvent = {
    type: BBEventType;
    data: BBEventData;
};

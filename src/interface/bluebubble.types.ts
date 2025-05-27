export enum BBEventType {
    NEW_MESSAGE = 'new-message',
    // TODO: add more event types
}

type BBEventData = BBMessage;

export type BBMessage = {
    originalROWID: number;
    guid: string;
    text: string;
    attributedBody: string | null;
    handle: {
        originalROWID: number;
        address: string;
        service: string;
        uncanonicalizedId: string | null;
        country: string;
    };
    handleId: number;
    otherHandle: number;
    attachments: [];
    subject: string | null;
    error: number;
    dateCreated: number;
    dateRead: string | null;
    dateDelivered: string | null;
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
    dateEdited: string | null;
    dateRetracted: string | null;
    partCount: number;
};

export type BBEvent = {
    type: BBEventType;
    data: BBEventData;
};

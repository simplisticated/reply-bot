import { Message } from "telegraf/typings/core/types/typegram";

const REPLY_CACHE: {
    sourceMessage: Message;
    replyIdentifier: number;
}[] = [];

export function addReplyIdentifierToCache(
    replyIdentifier: number,
    sourceMessage: Message
) {
    REPLY_CACHE.push({
        sourceMessage,
        replyIdentifier,
    });
}

export function getSourceMessageFromReplyIdentifier(
    replyIdentifier: number
): Message | null {
    const result = REPLY_CACHE.find(
        value => value.replyIdentifier === replyIdentifier
    );
    return result?.sourceMessage ?? null;
}

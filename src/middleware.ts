import { Context } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import ENV from "./env";
import { getUserDescription } from "./user";
import {
    getSourceMessageFromReplyIdentifier,
    addReplyIdentifierToCache,
} from "./cache";
import { AdministratorCommand } from "./commands";

export async function handleMessages(
    context: Context<Update>,
    next: () => Promise<void>
) {
    const { from: sender, message: messageFromSender } = context;
    if (!sender || !messageFromSender) {
        next();
        return;
    }

    const isAdministrator = ENV.ADMINISTRATOR_IDENTIFIERS.includes(sender.id);

    if (isAdministrator) {
        if (!("reply_to_message" in messageFromSender)) {
            next();
            return;
        }

        const replyMessage = messageFromSender.reply_to_message;
        if (!replyMessage || !replyMessage.from) {
            next();
            return;
        }

        const sourceMessage = getSourceMessageFromReplyIdentifier(
            replyMessage.message_id
        );
        if (!sourceMessage || !sourceMessage.from) {
            next();
            return;
        }

        try {
            if ("text" in messageFromSender) {
                if (
                    messageFromSender.text ===
                    AdministratorCommand.userInformation
                ) {
                    if (!sourceMessage.from) {
                        next();
                        return;
                    }
                    const userDescription = getUserDescription(
                        sourceMessage.from
                    );
                    const json = JSON.stringify(
                        sourceMessage.from,
                        undefined,
                        2
                    );

                    const replyToMessageIdentifier =
                        messageFromSender.reply_to_message?.message_id;
                    if (!replyToMessageIdentifier) {
                        next();
                        return;
                    }

                    const text = `${userDescription}\n${json}`;
                    await context.reply(text, {
                        reply_parameters: {
                            message_id: replyToMessageIdentifier,
                        },
                    });
                } else {
                    await context.telegram.sendMessage(
                        sourceMessage.from.id,
                        messageFromSender.text
                    );
                }
            } else if ("photo" in messageFromSender) {
                const photo = messageFromSender.photo[0];
                if (!photo) {
                    next();
                    return;
                }

                const photoUrl = await context.telegram.getFileLink(photo);
                await context.telegram.sendPhoto(sourceMessage.from.id, {
                    url: photoUrl.href,
                });
            }

            await context.react("🎉");
        } catch (error) {
            console.error(error);
        }
    } else {
        ENV.ADMINISTRATOR_IDENTIFIERS.forEach(async id => {
            try {
                const replyMessage = await context.telegram.forwardMessage(
                    id,
                    messageFromSender.chat.id,
                    messageFromSender.message_id
                );
                addReplyIdentifierToCache(
                    replyMessage.message_id,
                    messageFromSender
                );
            } catch (error) {
                console.error(error);
            }
        });
    }

    next();
}

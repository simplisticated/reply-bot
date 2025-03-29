import { Telegraf } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import ENV from "./env";
import { getUserDescription } from "./user";

const REPLY_CACHE: {
    sourceMessage: Message;
    replyIdentifier: number;
}[] = [];

const COMMANDS = {
    userInformation: "!",
};

function addReplyIdentifierToCache(
    replyIdentifier: number,
    sourceMessage: Message
) {
    REPLY_CACHE.push({
        sourceMessage,
        replyIdentifier,
    });
}

function getSourceMessageFromReplyIdentifier(
    replyIdentifier: number
): Message | null {
    const result = REPLY_CACHE.find(
        value => value.replyIdentifier === replyIdentifier
    );
    return result?.sourceMessage ?? null;
}

async function start(): Promise<Telegraf> {
    if (!ENV.TELEGRAM_TOKEN) {
        throw new Error("Telegram token not found");
    }
    const bot = new Telegraf(ENV.TELEGRAM_TOKEN);
    bot.use(async (context, next) => {
        const { from: sender, message: messageFromSender } = context;
        if (!sender || !messageFromSender) return;

        const isAdministrator = ENV.ADMINISTRATOR_IDENTIFIERS.includes(
            sender.id
        );

        if (isAdministrator) {
            if (!("reply_to_message" in messageFromSender)) return;

            const replyMessage = messageFromSender.reply_to_message;
            if (!replyMessage || !replyMessage.from) return;

            const sourceMessage = getSourceMessageFromReplyIdentifier(
                replyMessage.message_id
            );
            if (!sourceMessage || !sourceMessage.from) return;

            try {
                if ("text" in messageFromSender) {
                    if (messageFromSender.text === COMMANDS.userInformation) {
                        if (!sourceMessage.from) return;
                        const userDescription = getUserDescription(
                            sourceMessage.from
                        );
                        const json = JSON.stringify(
                            sourceMessage.from,
                            undefined,
                            2
                        );
                        const text = `${userDescription}\n${json}`;
                        await context.reply(text, {
                            reply_to_message_id:
                                messageFromSender.reply_to_message?.message_id,
                        });
                    } else {
                        await context.telegram.sendMessage(
                            sourceMessage.from.id,
                            messageFromSender.text
                        );
                    }
                } else if ("photo" in messageFromSender) {
                    const photo = messageFromSender.photo[0];
                    if (!photo) return;

                    const photoUrl = await context.telegram.getFileLink(photo);
                    await context.telegram.sendPhoto(sourceMessage.from.id, {
                        url: photoUrl.href,
                    });
                }
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
    });
    bot.launch();
    return bot;
}

start();

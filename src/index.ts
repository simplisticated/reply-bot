import { Telegraf } from "telegraf";
import ENV from "./env";
import { handleMessages } from "./middleware";

async function start(): Promise<Telegraf> {
    if (!ENV.TELEGRAM_TOKEN) {
        throw new Error("Telegram token not found");
    }
    const bot = new Telegraf(ENV.TELEGRAM_TOKEN);
    bot.use(handleMessages);
    bot.start(context => {
        const isAdministrator = ENV.ADMINISTRATOR_IDENTIFIERS.includes(
            context.from.id
        );
        if (!isAdministrator && ENV.START_MESSAGE) {
            context.reply(ENV.START_MESSAGE);
        }
    });
    bot.launch();
    return bot;
}

start();

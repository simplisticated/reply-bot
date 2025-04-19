import { configDotenv } from "dotenv";
import { env } from "process";

configDotenv();

function getAdministratorIdentifiers(): number[] {
    const source = env.ADMINISTRATOR_IDENTIFIERS;
    if (typeof source !== "string") return [];
    return source
        .split(",")
        .map(stringValue => {
            const numberValue = Number.parseInt(stringValue, 10);
            return Number.isNaN(numberValue) ? null : numberValue;
        })
        .filter(identifier => identifier !== null);
}

const ENV = {
    TELEGRAM_TOKEN: env.TELEGRAM_TOKEN,
    ADMINISTRATOR_IDENTIFIERS: getAdministratorIdentifiers(),
    START_MESSAGE: env.START_MESSAGE,
};

export default ENV;

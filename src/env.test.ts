import ENV from "./env";

describe("ENV", () => {
    test("TELEGRAM_TOKEN", () => {
        expect(ENV.TELEGRAM_TOKEN).toBeDefined();
        const isEmpty = ENV.TELEGRAM_TOKEN!.length === 0;
        expect(isEmpty).toBeFalsy();
    });

    test("ADMINISTRATOR_IDENTIFIERS", () => {
        expect(ENV.ADMINISTRATOR_IDENTIFIERS.length).toBeGreaterThan(0);
    });
});

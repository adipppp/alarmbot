import "dotenv/config";
import { AlarmbotClient } from "./api/AlarmbotClient";

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const LEGACY_DISCORD_TOKEN = process.env.DISCORD_TOKEN;

async function main() {
    const token = DISCORD_TOKEN ?? LEGACY_DISCORD_TOKEN;
    if (token === undefined) {
        throw new Error(
            "DISCORD_BOT_TOKEN (or DISCORD_TOKEN) environment variable is not set.",
        );
    }

    const client = new AlarmbotClient();
    await client.login(token);
}

main();

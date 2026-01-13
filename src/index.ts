import { Client, Events, GatewayIntentBits } from "discord.js";

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

async function main() {
    if (DISCORD_TOKEN === undefined) {
        throw new Error("DISCORD_TOKEN environment variable is not set.");
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
        ],
    });

    client.once(Events.ClientReady, () => {
        const user = client.user;
        console.log(`Hello, ${user !== null ? user.tag : "world"}!`);
    });

    await client.login(DISCORD_TOKEN);
}

main();

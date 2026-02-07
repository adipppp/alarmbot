import { Client, Events, GatewayIntentBits } from "discord.js";
import { handleClientReady } from "./handlers";

const INTENTS = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
];

export class AlarmbotClient extends Client {
    constructor() {
        super({ intents: INTENTS });
        this.registerHandlers();
    }

    private registerHandlers(): void {
        this.on(Events.ClientReady, () => handleClientReady(this));
    }
}

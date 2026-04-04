import { Client } from "discord.js";
import { registerCommands } from "../commands";
import { AlarmScheduler } from "../scheduler/AlarmScheduler";

export async function handleClientReady(
    client: Client,
    alarmScheduler: AlarmScheduler,
) {
    const user = client.user;
    console.log(`Hello, ${user !== null ? user.tag : "world"}!`);
    await registerCommands(client);
    await alarmScheduler.start();
}

import {
    ChatInputCommandInteraction,
    Interaction,
    MessageFlags,
} from "discord.js";
import { handleCommandInteraction, type CommandHandlers } from "../commands";

function toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
}

export async function handleInteractionCreate(
    interaction: Interaction,
    handlers: CommandHandlers,
): Promise<void> {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const commandInteraction = interaction as ChatInputCommandInteraction;
    try {
        await handleCommandInteraction(commandInteraction, handlers);
    } catch (error) {
        const message = toErrorMessage(error);
        console.error("Failed to handle command interaction:", error);

        if (commandInteraction.replied || commandInteraction.deferred) {
            await commandInteraction.followUp({
                content: `Command failed: ${message}`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await commandInteraction.reply({
            content: `Command failed: ${message}`,
            flags: MessageFlags.Ephemeral,
        });
    }
}

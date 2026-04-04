import {
    ChannelType,
    ChatInputCommandInteraction,
    Client,
    GuildMember,
    MessageFlags,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    SlashCommandBuilder,
} from "discord.js";
import {
    AddCommandAccessFunction,
    ListCommandAccessFunction,
    RemoveCommandAccessFunction,
} from "../../app/access";
import {
    CancelAlarmByTimeFunction,
    ListAlarmsFunction,
    UpsertAlarmFunction,
} from "../../app/alarm";
import { AccessPrincipalType } from "../../domain/access";
import { canManageBot, canUseAlarmCommands } from "./accessControl";
import { nextOccurrenceUtc, normalizeTimeOfDay } from "./time";
import { AlarmScheduler } from "../scheduler/AlarmScheduler";

export interface CommandHandlers {
    upsertAlarm: UpsertAlarmFunction;
    cancelAlarmByTime: CancelAlarmByTimeFunction;
    listAlarms: ListAlarmsFunction;
    addCommandAccess: AddCommandAccessFunction;
    removeCommandAccess: RemoveCommandAccessFunction;
    listCommandAccess: ListCommandAccessFunction;
    alarmScheduler: AlarmScheduler;
    stopActiveAlarm: (guildId: string) => boolean;
}

const ALARM_SET_COMMAND = new SlashCommandBuilder()
    .setName("alarm-set")
    .setDescription("Set or update a daily alarm for this server in UTC (HH:mm).")
    .addStringOption((option) =>
        option
            .setName("time")
            .setDescription("Time in HH:mm, UTC.")
            .setRequired(true),
    )
    .addChannelOption((option) =>
        option
            .setName("channel")
            .setDescription("Voice channel where the alarm audio will be played.")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true),
    );

const ALARM_CANCEL_COMMAND = new SlashCommandBuilder()
    .setName("alarm-cancel")
    .setDescription("Cancel a daily alarm at HH:mm (UTC) for this server.")
    .addStringOption((option) =>
        option
            .setName("time")
            .setDescription("Time in HH:mm, UTC.")
            .setRequired(true),
    );

const ALARM_LIST_COMMAND = new SlashCommandBuilder()
    .setName("alarm-list")
    .setDescription("List active daily alarms for this server.");

const ALARM_STOP_COMMAND = new SlashCommandBuilder()
    .setName("alarm-stop")
    .setDescription("Manually stop alarm audio currently playing in this server.");

const ALARM_ACCESS_COMMAND = new SlashCommandBuilder()
    .setName("alarm-access")
    .setDescription("Manage who can use alarm commands in this server.")
    .addSubcommand((subcommand) =>
        subcommand
            .setName("allow")
            .setDescription("Allow a user or role to use alarm commands.")
            .addStringOption((option) =>
                option
                    .setName("type")
                    .setDescription("Principal type.")
                    .setRequired(true)
                    .addChoices(
                        { name: "user", value: "USER" },
                        { name: "role", value: "ROLE" },
                    ),
            )
            .addStringOption((option) =>
                option
                    .setName("id")
                    .setDescription("User ID or role ID.")
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("deny")
            .setDescription("Remove a user or role from allowed command access.")
            .addStringOption((option) =>
                option
                    .setName("type")
                    .setDescription("Principal type.")
                    .setRequired(true)
                    .addChoices(
                        { name: "user", value: "USER" },
                        { name: "role", value: "ROLE" },
                    ),
            )
            .addStringOption((option) =>
                option
                    .setName("id")
                    .setDescription("User ID or role ID.")
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName("list")
            .setDescription("Show currently allowed users and roles."),
    );

const COMMANDS: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
    ALARM_SET_COMMAND.toJSON(),
    ALARM_CANCEL_COMMAND.toJSON(),
    ALARM_LIST_COMMAND.toJSON(),
    ALARM_STOP_COMMAND.toJSON(),
    ALARM_ACCESS_COMMAND.toJSON(),
];

export function getCommands(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    return COMMANDS;
}

export async function registerCommands(client: Client): Promise<void> {
    if (client.application === null) {
        throw new Error("Discord application is not initialized.");
    }

    await client.application.commands.set(COMMANDS);
}

async function resolveGuildMember(
    interaction: ChatInputCommandInteraction,
): Promise<GuildMember | null> {
    if (!(interaction.member instanceof GuildMember)) {
        if (interaction.guild === null) {
            return null;
        }

        return interaction.guild.members.fetch(interaction.user.id);
    }

    return interaction.member;
}

async function assertAlarmCommandPermission(
    interaction: ChatInputCommandInteraction,
    handlers: CommandHandlers,
): Promise<boolean> {
    if (interaction.guildId === null) {
        await interaction.reply({
            content: "This command can only be used in a server.",
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    const member = await resolveGuildMember(interaction);
    if (member === null) {
        await interaction.reply({
            content: "Unable to resolve your member permissions for this server.",
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    const entries = await handlers.listCommandAccess(interaction.guildId);
    if (!canUseAlarmCommands(member, entries)) {
        await interaction.reply({
            content:
                "You are not allowed to use alarm commands in this server.",
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    return true;
}

function parsePrincipalType(value: string): AccessPrincipalType {
    if (value === "USER" || value === "ROLE") {
        return value;
    }

    throw new Error(`Unsupported principal type: ${value}`);
}

export async function handleCommandInteraction(
    interaction: ChatInputCommandInteraction,
    handlers: CommandHandlers,
): Promise<void> {
    if (interaction.commandName === "alarm-set") {
        if (!(await assertAlarmCommandPermission(interaction, handlers))) {
            return;
        }

        const guildId = interaction.guildId as string;
        const rawTime = interaction.options.getString("time", true);
        const normalizedTime = normalizeTimeOfDay(rawTime);
        const channel = interaction.options.getChannel("channel", true);
        if (channel.type !== ChannelType.GuildVoice) {
            throw new Error("Selected channel must be a guild voice channel.");
        }
        const triggerAt = nextOccurrenceUtc(normalizedTime);

        const alarm = await handlers.upsertAlarm({
            guildId,
            channelId: channel.id,
            timeOfDay: normalizedTime,
            triggerAt,
        });
        await handlers.alarmScheduler.schedule(alarm);

        await interaction.reply({
            content: `Alarm set for ${normalizedTime} UTC in voice channel <#${channel.id}>.`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (interaction.commandName === "alarm-cancel") {
        if (!(await assertAlarmCommandPermission(interaction, handlers))) {
            return;
        }

        const guildId = interaction.guildId as string;
        const rawTime = interaction.options.getString("time", true);
        const normalizedTime = normalizeTimeOfDay(rawTime);
        const alarms = await handlers.listAlarms(guildId);
        const alarm = alarms.find((item) => item.timeOfDay === normalizedTime);

        if (alarm === undefined || alarm.id === undefined) {
            throw new Error(`Alarm for ${normalizedTime} UTC was not found.`);
        }

        await handlers.cancelAlarmByTime({
            guildId,
            timeOfDay: normalizedTime,
        });
        handlers.alarmScheduler.cancel(alarm.id);

        await interaction.reply({
            content: `Alarm at ${normalizedTime} UTC cancelled.`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (interaction.commandName === "alarm-list") {
        if (!(await assertAlarmCommandPermission(interaction, handlers))) {
            return;
        }

        const guildId = interaction.guildId as string;
        const alarms = await handlers.listAlarms(guildId);
        if (alarms.length === 0) {
            await interaction.reply({
                content: "No active alarms for this server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const lines = alarms.map(
            (alarm) => `- \`${alarm.timeOfDay}\` UTC -> voice <#${alarm.channelId}>`,
        );
        await interaction.reply({
            content: `Active alarms:\n${lines.join("\n")}`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (interaction.commandName === "alarm-stop") {
        if (!(await assertAlarmCommandPermission(interaction, handlers))) {
            return;
        }

        const guildId = interaction.guildId as string;
        const stopped = handlers.stopActiveAlarm(guildId);
        await interaction.reply({
            content: stopped
                ? "Stopped active alarm audio."
                : "No active alarm audio is currently playing.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (interaction.commandName === "alarm-access") {
        if (interaction.guildId === null) {
            await interaction.reply({
                content: "This command can only be used in a server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const member = await resolveGuildMember(interaction);
        if (member === null || !canManageBot(member)) {
            await interaction.reply({
                content:
                    "You need Manage Server or Administrator permissions to manage access.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand(true);
        if (subcommand === "list") {
            const entries = await handlers.listCommandAccess(interaction.guildId);
            if (entries.length === 0) {
                await interaction.reply({
                    content:
                        "No access restrictions configured. All members can use alarm commands.",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const lines = entries.map(
                (entry) =>
                    `- ${entry.principalType === "USER" ? "User" : "Role"}: \`${entry.principalId}\``,
            );
            await interaction.reply({
                content: `Allowed principals:\n${lines.join("\n")}`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const type = parsePrincipalType(interaction.options.getString("type", true));
        const principalId = interaction.options.getString("id", true).trim();
        if (principalId.length === 0) {
            throw new Error("Principal ID cannot be empty.");
        }

        if (subcommand === "allow") {
            await handlers.addCommandAccess({
                guildId: interaction.guildId,
                principalType: type,
                principalId,
            });

            await interaction.reply({
                content: `Allowed ${type.toLowerCase()} \`${principalId}\` to use alarm commands.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (subcommand === "deny") {
            await handlers.removeCommandAccess({
                guildId: interaction.guildId,
                principalType: type,
                principalId,
            });

            await interaction.reply({
                content: `Removed ${type.toLowerCase()} \`${principalId}\` from alarm command access.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
    }
}

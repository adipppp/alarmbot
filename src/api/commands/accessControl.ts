import { GuildMember, PermissionFlagsBits } from "discord.js";
import { GuildCommandAccess } from "../../domain/access";

export function canManageBot(member: GuildMember): boolean {
    return (
        member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        member.permissions.has(PermissionFlagsBits.Administrator)
    );
}

export function canUseAlarmCommands(
    member: GuildMember,
    entries: GuildCommandAccess[],
): boolean {
    if (canManageBot(member)) {
        return true;
    }

    if (entries.length === 0) {
        return true;
    }

    const allowedUserIds = new Set(
        entries
            .filter((entry) => entry.principalType === "USER")
            .map((entry) => entry.principalId),
    );

    if (allowedUserIds.has(member.id)) {
        return true;
    }

    const allowedRoleIds = new Set(
        entries
            .filter((entry) => entry.principalType === "ROLE")
            .map((entry) => entry.principalId),
    );

    for (const roleId of member.roles.cache.keys()) {
        if (allowedRoleIds.has(roleId)) {
            return true;
        }
    }

    return false;
}

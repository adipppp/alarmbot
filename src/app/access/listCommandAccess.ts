import { GuildCommandAccess, GuildCommandAccessRepository } from "../../domain/access";

export type ListCommandAccessFunction = (
    guildId: string,
) => Promise<GuildCommandAccess[]>;

export function newListCommandAccessFunction(
    repository: GuildCommandAccessRepository,
): ListCommandAccessFunction {
    return (guildId) => repository.listAccessByGuildId(guildId);
}

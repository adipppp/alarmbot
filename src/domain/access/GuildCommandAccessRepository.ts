import { AccessPrincipalType, GuildCommandAccess } from "./GuildCommandAccess";

export interface GuildCommandAccessRepository {
    addAccess(entry: GuildCommandAccess): Promise<GuildCommandAccess>;
    removeAccess(
        guildId: string,
        principalType: AccessPrincipalType,
        principalId: string,
    ): Promise<void>;
    listAccessByGuildId(guildId: string): Promise<GuildCommandAccess[]>;
}

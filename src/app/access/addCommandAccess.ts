import {
    AccessPrincipalType,
    GuildCommandAccess,
    GuildCommandAccessRepository,
} from "../../domain/access";

export interface AddCommandAccessInput {
    guildId: string;
    principalType: AccessPrincipalType;
    principalId: string;
}

export type AddCommandAccessFunction = (
    input: AddCommandAccessInput,
) => Promise<GuildCommandAccess>;

export function newAddCommandAccessFunction(
    repository: GuildCommandAccessRepository,
): AddCommandAccessFunction {
    return (input) =>
        repository.addAccess(
            GuildCommandAccess.create({
                guildId: input.guildId,
                principalType: input.principalType,
                principalId: input.principalId,
            }),
        );
}

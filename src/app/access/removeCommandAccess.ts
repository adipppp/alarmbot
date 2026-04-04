import {
    AccessPrincipalType,
    GuildCommandAccessRepository,
} from "../../domain/access";

export interface RemoveCommandAccessInput {
    guildId: string;
    principalType: AccessPrincipalType;
    principalId: string;
}

export type RemoveCommandAccessFunction = (
    input: RemoveCommandAccessInput,
) => Promise<void>;

export function newRemoveCommandAccessFunction(
    repository: GuildCommandAccessRepository,
): RemoveCommandAccessFunction {
    return (input) =>
        repository.removeAccess(
            input.guildId,
            input.principalType,
            input.principalId,
        );
}

export type AccessPrincipalType = "USER" | "ROLE";

export interface GuildCommandAccessProps {
    id?: bigint;
    guildId: string;
    principalType: AccessPrincipalType;
    principalId: string;
    createdAt?: Date;
}

export class GuildCommandAccess {
    readonly id?: bigint;
    readonly guildId: string;
    readonly principalType: AccessPrincipalType;
    readonly principalId: string;
    readonly createdAt: Date;

    constructor(props: GuildCommandAccessProps) {
        this.id = props.id;
        this.guildId = props.guildId;
        this.principalType = props.principalType;
        this.principalId = props.principalId;
        this.createdAt = props.createdAt ?? new Date();
    }

    static create(
        props: Omit<GuildCommandAccessProps, "id" | "createdAt">,
    ): GuildCommandAccess {
        return new GuildCommandAccess(props);
    }

    static reconstitute(props: GuildCommandAccessProps): GuildCommandAccess {
        return new GuildCommandAccess(props);
    }
}

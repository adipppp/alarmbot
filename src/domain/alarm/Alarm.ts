export interface AlarmProps {
    id?: bigint;
    guildId: string;
    channelId: string;
    triggerAt: Date;
    createdAt?: Date;
    isDeleted?: boolean;
}

export class Alarm {
    readonly id?: bigint;
    readonly guildId: string;
    readonly channelId: string;
    readonly triggerAt: Date;
    readonly createdAt: Date;
    private _isDeleted: boolean;

    constructor(props: AlarmProps) {
        this.id = props.id;
        this.guildId = props.guildId;
        this.channelId = props.channelId;
        this.triggerAt = props.triggerAt;
        this.createdAt = props.createdAt ?? new Date();
        this._isDeleted = props.isDeleted ?? false;
    }

    static create(
        props: Omit<AlarmProps, "id" | "createdAt" | "isDeleted">,
    ): Alarm {
        return new Alarm(props);
    }

    static reconstitute(props: AlarmProps): Alarm {
        return new Alarm(props);
    }

    cancel(): void {
        this._isDeleted = true;
    }

    get isDeleted(): boolean {
        return this._isDeleted;
    }
}

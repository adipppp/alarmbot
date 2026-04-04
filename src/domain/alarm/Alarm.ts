export interface AlarmProps {
    id?: bigint;
    guildId: string;
    channelId: string;
    timeOfDay: string;
    triggerAt: Date;
    createdAt?: Date;
    isDeleted?: boolean;
}

export class Alarm {
    readonly id?: bigint;
    readonly guildId: string;
    private _channelId: string;
    private _timeOfDay: string;
    private _triggerAt: Date;
    readonly createdAt: Date;
    private _isDeleted: boolean;

    constructor(props: AlarmProps) {
        this.id = props.id;
        this.guildId = props.guildId;
        this._channelId = props.channelId;
        this._timeOfDay = props.timeOfDay;
        this._triggerAt = props.triggerAt;
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

    reschedule(props: {
        channelId: string;
        timeOfDay: string;
        triggerAt: Date;
    }): void {
        this._channelId = props.channelId;
        this._timeOfDay = props.timeOfDay;
        this._triggerAt = props.triggerAt;
        this._isDeleted = false;
    }

    cancel(): void {
        this._isDeleted = true;
    }

    get channelId(): string {
        return this._channelId;
    }

    get timeOfDay(): string {
        return this._timeOfDay;
    }

    get triggerAt(): Date {
        return this._triggerAt;
    }

    get isDeleted(): boolean {
        return this._isDeleted;
    }
}

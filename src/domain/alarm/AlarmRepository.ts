import { Alarm } from "./Alarm";

export interface AlarmRepository {
    findById(id: bigint): Promise<Alarm | null>;
    findByGuildAndTimeOfDay(guildId: string, timeOfDay: string): Promise<Alarm | null>;
    findActiveByGuildId(guildId: string): Promise<Alarm[]>;
    findAllActive(): Promise<Alarm[]>;
    save(alarm: Alarm): Promise<Alarm>;
    delete(id: bigint): Promise<void>;
}

import { Alarm } from "./Alarm";

export interface AlarmRepository {
    findById(id: bigint): Promise<Alarm | null>;
    save(alarm: Alarm): Promise<Alarm>;
    delete(id: bigint): Promise<void>;
}

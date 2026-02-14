import { Alarm } from "./Alarm";

export interface AlarmRepository {
    save(alarm: Alarm): Promise<Alarm>;
    findById(id: number): Promise<Alarm | null>;
    delete(id: number): Promise<void>;
}

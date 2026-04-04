import { Alarm, AlarmRepository } from "../../domain/alarm";

export type ListAlarmsFunction = (guildId: string) => Promise<Alarm[]>;

export function newListAlarmsFunction(
    alarmRepository: AlarmRepository,
): ListAlarmsFunction {
    return (guildId) => alarmRepository.findActiveByGuildId(guildId);
}

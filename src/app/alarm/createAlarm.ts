import { Alarm, AlarmRepository } from "../../domain/alarm";

export interface CreateAlarmInput {
    guildId: string;
    channelId: string;
    timeOfDay: string;
    triggerAt: Date;
}

export type CreateAlarmFunction = (input: CreateAlarmInput) => Promise<Alarm>;

export function newCreateAlarmFunction(
    alarmRepository: AlarmRepository,
): CreateAlarmFunction {
    return async (input) => {
        const alarm = Alarm.create({
            guildId: input.guildId,
            channelId: input.channelId,
            timeOfDay: input.timeOfDay,
            triggerAt: input.triggerAt,
        });

        return alarmRepository.save(alarm);
    };
}

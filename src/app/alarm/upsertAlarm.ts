import { Alarm, AlarmRepository } from "../../domain/alarm";

export interface UpsertAlarmInput {
    guildId: string;
    channelId: string;
    timeOfDay: string;
    triggerAt: Date;
}

export type UpsertAlarmFunction = (input: UpsertAlarmInput) => Promise<Alarm>;

export function newUpsertAlarmFunction(
    alarmRepository: AlarmRepository,
): UpsertAlarmFunction {
    return async (input) => {
        const existing = await alarmRepository.findByGuildAndTimeOfDay(
            input.guildId,
            input.timeOfDay,
        );

        if (existing === null) {
            return alarmRepository.save(
                Alarm.create({
                    guildId: input.guildId,
                    channelId: input.channelId,
                    timeOfDay: input.timeOfDay,
                    triggerAt: input.triggerAt,
                }),
            );
        }

        existing.reschedule({
            channelId: input.channelId,
            timeOfDay: input.timeOfDay,
            triggerAt: input.triggerAt,
        });

        return alarmRepository.save(existing);
    };
}

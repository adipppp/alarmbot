import { AlarmRepository } from "../../domain/alarm";

export interface CancelAlarmByTimeInput {
    guildId: string;
    timeOfDay: string;
}

export type CancelAlarmByTimeFunction = (input: CancelAlarmByTimeInput) => Promise<void>;

export function newCancelAlarmByTimeFunction(
    alarmRepository: AlarmRepository,
): CancelAlarmByTimeFunction {
    return async (input) => {
        const alarm = await alarmRepository.findByGuildAndTimeOfDay(
            input.guildId,
            input.timeOfDay,
        );

        if (alarm === null || alarm.isDeleted) {
            throw new Error(
                `Alarm for ${input.timeOfDay} was not found for guild ${input.guildId}.`,
            );
        }

        alarm.cancel();
        await alarmRepository.save(alarm);
    };
}

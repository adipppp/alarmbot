import { AlarmRepository } from "../../domain/alarm";

export type CancelAlarmFunction = (alarmId: bigint) => Promise<void>;

export function newCancelAlarmFunction(
    alarmRepository: AlarmRepository,
): CancelAlarmFunction {
    return async (alarmId) => {
        const alarm = await alarmRepository.findById(alarmId);

        if (alarm === null) {
            throw new Error(`Alarm with id ${alarmId} not found.`);
        }

        alarm.cancel();

        await alarmRepository.save(alarm);
    };
}

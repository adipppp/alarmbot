import { Client, ChannelType, VoiceChannel } from "discord.js";
import { Alarm } from "../../domain/alarm";
import { AlarmRepository } from "../../domain/alarm/AlarmRepository";
import { AlarmAudioManager } from "../audio";
import { nextOccurrenceUtc } from "../commands/time";

type TimerHandle = ReturnType<typeof setTimeout>;

export class AlarmScheduler {
    private readonly timers = new Map<bigint, TimerHandle>();

    constructor(
        private readonly client: Client,
        private readonly alarmRepository: AlarmRepository,
        private readonly alarmAudioManager: AlarmAudioManager,
    ) {}

    async start(): Promise<void> {
        const alarms = await this.alarmRepository.findAllActive();
        for (const alarm of alarms) {
            await this.schedule(alarm);
        }
    }

    async schedule(alarm: Alarm): Promise<void> {
        if (alarm.id === undefined || alarm.isDeleted) {
            return;
        }

        if (alarm.triggerAt.getTime() <= Date.now()) {
            alarm.reschedule({
                channelId: alarm.channelId,
                timeOfDay: alarm.timeOfDay,
                triggerAt: nextOccurrenceUtc(alarm.timeOfDay),
            });
            const updated = await this.alarmRepository.save(alarm);
            await this.schedule(updated);
            return;
        }

        this.clear(alarm.id);

        const now = Date.now();
        const triggerAtMs = alarm.triggerAt.getTime();
        const delayMs = Math.max(triggerAtMs - now, 0);

        const timer = setTimeout(async () => {
            await this.trigger(alarm.id as bigint);
        }, delayMs);

        this.timers.set(alarm.id, timer);
    }

    cancel(alarmId: bigint): void {
        this.clear(alarmId);
    }

    private clear(alarmId: bigint): void {
        const timer = this.timers.get(alarmId);
        if (timer === undefined) {
            return;
        }

        clearTimeout(timer);
        this.timers.delete(alarmId);
    }

    private async trigger(alarmId: bigint): Promise<void> {
        this.timers.delete(alarmId);

        const alarm = await this.alarmRepository.findById(alarmId);
        if (alarm === null || alarm.isDeleted) {
            return;
        }

        const channel = await this.client.channels.fetch(alarm.channelId);
        if (channel !== null && channel.type === ChannelType.GuildVoice) {
            await this.alarmAudioManager.playForChannel(channel as VoiceChannel);
        }

        alarm.reschedule({
            channelId: alarm.channelId,
            timeOfDay: alarm.timeOfDay,
            triggerAt: nextOccurrenceUtc(alarm.timeOfDay),
        });
        const updated = await this.alarmRepository.save(alarm);
        await this.schedule(updated);
    }
}

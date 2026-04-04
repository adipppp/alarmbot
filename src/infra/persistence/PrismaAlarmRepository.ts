import { Alarm, AlarmRepository } from "../../domain/alarm";
import { prisma } from "./prisma";

export class PrismaAlarmRepository implements AlarmRepository {
    async findById(id: bigint): Promise<Alarm | null> {
        const record = await prisma.alarm.findUnique({ where: { id } });
        if (record === null) {
            return null;
        }

        return Alarm.reconstitute(record);
    }

    async findByGuildAndTimeOfDay(
        guildId: string,
        timeOfDay: string,
    ): Promise<Alarm | null> {
        const record = await prisma.alarm.findFirst({
            where: {
                guildId,
                timeOfDay,
            },
            orderBy: [{ isDeleted: "asc" }, { id: "desc" }],
        });

        if (record === null) {
            return null;
        }

        return Alarm.reconstitute(record);
    }

    async findActiveByGuildId(guildId: string): Promise<Alarm[]> {
        const records = await prisma.alarm.findMany({
            where: {
                guildId,
                isDeleted: false,
            },
            orderBy: [{ triggerAt: "asc" }],
        });

        return records.map((record) => Alarm.reconstitute(record));
    }

    async findAllActive(): Promise<Alarm[]> {
        const records = await prisma.alarm.findMany({
            where: { isDeleted: false },
            orderBy: [{ triggerAt: "asc" }],
        });

        return records.map((record) => Alarm.reconstitute(record));
    }

    async save(alarm: Alarm): Promise<Alarm> {
        if (alarm.id !== undefined) {
            const updated = await prisma.alarm.update({
                where: { id: alarm.id },
                data: {
                    guildId: alarm.guildId,
                    channelId: alarm.channelId,
                    timeOfDay: alarm.timeOfDay,
                    triggerAt: alarm.triggerAt,
                    isDeleted: alarm.isDeleted,
                },
            });

            return Alarm.reconstitute(updated);
        }

        const created = await prisma.alarm.create({
            data: {
                guildId: alarm.guildId,
                channelId: alarm.channelId,
                timeOfDay: alarm.timeOfDay,
                triggerAt: alarm.triggerAt,
                isDeleted: alarm.isDeleted,
            },
        });

        return Alarm.reconstitute(created);
    }

    async delete(id: bigint): Promise<void> {
        await prisma.alarm.delete({ where: { id } });
    }
}

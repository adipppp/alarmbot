const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTimeOfDay(timeOfDay: string): { hour: number; minute: number } {
    const match = TIME_REGEX.exec(timeOfDay);
    if (match === null) {
        throw new Error("Time must be in HH:mm (24-hour) format.");
    }

    return {
        hour: Number.parseInt(match[1], 10),
        minute: Number.parseInt(match[2], 10),
    };
}

export function normalizeTimeOfDay(timeOfDay: string): string {
    const { hour, minute } = parseTimeOfDay(timeOfDay);
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function nextOccurrenceUtc(timeOfDay: string, now: Date = new Date()): Date {
    const { hour, minute } = parseTimeOfDay(timeOfDay);
    const scheduled = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            hour,
            minute,
            0,
            0,
        ),
    );

    if (scheduled.getTime() <= now.getTime()) {
        scheduled.setUTCDate(scheduled.getUTCDate() + 1);
    }

    return scheduled;
}

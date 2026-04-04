-- CreateTable
CREATE TABLE "Alarm" (
    "id" BIGSERIAL NOT NULL,
    "guildId" VARCHAR(255) NOT NULL,
    "channelId" VARCHAR(255) NOT NULL,
    "triggerAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Alarm_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Alarm" ADD COLUMN "timeOfDay" VARCHAR(5);

-- Backfill timeOfDay from existing triggerAt values in UTC HH:mm format
UPDATE "Alarm"
SET "timeOfDay" = TO_CHAR("triggerAt" AT TIME ZONE 'UTC', 'HH24:MI')
WHERE "timeOfDay" IS NULL;

-- Enforce non-null after backfill
ALTER TABLE "Alarm" ALTER COLUMN "timeOfDay" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Alarm_guildId_timeOfDay_isDeleted_idx" ON "Alarm"("guildId", "timeOfDay", "isDeleted");

-- CreateIndex
CREATE INDEX "Alarm_isDeleted_triggerAt_idx" ON "Alarm"("isDeleted", "triggerAt");

-- CreateEnum
CREATE TYPE "AccessPrincipalType" AS ENUM ('USER', 'ROLE');

-- CreateTable
CREATE TABLE "GuildCommandAccess" (
    "id" BIGSERIAL NOT NULL,
    "guildId" VARCHAR(255) NOT NULL,
    "principalType" "AccessPrincipalType" NOT NULL,
    "principalId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildCommandAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildCommandAccess_guildId_principalType_principalId_key" ON "GuildCommandAccess"("guildId", "principalType", "principalId");

-- CreateIndex
CREATE INDEX "GuildCommandAccess_guildId_idx" ON "GuildCommandAccess"("guildId");

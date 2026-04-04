import {
    AccessPrincipalType,
    GuildCommandAccess,
    GuildCommandAccessRepository,
} from "../../domain/access";
import { AccessPrincipalType as PrismaAccessPrincipalType } from "../../generated/prisma/enums";
import { prisma } from "./prisma";

function toPrismaPrincipalType(
    principalType: AccessPrincipalType,
): PrismaAccessPrincipalType {
    return principalType === "USER"
        ? PrismaAccessPrincipalType.USER
        : PrismaAccessPrincipalType.ROLE;
}

function toDomainPrincipalType(
    principalType: PrismaAccessPrincipalType,
): AccessPrincipalType {
    return principalType === PrismaAccessPrincipalType.USER ? "USER" : "ROLE";
}

export class PrismaGuildCommandAccessRepository
    implements GuildCommandAccessRepository
{
    async addAccess(entry: GuildCommandAccess): Promise<GuildCommandAccess> {
        const record = await prisma.guildCommandAccess.upsert({
            where: {
                guildId_principalType_principalId: {
                    guildId: entry.guildId,
                    principalType: toPrismaPrincipalType(entry.principalType),
                    principalId: entry.principalId,
                },
            },
            update: {},
            create: {
                guildId: entry.guildId,
                principalType: toPrismaPrincipalType(entry.principalType),
                principalId: entry.principalId,
            },
        });

        return GuildCommandAccess.reconstitute({
            id: record.id,
            guildId: record.guildId,
            principalType: toDomainPrincipalType(record.principalType),
            principalId: record.principalId,
            createdAt: record.createdAt,
        });
    }

    async removeAccess(
        guildId: string,
        principalType: AccessPrincipalType,
        principalId: string,
    ): Promise<void> {
        await prisma.guildCommandAccess.deleteMany({
            where: {
                guildId,
                principalType: toPrismaPrincipalType(principalType),
                principalId,
            },
        });
    }

    async listAccessByGuildId(guildId: string): Promise<GuildCommandAccess[]> {
        const records = await prisma.guildCommandAccess.findMany({
            where: { guildId },
            orderBy: [{ principalType: "asc" }, { principalId: "asc" }],
        });

        return records.map((record) =>
            GuildCommandAccess.reconstitute({
                id: record.id,
                guildId: record.guildId,
                principalType: toDomainPrincipalType(record.principalType),
                principalId: record.principalId,
                createdAt: record.createdAt,
            }),
        );
    }
}

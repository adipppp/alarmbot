import { Client, Events, GatewayIntentBits } from "discord.js";
import {
    newAddCommandAccessFunction,
    newListCommandAccessFunction,
    newRemoveCommandAccessFunction,
} from "../app/access";
import {
    newCancelAlarmByTimeFunction,
    newListAlarmsFunction,
    newUpsertAlarmFunction,
} from "../app/alarm";
import {
    PrismaAlarmRepository,
    PrismaGuildCommandAccessRepository,
} from "../infra";
import { AlarmAudioManager } from "./audio";
import { handleClientReady, handleInteractionCreate } from "./handlers";
import { AlarmScheduler } from "./scheduler/AlarmScheduler";

const INTENTS = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    // GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
];

export class AlarmbotClient extends Client {
    private readonly alarmRepository = new PrismaAlarmRepository();
    private readonly commandAccessRepository = new PrismaGuildCommandAccessRepository();
    private readonly alarmAudioManager = new AlarmAudioManager();
    private readonly alarmScheduler = new AlarmScheduler(
        this,
        this.alarmRepository,
        this.alarmAudioManager,
    );

    private readonly upsertAlarm = newUpsertAlarmFunction(this.alarmRepository);
    private readonly cancelAlarmByTime = newCancelAlarmByTimeFunction(
        this.alarmRepository,
    );
    private readonly listAlarms = newListAlarmsFunction(this.alarmRepository);

    private readonly addCommandAccess = newAddCommandAccessFunction(
        this.commandAccessRepository,
    );
    private readonly removeCommandAccess = newRemoveCommandAccessFunction(
        this.commandAccessRepository,
    );
    private readonly listCommandAccess = newListCommandAccessFunction(
        this.commandAccessRepository,
    );

    constructor() {
        super({ intents: INTENTS });
        this.registerHandlers();
    }

    private registerHandlers(): void {
        this.on(Events.ClientReady, () =>
            void handleClientReady(this, this.alarmScheduler),
        );
        this.on(Events.InteractionCreate, (interaction) =>
            void handleInteractionCreate(interaction, {
                upsertAlarm: this.upsertAlarm,
                cancelAlarmByTime: this.cancelAlarmByTime,
                listAlarms: this.listAlarms,
                addCommandAccess: this.addCommandAccess,
                removeCommandAccess: this.removeCommandAccess,
                listCommandAccess: this.listCommandAccess,
                alarmScheduler: this.alarmScheduler,
                stopActiveAlarm: (guildId) =>
                    this.alarmAudioManager.stopForGuild(guildId),
            }),
        );
    }
}

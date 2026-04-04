import {
    AudioPlayer,
    AudioPlayerStatus,
    VoiceConnection,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ALARM_AUDIO_PATH = resolve(__dirname, "../../../migu_alarm.m4a");
const VOICE_CONNECT_TIMEOUT_MS = 10_000;
const AUDIO_PLAY_TIMEOUT_MS = 60_000;

interface ActivePlayback {
    connection: VoiceConnection;
    player: AudioPlayer;
}

export class AlarmAudioManager {
    private readonly activePlaybacks = new Map<string, ActivePlayback>();

    async playForChannel(channel: VoiceChannel): Promise<void> {
        if (!existsSync(ALARM_AUDIO_PATH)) {
            throw new Error(`Alarm audio file not found at ${ALARM_AUDIO_PATH}`);
        }

        this.stopForGuild(channel.guild.id);

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        const player = createAudioPlayer();
        this.activePlaybacks.set(channel.guild.id, { connection, player });

        try {
            await entersState(
                connection,
                VoiceConnectionStatus.Ready,
                VOICE_CONNECT_TIMEOUT_MS,
            );

            const resource = createAudioResource(ALARM_AUDIO_PATH);
            connection.subscribe(player);
            player.play(resource);

            await entersState(player, AudioPlayerStatus.Idle, AUDIO_PLAY_TIMEOUT_MS);
        } finally {
            const active = this.activePlaybacks.get(channel.guild.id);
            if (active !== undefined && active.connection === connection) {
                this.activePlaybacks.delete(channel.guild.id);
            }
            connection.destroy();
        }
    }

    stopForGuild(guildId: string): boolean {
        const active = this.activePlaybacks.get(guildId);
        if (active === undefined) {
            return false;
        }

        active.player.stop(true);
        active.connection.destroy();
        this.activePlaybacks.delete(guildId);
        return true;
    }

    isPlayingInGuild(guildId: string): boolean {
        return this.activePlaybacks.has(guildId);
    }
}

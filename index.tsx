/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType, PluginNative } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const Native = VencordNative.pluginHelpers.WayAFKNext as PluginNative<typeof import("./native")>;

const pluginSettings = definePluginSettings({
    enableDetection: {
        description: "Turn it all off.",
        type: OptionType.BOOLEAN,
        default: false,
    },
});

export default definePlugin({
    name: "WayAFKNext",
    description: "Fixes auto AFK functionality on Wayland Linux desktops",
    authors: [{ name: "MuffinTastic", id: 0n }],

    // remove base Discord AFK dispatches for peace of mind
    // these don't do anything on linux anyways
    patches: [
        {
            find: 'type:"IDLE",idle:',
            replacement: [
                {
                    match: /\i\.\i\.dispatch\({type:"IDLE",idle:!1}\)/,
                    replace: "{}"
                },
                {
                    match: /\i\.\i\.dispatch\({type:"IDLE",idle:!0,idleSince:\i}\)/,
                    replace: "{}"
                }
            ]
        },
        {
            find: 'type:"AFK",afk:',
            replacement: [
                {
                    match: /\i\.\i\.dispatch\({type:"AFK",afk:!1}\)/,
                    replace: "{}"
                },
                {
                    match: /\i\.\i\.dispatch\({type:"AFK",afk:!0}\)/,
                    replace: "{}"
                },
            ]
        }
    ],

    async start() {
        console.log("[WayAFKNext] Starting");

        try {
            await Native.downloadAndVerify();
        } catch (err) {
            console.error("[WayAFKNext]", err);
            return;
        }

        await Native.startMonitor();

        await Native.startWatch(1);
        console.log("[WayAFKNext] Started");
    },

    stop() {
        Native.stopWatch();
        Native.killMonitor();
        console.log("[WayAFKNext] Stopping");

    },

    async handleEvent(data: string) {
        const evt = JSON.parse(data);

        if ("Idle" in evt) {
            this.onIdleState(evt.Idle);
        } else if ("WatchStarted" in evt) {
            this.onWatchStarted(evt.WatchStarted);
        } else if ("WatchStopped" in evt) {
            this.onWatchStopped();
        } else if ("Error" in evt) {
            this.onMonitorError(evt.Error);
        } else if ("Exit" in evt) {
            this.onMonitorExit(evt.Exit);
        }
    },

    async onIdleState(idle: boolean) {
        console.log("[WayAFKNext] Watch reports idle:", idle);

        FluxDispatcher.dispatch({
            type: "IDLE",
            idle: idle
        });

        FluxDispatcher.dispatch({
            type: "AFK",
            afk: idle
        });
    },

    async onWatchStarted(duration: number) {
        console.log("[WayAFKNext] Watch started with a duration of", duration, "minutes");
    },

    async onWatchStopped() {
        console.log("[WayAFKNext] Watch stopped");
    },

    async onMonitorError(error: string) {
        console.error("[WayAFKNext] Monitor error", error);
    },

    async onMonitorExit(code: number) {
        console.log("[WayAFKNext] Monitor exited with code", code);
    }
});

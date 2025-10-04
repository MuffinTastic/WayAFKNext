/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DATA_DIR } from "@main/utils/constants";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import crypto from "crypto";
import { IpcMainInvokeEvent, WebContents } from "electron";
import fs, { chmodSync } from "fs";
import os from "os";
import path from "path";

const platform = os.platform();

if (platform !== "linux") {
    throw new Error("Unsupported platform");
}

function getArch(): string {
    const arch = os.arch();

    switch (arch) {
        case "x64":
            return "x86_64";
        case "arm64":
            return "aarch64";
        default:
            throw new Error("Unsupported architecture");
    }
}

const arch = getArch();

const url = `https://github.com/MuffinTastic/wayafknext-monitor/releases/download/v0.1.1-s/wayafknext-monitor.${arch}`;
const shas = {
    "x86_64": "d371d3edb33f2f9de3702602564915ba93e00c959b1e839c8108caf38936f733",
    "aarch64": "8d7abff15008270ba8cd5cbee8e6383b0106e185d579806a2b8f2c2b21be60eb",
};

const tmpDir = path.join(DATA_DIR, "wayafknext");
const fileName = path.basename(url);
const filePath = path.join(tmpDir, fileName);

async function downloadToBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function verifySha(buffer: Buffer, arch: string): boolean {
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    return hash === shas[arch];
}

export async function downloadAndVerify(_: IpcMainInvokeEvent) {
    if (fs.existsSync(filePath)) {
        const existing = fs.readFileSync(filePath);
        if (verifySha(existing, arch)) {
            console.log("[WayAFKNext] Binary found");
            return;
        }
    }

    console.log("[WayAFKNext] Downloading binary:", url);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const buffer = await downloadToBuffer(url);

    if (!verifySha(buffer, arch)) {
        throw new Error("Binary hash didn't match, aborting");
    }

    await fs.promises.writeFile(filePath, buffer);

    chmodSync(filePath, 0o755);

    console.log("[WayAFKNext] Downloaded binary!");
}

let webFrame: WebContents;
let proc: ChildProcessWithoutNullStreams | null = null;

export async function startMonitor(e: IpcMainInvokeEvent) {
    if (proc) return;

    console.log("[WayAFKNext] Starting monitor");

    webFrame = e.sender;

    proc = spawn(filePath, [], {
        detached: false,
        stdio: "pipe"
    });

    proc.stdout.setEncoding("utf-8");
    proc.stdout.on("data", (data: string) => {
        const text = data.trim();
        sendEvent(text);
    });

    proc.on("close", code => {
        sendEvent({ Exit: code });
        proc = null;
    });
}

function sendEvent(event: any) {
    webFrame.executeJavaScript(
        `Vencord.Plugins.plugins.WayAFKNext.handleEvent(${JSON.stringify(event)});`
    );
}


export async function startWatch(_: IpcMainInvokeEvent, timeoutMins: number) {
    if (proc) {
        proc.stdin.write(timeoutMins + "\n");
    }
}

export async function stopWatch() {
    if (proc) {
        proc.stdin.write("stop\n");
    }
}

function _killMonitor() {
    if (proc) {
        proc.kill();
        proc = null;
        sendEvent({ Exit: 0 });
    }
}

export async function killMonitor(_: IpcMainInvokeEvent) {
    _killMonitor();
}
export async function monitorIsRunning(_: IpcMainInvokeEvent): Promise<boolean> {
    return proc !== null;
}

process.on("exit", _killMonitor);
process.on("SIGINT", _killMonitor);
process.on("SIGTERM", _killMonitor);
process.on("SIGQUIT", _killMonitor);

// const result = await webframe.executeJavascript(
//   `Vencord.Plugins.plugins.MyPlugin.handleEvent(${JSON.stringify(event)});`
// );

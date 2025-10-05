# WayAFKNext

A Vencord plugin that fixes auto AFK functionality on Linux Wayland desktops.

Inspired by [WayAFK](https://github.com/Colonial-Dev/WayAFK)'s goals and limitations.

## Platform Support

- x86_64 / AMD64
- aarch64 / ARM64

## Installation

Same as always with Vencord plugins.

https://docs.vencord.dev/installing/custom-plugins/

Use the [latest version from releases](/releases/latest).

File paths should look like `userplugins/WayAFKNext/index.tsx`, etc.

## How it works:

This downloads a pre-built binary: https://github.com/MuffinTastic/wayafknext-monitor.

The binary is nothing but a bridge between Discord and `wayland-protocols ext-idle-notify-v1` / `org.gnome.Mutter.IdleMonitor` using a UNIX socket. The plugin issues commands to start/stop watches with different durations. When the bridge informs the plugin the user has gone AFK or came back, the plugin calls Discord's existing AFK functionality.

I did it this way to avoid adding extra dependencies to Vencord, though realistically that wouldn't have hurt anything.

Binary and socket end up in `~/.config/Vencord/wayafknext/`.

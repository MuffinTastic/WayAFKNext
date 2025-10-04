# WayAFKNext

I got annoyed enough with Discord's Away / Idle status not working properly on Wayland to make this.

Inspired by [WayAFK](https://github.com/Colonial-Dev/WayAFK)'s goals and limitations.

### How it works:

This downloads a pre-built binary: https://github.com/MuffinTastic/wayafknext-monitor.

The binary is nothing but a bridge between `stdin` / `stdout` and `wayland-protocols ext-idle-notify-v1` / `org.gnome.Mutter.IdleMonitor`. The host process (Vencord) can issue commands to start/stop watches with different durations.

I did it this way to avoid adding an extra dependency to Vencord, though realistically that wouldn't have hurt anything.


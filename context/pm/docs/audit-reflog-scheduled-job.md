# Audit Reflog — Scheduled Job & Alerts

Weekly check for unintended `git reset --hard` or `reset to origin/main` across all workspace repos. Alerts via macOS
notification when high-risk resets are found.

## Script locations

| Item                       | Path                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------- |
| **Audit script**           | `unified-trading-pm/scripts/repo-management/audit-reflog-resets.sh`                |
| **Wrapper (with alert)**   | `unified-trading-pm/scripts/repo-management/run-audit-reflog-with-alert.sh`        |
| **Launchd plist**          | `~/Library/LaunchAgents/com.unified-trading.audit-reflog.plist`                    |
| **Install script**         | `unified-trading-pm/scripts/repo-management/launchd/install-audit-reflog.sh`       |
| **Log**                    | `/tmp/audit-reflog.log`                                                            |
| **Ignore list**            | `unified-trading-pm/scripts/repo-management/audit-reflog-ignore.txt`               |
| **Watch script (fswatch)** | `unified-trading-pm/scripts/repo-management/watch-and-audit-reflog.sh`             |
| **Watch plist**            | `~/Library/LaunchAgents/com.unified-trading.audit-reflog-watch.plist`              |
| **Watch install**          | `unified-trading-pm/scripts/repo-management/launchd/install-audit-reflog-watch.sh` |
| **Watch log**              | `/tmp/audit-reflog-watch.log`                                                      |

## Run manually

```bash
cd /path/to/unified-trading-system-repos
bash unified-trading-pm/scripts/repo-management/run-audit-reflog-with-alert.sh
```

Or audit only (no notification):

```bash
bash unified-trading-pm/scripts/repo-management/audit-reflog-resets.sh
```

## Test notification

```bash
terminal-notifier -title "Audit Reflog" -message "Test: Click to open log" -sound default -execute "open /tmp/audit-reflog.log"
```

## Start the scheduled job

```bash
cd /path/to/unified-trading-system-repos
bash unified-trading-pm/scripts/repo-management/launchd/install-audit-reflog.sh
launchctl load ~/Library/LaunchAgents/com.unified-trading.audit-reflog.plist
```

Runs **every 10 min**.

## Event-based watch (fswatch)

Runs the audit whenever `.git/logs` changes in any workspace repo (commit, reset, checkout, etc.). Uses `fswatch`;
install via `brew install fswatch` if needed.

```bash
cd /path/to/unified-trading-system-repos
bash unified-trading-pm/scripts/repo-management/launchd/install-audit-reflog-watch.sh
launchctl load ~/Library/LaunchAgents/com.unified-trading.audit-reflog-watch.plist
```

The watch job runs in the background with `KeepAlive`; it triggers the same wrapper (audit + notification on high-risk).
Log: `/tmp/audit-reflog-watch.log`.

**Stop watch job:**

```bash
launchctl unload ~/Library/LaunchAgents/com.unified-trading.audit-reflog-watch.plist
```

## Cancel / stop the job

```bash
launchctl unload ~/Library/LaunchAgents/com.unified-trading.audit-reflog.plist
```

## Check job status

```bash
launchctl list | grep audit-reflog
```

## Solved vs ignore list

**Solved (automatic):** A reset is considered solved if the "lost" commit is now in `origin/main` — either the exact
commit was recovered, or the same patch was committed (e.g. cherry-pick). No ignore entry needed.

**Per-commit ignore (intentional discard):** When you intentionally reset and discard work, add the specific commit to
`audit-reflog-ignore.txt` as `repo:hash` (e.g. `deployment-api:b103671`). The audit output shows the exact line to add.
This keeps the ignore scoped to that commit — future genuine breaches in the same repo will still be detected.

**Legacy:** `repo` only (no colon) = ignore whole repo. Prefer per-commit when possible.

## Linux setup (systemd)

Linux uses `systemd` user timers instead of `launchd`. Notifications use `notify-send` instead of `terminal-notifier`.

### Prerequisites

```bash
# Debian/Ubuntu
sudo apt install inotify-tools libnotify-bin

# Fedora/RHEL
sudo dnf install inotify-tools libnotify
```

### Scheduled audit (every 10 min)

Create `~/.config/systemd/user/audit-reflog.service`:

```ini
[Unit]
Description=Unified Trading — audit reflog resets

[Service]
Type=oneshot
WorkingDirectory=/path/to/unified-trading-system-repos
ExecStart=/bin/bash unified-trading-pm/scripts/repo-management/run-audit-reflog-with-alert.sh
StandardOutput=append:/tmp/audit-reflog.log
StandardError=append:/tmp/audit-reflog.log
```

Create `~/.config/systemd/user/audit-reflog.timer`:

```ini
[Unit]
Description=Run audit-reflog every 10 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=10min

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
systemctl --user daemon-reload
systemctl --user enable --now audit-reflog.timer
systemctl --user list-timers | grep audit-reflog
```

### Event-based watch (inotifywait)

Create `~/.config/systemd/user/audit-reflog-watch.service`:

```ini
[Unit]
Description=Unified Trading — fswatch audit reflog (inotifywait)

[Service]
Type=simple
WorkingDirectory=/path/to/unified-trading-system-repos
ExecStart=/bin/bash -c 'inotifywait -m -r -e modify,create,delete --include "ORIG_HEAD|HEAD|logs" \
  $(find /path/to/unified-trading-system-repos -maxdepth 2 -name ".git" -type d | head -60 | sed "s|$|/logs|") \
  | while read -r dir event file; do \
      bash unified-trading-pm/scripts/repo-management/run-audit-reflog-with-alert.sh; \
      sleep 2; \
    done'
Restart=on-failure
StandardOutput=append:/tmp/audit-reflog-watch.log
StandardError=append:/tmp/audit-reflog-watch.log

[Install]
WantedBy=default.target
```

Enable:

```bash
systemctl --user daemon-reload
systemctl --user enable --now audit-reflog-watch.service
systemctl --user status audit-reflog-watch.service
```

### Linux notifications

`run-audit-reflog-with-alert.sh` uses `terminal-notifier` by name — on Linux replace that call with `notify-send`:

```bash
notify-send -u critical "Audit Reflog — High Risk" "See /tmp/audit-reflog.log"
```

Or set `DBUS_SESSION_BUS_ADDRESS` if running in a non-desktop session (e.g. SSH):

```bash
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u)/bus"
notify-send "Audit Reflog" "High risk resets found"
```

### Check status (Linux)

```bash
systemctl --user status audit-reflog.timer
systemctl --user status audit-reflog-watch.service
journalctl --user -u audit-reflog.service --since "1 hour ago"
```

### Stop / disable (Linux)

```bash
systemctl --user disable --now audit-reflog.timer
systemctl --user disable --now audit-reflog-watch.service
```

---

## Implementation notes (for similar notification scripts)

When creating or copying scripts that run audits and show macOS notifications:

| Gotcha                                                                      | Fix                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **set -e** exits before notification when audit returns 1                   | Use `cmd \|\| exit_code=$?` and `exit_code=0` before; don't let set -e trigger on the audit |
| **launchd** has minimal PATH; `command -v terminal-notifier` fails          | Use full paths: `/opt/homebrew/bin/terminal-notifier` or `/usr/local/bin/terminal-notifier` |
| **Cursor/agent** runs may deliver notifications; user terminal runs may not | Same script works in both; if user sees no alert, check set -e and PATH                     |

Wrapper script: `run-audit-reflog-with-alert.sh` — reference when building similar alert scripts.

## Alert behavior

- **No high-risk resets:** Script exits 0, no notification.
- **High-risk resets found:** Script exits 1, macOS notification with sound. Click to open log.

**Stay until acknowledged:** System Settings → Notifications → terminal-notifier → set delivery style to **Alerts** (not
Banners). Alerts stay on screen until dismissed.

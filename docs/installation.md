# opencode-tokscale Installation Guide

> This guide is designed for LLM agents to follow step-by-step. Each step includes expected outcomes for verification.

## What is opencode-tokscale?

An opencode TUI plugin that displays [tokscale](https://github.com/junhoyeo/tokscale) token usage statistics in the sidebar. Shows total tokens and costs for today, this week, and this month.

## Prerequisites

- [opencode](https://opencode.ai) installed and working
- Plugin support (`@opencode-ai/plugin` >= 1.4.3)
- [tokscale](https://github.com/junhoyeo/tokscale) CLI installed and in PATH

### Check tokscale

```bash
tokscale --version
```

If not installed:

```bash
npm i -g @tokscale/cli
```

## Step 1: Configure the TUI plugin

Edit `~/.config/opencode/tui.json`. Create the file if it doesn't exist.

Add `["opencode-tokscale", { "enabled": true }]` to the `plugin` array:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    ["opencode-tokscale", { "enabled": true }]
  ]
}
```

**If the file already exists with other plugins**, append to the existing array. Do not replace existing entries:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    ["existing-plugin", { "enabled": true }],
    ["opencode-tokscale", { "enabled": true }]
  ]
}
```

### Options

All options are optional. Defaults shown:

```json
["opencode-tokscale", {
  "enabled": true,
  "refreshInterval": 60,
  "showOpenCodeOnly": true
}]
```

| Option | Type | Default | Description |
|---|---|---|---|
| `refreshInterval` | `number` | `60` | Seconds between data refreshes |
| `showOpenCodeOnly` | `boolean` | `true` | Only count opencode usage. Set `false` for all AI clients |

## Step 2: Restart opencode

The plugin loads at startup. Restart opencode to activate.

## Verification

After restart, the sidebar should show a "Tokscale" section near the top with three time period rows:

```
Tokscale
Today        1.2M    $3.45
This Week    5.6M   $12.34
This Month  12.3M   $45.67
```

If tokscale is not installed, you will see:

```
Tokscale
Install: npm i -g @tokscale/cli
```

If there is no usage data yet, values show as `—`.

## Troubleshooting

- **Plugin not showing**: Verify `tui.json` exists at `~/.config/opencode/tui.json` and contains the plugin entry. Restart opencode after editing.
- **"Install: npm i -g @tokscale/cli" message**: tokscale binary is not found in PATH. Run `npm i -g @tokscale/cli` and restart opencode.
- **All values show $0.00**: tokscale has no session data to scan. Use opencode for a while, then check again.
- **Data not updating**: Default refresh is 60 seconds. Wait or lower `refreshInterval` in options.
- **Shows data from other clients**: Set `"showOpenCodeOnly": true` (default) to filter to opencode sessions only.

## Uninstall

1. Remove `["opencode-tokscale", { "enabled": true }]` from `~/.config/opencode/tui.json` plugin array
2. Restart opencode

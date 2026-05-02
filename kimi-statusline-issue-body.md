I would like Kimi Code CLI to support a **configurable statusline (status bar)** similar to Claude Code's `statusline` feature.

## Background

Claude Code allows users to configure a custom shell script that receives a JSON payload after every interaction, containing rich runtime metadata:

- Model name and version
- Current working directory and Git branch
- **Total cost (USD)**
- **Context window usage percentage and token counts**
- **Rate limits (5h / 7d usage with reset countdown)**
- **Input/output token counts**
- **Cache read/write hit rates**
- **API wait time vs total duration**
- Git file stats (modified / added / deleted)
- Vim mode, active agent name

The script then formats and prints this information, giving users a persistent overview of their session state and API consumption at a glance.

## My Use Case

As a heavy user who tracks API costs and context efficiency across long sessions, I currently have a custom `statusline.sh` script for Claude Code that shows me:

```
Claude Sonnet 4 v0.1.0 | my-project (main) | +45 -12 lines | 3M 1A
████████████████░░░░░ 67% | $0.42 | 2m 15s | 5h 23% (1h 42m) | 7d 15% (2d 5h)
cache 45% | in: 202.1K out: 4.5K | api wait 12s (8%) | cur 15K in 8K read 2K write
```

This helps me:
1. **Monitor costs** in real-time without running `/usage` manually
2. **Watch context window** to know when compaction is approaching
3. **Track rate limits** to avoid hitting quotas unexpectedly
4. **See Git status** at a glance while coding

## What Kimi CLI Currently Has

I understand Kimi CLI already shows `context: 45.2% (120k/262k)` in the Live area during generation, and the `/usage` command displays API quotas. However:
- There is **no persistent status bar** that stays visible between turns
- **Cost data is not exposed** to users at all
- **Rate limit data** from `/usage` is not shown inline during the session
- **Token breakdown** (input vs output, cache read vs write) is unavailable
- There is **no hook or config option** to run a custom script with session metadata

## Proposed Implementation

I suggest adding a new optional configuration in `~/.kimi/config.toml`:

```toml
[statusline]
enabled = true
command = "~/.config/kimi/statusline.sh"  # or any executable script
```

When enabled, Kimi CLI would pass a JSON object to the script's stdin after each agent turn (similar to Claude Code's behavior), containing:

```json
{
  "model": {
    "name": "kimi-k2-thinking-turbo",
    "display_name": "Kimi K2.5 Thinking Turbo"
  },
  "version": "1.41.0",
  "workspace": {
    "current_dir": "/path/to/project"
  },
  "context_window": {
    "used_percentage": 45.2,
    "context_window_size": 262144,
    "total_input_tokens": 120000,
    "total_output_tokens": 4500,
    "current_usage": {
      "input_tokens": 15000,
      "cache_read_input_tokens": 8000,
      "cache_creation_input_tokens": 2000
    }
  },
  "cost": {
    "total_cost_usd": 0.42,
    "total_duration_ms": 135000,
    "total_api_duration_ms": 12000
  },
  "rate_limits": {
    "five_hour": {
      "used_percentage": 23.0,
      "resets_at": 1715000000
    },
    "seven_day": {
      "used_percentage": 15.0,
      "resets_at": 1715500000
    }
  },
  "agent": {
    "name": "default"
  }
}
```

The script would print to stdout, and Kimi CLI would display the output as a persistent status bar (e.g., at the bottom of the terminal or above the prompt).

## Alternative / Simpler Approach

If a full statusline mechanism is too complex, even just exposing the data via a **Stop Hook** with usage metadata would be helpful. Currently the `Stop` hook only receives `session_id`, `cwd`, `hook_event_name`, and `stop_hook_active` — it would be great if it also included `context_usage`, `context_tokens`, `cost`, and `rate_limits`.

## References

- Claude Code documentation on statusline configuration
- My existing `statusline.sh` script (adapted from Claude Code community)

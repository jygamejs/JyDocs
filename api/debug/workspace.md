# Debug Workspace

<Badge type="info">New in v0.8.2</Badge>

## Overview

The debug workspace is a separate browser window that connects to the running game via `BroadcastChannel` and receives real-time ECS world snapshots. It provides the same views as the in-game overlay but in a standalone tabbed interface.

## Opening

Press **Ctrl+F3** to open the workspace. The window name `"jygame-debug-workspace"` ensures only one workspace tab is created.

## Architecture

```
Game (browser tab)
  │
  ├── BrowserDebugBackend
  │     └── BroadcastChannel("jygame-debug")
  │           ├── send: world snapshots (each frame)
  │           └── receive: commands (pause, resume, stepFrame)
  │
Workspace (separate browser tab)
  │
  ├── BrowserDebugBackend
  │     └── BroadcastChannel("jygame-debug")
  │           ├── receive: world snapshots
  │           └── send: commands
  │
  └── WorkspaceHost
        ├── WorkspaceState
        ├── WorkspaceSnapshotStore
        └── Views: Performance, FrameGraph, Timeline, ...
```

## Backend Abstraction

| Backend | Description |
|---------|-------------|
| `DebugBackend` | Abstract base with `open()`, `close()`, `send()`, `onMessage()` |
| `BrowserDebugBackend` | `BroadcastChannel`-based transport for same-origin communication |
| `NullDebugBackend` | No-op (disables workspace) |
| `TestDebugBackend` | In-memory message queue for tests |

## Commands

The workspace can send commands to the game:

| Command | Description |
|---------|-------------|
| `debug:pause` | Pause the game loop |
| `debug:resume` | Resume the game loop |
| `debug:stepFrame` | Advance by one frame |
| `debug:togglePause` | Toggle pause state |

## WorkspaceHost

The main class running in the workspace window. It manages the tabbed UI, snapshot ingestion, and view rendering on a dedicated canvas.

## WorkspaceSnapshotStore

Ingests and indexes incoming `WorldSnapshot` objects, making them available for inspection in the views.

See also: [Getting Started](/api/debug/getting-started), [Diagnostics Engine](/api/debug/diagnostics), [World Snapshots](/api/debug/snapshots).

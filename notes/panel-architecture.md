# Dockable MAVLink Panel System – Architecture Notes

> Last updated: {{DATE}}

## 1. Problem Definition

We need a **generic, reusable framework** that lets any React component become a "dockable panel".
Each panel should be able to:

1. **Subscribe** to one or more MAVLink topics (telemetry, status, etc.).
2. **Publish** commands (MAVLink or app-specific) back to the main WebSocket.
3. Optionally **read / mutate** shared application state (e.g., layout presets, global settings).

Constraints

- Single WebSocket connection (avoid N× sockets as panels grow).
- Type-safe pub/sub to prevent payload mismatches.
- Minimal re-renders for high-frequency telemetry (50–100 Hz).
- Dockview-compatible (panels are just React nodes)
- Works with Bun + Vite + Tailwind + Shadcn UI (strict TS no any).

---

## 2. Proposed Layering

```text
┌─────────────────────────┐
│ MavlinkProvider (WS)    │  ← owns websocket & (optional) decode
├─────────────────────────┤
│   In-memory Bus (mitt)  │  ← tiny event emitter
├─────────────────────────┤
│   Custom Hooks          │  • useMavlinkTopic()
│                         │  • useMavlinkCommand()
└─────────────────────────┘
        ▲          ▲
        │          │
┌───────┴───┐  ┌───┴─────────┐
│ Attitude  │  │ Settings UI │ etc.
└───────────┘  └─────────────┘
```

### 2.1 MavlinkProvider

- Wraps the app once.
- Uses `react-use-websocket` for auto-reconnect & heartbeat.
- Decodes raw frames → `{ type: "ATTITUDE", payload: {...} }`.
- Emits each frame on **bus** and optionally caches "latest" in Zustand.
- Exposes `sendCommand(json)` via React Context.

### 2.2 Message Bus

- Single mitt emitter instance.
- Generic signature `Emitter<MavlinkTopicMap>` (strict types).
- **subscribe()** returns unsubscribe fn for ergonomic cleanup.
- Fast (~3M msg/s on laptop).

### 2.3 Hooks

#### useMavlinkTopic(topic, initial?)  → data
- Internally calls subscribe() & local `useState`.
- First render can fetch cached latest from Zustand to avoid "flash of undefined".
- No dependency on React Context ⇒ can be called anywhere.

#### useMavlinkCommand()  → { send(cmd) }
- Thin wrapper around context's `sendCommand`.
- Could add QoS, retries, command queue here later.

### 2.4 Dockable Panels

Each panel is a regular functional component placed inside `<DockPanel title="…">`.

Example (pseudo-code):
```tsx
export const GpsPanel: React.FC = () => {
  const gps = useMavlinkTopic("GPS_RAW_INT")
  if (!gps) return <DockPanel title="GPS">Waiting…</DockPanel>
  return (
    <DockPanel title="GPS">
      <p>Lat: {gps.lat}</p>
      <p>Lon: {gps.lon}</p>
    </DockPanel>
  )
}
```

No prop-drilling, no Redux boilerplate.

---

## 3. Extension Ideas / Open Questions

| Idea | Benefit | Notes |
| ---- | ------- | ----- |
| **Dynamic Topic Filters** | Panel can change subscription at runtime (dropdown). | Expose `updateTopic(newTopic)` from hook. |
| **Topic Wildcards** | Subscribe to prefix e.g. `SYS_STATUS.*`. | Use glob ‑> regex & check in bus publish. |
| **Recorded Playback** | Feed panels from a log file for debugging. | Provider switches source: `ws://` vs `file://`. |
| **Multiple Vehicles** | Add `vehicleId` to topic key. Panels choose id. | Typing: `ATTITUDE@1`, `ATTITUDE@2`. |
| **Back-pressure / Throttling** | Prevent React overload at 100 Hz. | Bus publishes every msg, panel hook can `throttle` or `useLatestRef`. |
| **Command ACK Tracking** | Display success/fail per command. | Store promises keyed by `commandId`. |
| **Presence / Multi-user** | Sync layout between clients. | Swap WS for Ably/Socket.IO, keep same bus. |

---

## 4. Implementation Checklist (MVP)

- [ ] Create `src/modules/mavlink/` directory
  - [ ] `mavlink-types.ts`
  - [ ] `mavlink-bus.ts`
  - [ ] `MavlinkProvider.tsx`
  - [ ] `useMavlinkTopic.ts`
  - [ ] `useMavlinkCommand.ts`
- [ ] Wrap `<App>` with `<MavlinkProvider>`
- [ ] Convert one existing panel (e.g., DataPanel) to use the hook
- [ ] Stress-test with 50 Hz simulated feed
- [ ] Document command pattern & error handling

---

## 5. References

- Alex Booker, "The complete guide to WebSockets with React", Ably blog, Apr 2024.  
  <https://ably.com/blog/websockets-react-tutorial>
- mitt – Tiny ~200 B functional event emitter.  
  <https://github.com/developit/mitt>

---

## 6. Next Steps (Post-MVP)

1. Benchmarks: measure bus latency vs direct context updates.
2. Integrate service-worker cache for offline playback.
3. Add unit tests with Bun test runner (mock bus, assert hook behaviour).
4. Build a CLI to replay *.tlog files through WebSocket for integration tests. 
# Event Throttle & Debounce Policy

All high-frequency events in the frontend must be rate-limited to prevent
performance degradation. This table defines the canonical intervals.

## Policy Table

| Event                   | Strategy | Interval  | Rationale                                    |
| ----------------------- | -------- | --------- | -------------------------------------------- |
| `onPointerMove` (3D)    | Throttle | 33ms      | Raycast is expensive; cap at ~30fps          |
| `window.resize`         | Debounce | 200ms     | Avoid layout thrashing during drag-resize    |
| Scroll (article panel)  | Throttle | 100ms     | Smooth reading progress updates at ~10fps    |
| Search input            | Debounce | 300ms     | Wait for user to stop typing before querying |
| WebSocket position sync | Throttle | 500ms     | Reduce network overhead for cursor sharing   |
| FPS sampling            | Sample   | 60 frames | Adaptive quality uses averaged measurements  |

## Implementation

Use `useThrottledPointerMove.ts` as the reference pattern for throttled hooks.
The hook wraps `onPointerMove` with a timestamp check to skip intermediate events.

For debounce, prefer `setTimeout` + cleanup in `useEffect` or a shared
`useDebouncedCallback` utility.

## Rules

1. Never attach raw `onPointerMove` to 3D scene objects without throttling.
2. Resize handlers must debounce — multiple rapid fires cause expensive reflows.
3. Search/filter inputs must debounce to avoid flooding the GraphQL API.
4. WebSocket sync uses server-side rate limiting as a secondary safeguard.
5. FPS sampling averages over 60 frames before triggering quality tier changes
   to prevent oscillation between tiers.

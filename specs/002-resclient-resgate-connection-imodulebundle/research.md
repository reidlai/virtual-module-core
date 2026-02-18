# Research: resClient Integration

## Identified Library: resclient (npm)

- **Package**: `resclient`
- **Source**: [github.com/resgateio/resclient](https://github.com/resgateio/resclient)
- **Role**: Official JavaScript client for the RES protocol.
- **Typing Strategy**:
  - The `resclient` package does not appear to have an official `@types/resclient`.
  - Research suggests the library is plain JavaScript.
  - **Decision**: Define a custom `resclient.d.ts` in `sveltekit/src/types/` to provide strict typing for the core methods used (e.g., `get`, `subscribe`, `call`, and event listeners) as required by FR-002.

## Offline Outbox Pattern

- **Concept**: Use Svelte 5 runes to manage a reactive list of operations that fail due to connection loss.
- **Pattern Component**: `ResOutboxState`
  - **State**: `$state<OutboxEntry[]>([])`
  - **Entry Structure**: `{ method: string, params: any, resourceId: string, timestamp: number }`
  - **Execution**:
    - When `resClient` is offline, push to the outbox array.
    - When `resClient` emits a `connect` or `reconnect` event:
      - Siphon the outbox (iterate and execute).
      - Execute calls in order.
      - Clear the outbox state upon success.
- **Rationale**: Decouples module logic from connection state using native Svelte 5 reactivity.

## AppShell Integration Pattern

- **Decision**: The AppShell will initialize a single `ResClient` instance.
- **Injection**: Provide the `resClient` instance through the `Registry.register` context or as a top-level property in `IModuleBundle` if provided by the host. 
- **Wait/Ready State**: Modules should not attempt to use `resClient` until it signals readiness.

## Alternatives Considered

- **Multiple Connections**: Rejected (Efficiency, RES protocol design).
- **Generic MQTT/WebSocket**: Rejected (Architecture specifically requests RES protocol/Resgate integration).
- **Manual Polling Fallback**: Selected as the "Null" behavior per user clarification.

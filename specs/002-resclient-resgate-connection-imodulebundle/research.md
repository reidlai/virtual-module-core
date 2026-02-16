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

- **Concept**: Use an RxJS-based buffer to hold operations that fail due to connection loss.
- **Pattern Component**: `ResOutboxService`
  - **Storage**: `BehaviorSubject<OutboxEntry[]>`
  - **Entry Structure**: `{ method: string, params: any, resourceId: string, timestamp: number }`
  - **Execution**:
    - When `resClient` is offline, push to outbox.
    - When `resClient` emits a `connect` or `reconnect` event:
      - Siphon the outbox.
      - Execute calls in order.
      - Clear outbox upon success.
- **Rationale**: Decouples module logic from connection state. Modules simply "emit" or "call" through a proxy that handles the staging.

## AppShell Integration Pattern

- **Decision**: The AppShell will initialize a single `ResClient` instance.
- **Injection**: Provide the `resClient` instance through the `Registry.register` context or as a top-level property in `IModuleBundle` if provided by the host. 
- **Wait/Ready State**: Modules should not attempt to use `resClient` until it signals readiness.

## Alternatives Considered

- **Multiple Connections**: Rejected (Efficiency, RES protocol design).
- **Generic MQTT/WebSocket**: Rejected (Architecture specifically requests RES protocol/Resgate integration).
- **Manual Polling Fallback**: Selected as the "Null" behavior per user clarification.

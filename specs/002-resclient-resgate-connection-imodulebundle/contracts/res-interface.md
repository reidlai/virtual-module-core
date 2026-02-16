# Contract: ResClient Interface

This document specifies the contract between the AppShell and Virtual Modules for the `resClient` property.

## 1. Provisioning

- **Provider**: AppShell (Host Environment).
- **Consumer**: Virtual Module (via `IModuleBundle`).
- **Mechanism**: The AppShell MUST initialize the `resClient` before module registration or provide a reactive way to update it.

## 2. API Surface

The `resClient` MUST implement the following methods and properties:

### Methods

| Method        | Parameters                                                         | Return Type            | Description                        |
| ------------- | ------------------------------------------------------------------ | ---------------------- | ---------------------------------- |
| `get`         | `resourceId: string`                                               | `Promise<ResResource>` | Fetch current state of a resource. |
| `call`        | `resourceId: string, method: string, params?: any`                 | `Promise<any>`         | Execute a service method.          |
| `subscribe`   | `resourceId: string, callback: (event: string, data: any) => void` | `void`                 | Listen for real-time events.       |
| `unsubscribe` | `resourceId: string, callback: (event: string, data: any) => void` | `void`                 | Stop listening for events.         |

### Properties

| Property | Type                                                              | Description                   |
| -------- | ----------------------------------------------------------------- | ----------------------------- |
| `status` | `'connecting' \| 'connected' \| 'reconnecting' \| 'disconnected'` | The current connection state. |

## 3. Events

The `resClient` MUST emit the following events via `.on(event, callback)`:

- `connect`: Emitted when the connection is established.
- `disconnect`: Emitted when the connection is lost.
- `reconnect`: Emitted when the connection is re-established.
- `error`: Emitted when a connection or protocol error occurs.

## 4. Authentication

- The `resClient` MUST be pre-authenticated.
- Modules SHOULD NOT need to call `auth` or `login` on the `resClient` directly.

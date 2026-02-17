# Data Model: resClient Integration

## Enhanced Entity: IModuleBundle

The `IModuleBundle` interface will be extended to include the optional `resClient` property.

```typescript
export interface IModuleBundle {
  id: string;
  widgets?: IWidget[];
  handlers?: IHandler[];
  services?: Record<string, any>;
  routes?: IRoute[];
  metadata?: Record<string, any>;
  /**
   * Optional RES client connection provided by the AppShell.
   * Enables real-time data synchronization using the RES protocol.
   */
  resClient?: IResClient;
}
```

## New Interface: IResClient (from resclient)

Based on the [RES-client protocol](https://resgate.io/docs/specification/res-client-protocol/) and the `resclient` library, we will define a subset of the client as a TypeScript interface.

```typescript
export interface IResClient {
  /**
   * Fetches a resource from the server.
   */
  get(resourceId: string): Promise<ResResource>;

  /**
   * Calls a method on a resource.
   */
  call(resourceId: string, method: string, params?: any): Promise<any>;

  /**
   * Subscribes to events on a resource.
   */
  subscribe(resourceId: string, callback: (event: string, data: any) => void): void;

  /**
   * Unsubscribes from events.
   */
  unsubscribe(resourceId: string, callback: (event: string, data: any) => void): void;

  /**
   * Connection status.
   */
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

  /**
   * Event listeners (connect, disconnect, reconnect, error).
   */
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
}
```

## Offline Entry: IOutboxEntry

For the "Offline Outbox" pattern (FR-005).

```typescript
export interface IOutboxEntry {
  method: 'call' | 'set';
  resourceId: string;
  params: any;
  timestamp: number;
}
```

## Validation Rules

1. **Strict Typing**: The `resClient` property MUST adhere to the `IResClient` interface (defined based on the `resclient` library).
2. **Optionality**: If `resClient` is `undefined` or `null`, the module MUST fallback to legacy API connections.
3. **Immutability**: The `resClient` instance should not be re-assigned once the bundle is registered.

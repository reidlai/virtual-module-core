# Quickstart: Using resClient in your Module

This guide shows how to leverage the `resClient` property for real-time synchronization in your virtual module.

## 1. Exposing the resClient

In your module's export (e.g., `index.ts`), the `resClient` is typically provided by the host during registry initialization. However, you can declare interest or provide configuration.

```typescript
// my-module/src/index.ts
import type { IModuleBundle } from 'virtual-module-core';

export default function init(): IModuleBundle {
  return {
    id: 'my-realtime-module',
    // ... other fields
    resClient: null, // Placeholder, will be populated by AppShell
  };
}
```

## 2. Consuming Real-Time Data in a Widget

Access the `resClient` from the injected context or module bundle.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  export let bundle; // IModuleBundle injected by Registry

  let data = $state(null);

  onMount(() => {
    if (bundle.resClient) {
      // 1. Get initial snapshot
      bundle.resClient.get('my.resource').then(res => {
        data = res.data;
      });

      // 2. Subscribe to updates
      const handler = (event, update) => {
        if (event === 'change') {
          data = { ...data, ...update.values };
        }
      };

      bundle.resClient.subscribe('my.resource', handler);

      return () => {
        bundle.resClient.unsubscribe('my.resource', handler);
      };
    } else {
      // Fallback to REST API if resClient is null
      fetch('/api/my-resource').then(r => r.json()).then(d => data = d);
    }
  });
</script>

<div>
  {#if data}
    <pre>{JSON.stringify(data, null, 2)}</pre>
  {:else}
    Loading...
  {/if}
</div>
```

## 3. Handling Offline State

Modules should use the `status` property to detect disconnection.

```typescript
if (bundle.resClient && bundle.resClient.status !== 'connected') {
  console.warn('Real-time connection lost. Changes will be staged.');
}
```

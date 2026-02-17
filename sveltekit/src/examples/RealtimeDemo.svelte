<script lang="ts">
  import type { IModuleBundle } from "../types";

  export let bundle: IModuleBundle;

  let status: any = bundle.resClient?.connected ? "connected" : "no-client";
  let data: any = null;
  let error: string | null = null;

  // Real-time synchronization logic
  if (bundle.resClient) {
    const client = bundle.resClient as any;
    client.on("connect", () => {
      status = "connected";
    });

    client.on("disconnect", () => {
      status = "disconnected";
    });

    // Example subscription
    client
      .get("demo.resource")
      .then((res: any) => {
        data = res;
        client.subscribe("demo.resource", (event: string, update: any) => {
          if (event === "change") {
            data = { ...data, ...update };
          }
        });
      })
      .catch((err: any) => {
        error = err.message;
      });
  } else {
    // Fallback logic (T013)
    console.log(
      "No resClient provided. Falling back to standard API connections.",
    );
    status = "fallback (REST/Zodios)";
    // In a real scenario, this would initiate a REST call or polling
  }
</script>

<div class="p-4 border rounded shadow bg-white">
  <h2 class="text-xl font-bold mb-2">Real-time Demo</h2>
  <div class="mb-2">
    <span class="font-semibold">Status:</span>
    <span class={status === "connected" ? "text-green-600" : "text-amber-600"}>
      {status}
    </span>
  </div>

  {#if error}
    <div class="text-red-500 mb-2">Error: {error}</div>
  {/if}

  {#if data}
    <div class="bg-gray-100 p-2 rounded">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  {:else if status !== "fallback (REST/Zodios)"}
    <div class="text-gray-500 italic">No data received yet...</div>
  {/if}

  {#if status === "fallback (REST/Zodios)"}
    <div
      class="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm"
    >
      <p>
        <strong>Note:</strong> Standard API connection would be used here as a fallback.
      </p>
    </div>
  {/if}
</div>

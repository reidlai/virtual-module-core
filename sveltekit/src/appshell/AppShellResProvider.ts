import type ResClient from "resclient";

/**
 * Placeholder for AppShell-managed ResClient provisioning.
 * In a real AppShell, this would initialize and authenticate the client.
 */
export class AppShellResProvider {
    private client: ResClient | null = null;

    setClient(client: ResClient): void {
        this.client = client;
    }

    getClient(): ResClient | null {
        return this.client;
    }

    isReady(): boolean {
        return this.client !== null && this.client.connected;
    }
}

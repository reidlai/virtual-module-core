import { describe, it, expect } from "vitest";
import { Registry } from "./Registry";
import type { IFrameworkAdapter, IModuleBundle } from "../types";

// Mock Adapter returning Bundle
class MockAdapter implements IFrameworkAdapter {
  constructor(private bundle: IModuleBundle) {}

  detect(_module: any): boolean {
    return true;
  }

  async parse(_module: any): Promise<IModuleBundle> {
    return this.bundle;
  }
}

describe("Registry", () => {
  it("should register routes from module via adapter", async () => {
    const registry = new Registry();

    const route = { path: "/test", component: {}, type: "page" } as any;
    const bundle = { id: "test-mod", routes: [route] };

    await registry.registerModule({}, new MockAdapter(bundle));

    const match = registry.getRouter().match("/test");
    expect(match?.route).toBe(route);
  });

  it("should throw error on duplicate routes", async () => {
    const registry = new Registry();
    const route = { path: "/duplicate", component: {}, type: "page" } as any;
    const bundle = { id: "test-mod-dup", routes: [route] };

    // First registration
    registry.register(bundle);

    // Second registration fails
    expect(() => registry.register(bundle)).toThrow(
      "Duplicate route detected: /duplicate",
    );
  });

  it("should register widgets and handlers", () => {
    const registry = new Registry();
    const bundle = {
      id: "test-widgets",
      routes: [],
      widgets: [{ id: "widget-a", title: "Widget A", component: {} }],
      handlers: [
        { id: "handler-a", title: "Handler A", execute: async () => {} },
      ],
    };

    registry.register(bundle);

    expect(registry.getWidgets().has("widget-a")).toBe(true);
    expect(registry.getHandlers()).toHaveLength(1);
  });
});

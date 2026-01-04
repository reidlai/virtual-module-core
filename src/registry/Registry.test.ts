import { describe, it, expect, beforeEach, vi } from "vitest";
import { Registry } from "./Registry";
import type { IModuleBundle, IWidget } from "../types/index.js";

describe("Registry", () => {
  let registry: Registry;

  beforeEach(() => {
    registry = Registry.getInstance();
    registry.clear();
    vi.unstubAllGlobals();
  });

  it("should retrieve a widget by ID", () => {
    const widget: IWidget = {
      id: "test-widget",
      title: "Test Widget",
      component: {} as any,
    };

    const bundle: IModuleBundle = {
      id: "test-module",
      widgets: [widget],
    };

    registry.register(bundle);

    const retrieved = registry.getWidget("test-widget");
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("test-widget");
    expect(retrieved?.title).toBe("Test Widget");
  });

  it("should return undefined for non-existent widget", () => {
    const retrieved = registry.getWidget("non-existent");
    expect(retrieved).toBeUndefined();
  });

  it("should warn and ignore duplicate widget IDs", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

    const widget1: IWidget = {
      id: "duplicate-widget",
      title: "Original",
      component: {} as any,
    };

    const widget2: IWidget = {
      id: "duplicate-widget",
      title: "Duplicate",
      component: {} as any,
    };

    registry.register({ id: "mod1", widgets: [widget1] });
    registry.register({ id: "mod2", widgets: [widget2] });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Duplicate widget ID found: duplicate-widget"),
    );

    const retrieved = registry.getWidget("duplicate-widget");
    expect(retrieved?.title).toBe("Original");
  });

  it("should auto-populate getWidgets() via the map", () => {
    const widget: IWidget = {
      id: "map-widget",
      title: "Map Widget",
      component: {} as any,
    };

    registry.register({ id: "mod", widgets: [widget] });

    const allWidgets = registry.getWidgets();
    expect(allWidgets).toHaveLength(1);
    expect(allWidgets[0].id).toBe("map-widget");
  });

  it("should retrieve a module by ID", () => {
    const bundle: IModuleBundle = { id: "test-module" };
    registry.register(bundle);

    const mod = registry.getModule("test-module");
    expect(mod).toBe(bundle);
  });

  it("should return undefined for non-existent module", () => {
    expect(registry.getModule("unknown")).toBeUndefined();
  });

  it("should aggregate handlers from all modules", () => {
    const handler1 = { id: "h1", title: "H1", execute: () => { } };
    const handler2 = { id: "h2", title: "H2", execute: () => { } };

    registry.register({ id: "m1", handlers: [handler1] });
    registry.register({ id: "m2", handlers: [handler2] });

    const handlers = registry.getHandlers();
    expect(handlers).toHaveLength(2);
    expect(handlers).toContain(handler1);
    expect(handlers).toContain(handler2);
  });

  it("should register and retrieve services", () => {
    const service = { foo: "bar" };
    registry.register({ id: "m1", services: { mySvc: service } });

    expect(registry.getService("mySvc")).toBe(service);
    expect(registry.getService("unknown")).toBeUndefined();
  });

  it("should look up components by route path", () => {
    const comp = { name: "MyComponent" };
    const route = { path: "/my-path", component: comp };

    registry.register({ id: "m1", routes: [route] });

    // Exact match
    expect(registry.getRoute("/my-path")).toBe(comp);
    // Sub-path match
    expect(registry.getRoute("/my-path/sub")).toBe(comp);
    // No match
    expect(registry.getRoute("/other")).toBeUndefined();
  });

  it("should provide consistent state stores per ID", () => {
    const store1 = registry.getStateStore("storeA");
    const store2 = registry.getStateStore("storeA");
    const store3 = registry.getStateStore("storeB");

    expect(store1).toBe(store2);
    expect(store3).not.toBe(store1);

    // Check mock structure
    expect(store1.getChannel).toBeDefined();
    expect(store1.updateState).toBeDefined();
  });
});

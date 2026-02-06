import { describe, it, expect, beforeEach } from "vitest";
import { DIContainer } from "./Container";
import type { IAppConfig } from "../types";

describe("DIContainer", () => {
  let container: DIContainer;
  const mockConfig: IAppConfig = {
    appName: "TestApp",
    version: "1.0.0",
  };

  beforeEach(() => {
    container = new DIContainer(mockConfig);
  });

  it("should initialize with config", () => {
    expect(container.config).toEqual(mockConfig);
  });

  it("should register and resolve a service", () => {
    const service = { foo: "bar" };
    container.register("my-service", service);

    const resolved = container.getService("my-service");
    expect(resolved).toBe(service);
  });

  it("should throw error when resolving non-existent service", () => {
    expect(() => {
      container.getService("non-existent");
    }).toThrowError("Service 'non-existent' not found");
  });

  it("should be able to resolve services across multiple registrations", () => {
    container.register("s1", 1);
    container.register("s2", "two");

    expect(container.getService("s1")).toBe(1);
    expect(container.getService("s2")).toBe("two");
  });
});

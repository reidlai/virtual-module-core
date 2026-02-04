import { describe, it, expect } from "vitest";
import { SvelteKitAdapter } from "./SvelteKitAdapter";

describe("SvelteKitAdapter", () => {
  const adapter = new SvelteKitAdapter();

  describe("detect", () => {
    it("should detect valid sveltekit structure", () => {
      const module = { hasSvelteKitDir: true };
      expect(adapter.detect(module)).toBe(true);
    });

    it("should reject non-kit structure", () => {
      const module = { hasSvelteKitDir: false };
      expect(adapter.detect(module)).toBe(false);
    });

    it("should throw on legacy svelte/ directory", () => {
      const module = { hasSvelteDir: true };
      expect(() => adapter.detect(module)).toThrow(
        /Legacy "svelte\/" directory detected/,
      );
    });
  });

  describe("path normalization", () => {
    it("should normalize standard routes", async () => {
      const files = ["sveltekit/routes/blog/post/+page.svelte"];
      const bundle = await adapter.parse({ files, id: "test" });

      expect(bundle.routes).toHaveLength(1);
      expect(bundle.routes![0].path).toBe("/blog/post");
    });
  });

  describe("widgets and handlers", () => {
    it("should parse widgets", async () => {
      const files = ["sveltekit/widgets/MyWidget.svelte"];
      const bundle = await adapter.parse({ files, id: "test" });

      expect(bundle.widgets).toHaveLength(1);
      expect(bundle.widgets![0].id).toBe("MyWidget.svelte");
      expect(bundle.widgets![0].component).toBe(
        "sveltekit/widgets/MyWidget.svelte",
      );
    });

    it("should parse handlers", async () => {
      const files = ["sveltekit/handlers/MyHandler.ts"];
      const bundle = await adapter.parse({ files, id: "test" });

      expect(bundle.handlers).toHaveLength(1);
      expect(bundle.handlers![0].id).toBe("MyHandler.ts");
    });
  });
});

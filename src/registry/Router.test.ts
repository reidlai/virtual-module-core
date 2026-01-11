import { describe, it, expect, beforeEach } from "vitest";
import { Router } from "./Router";
import type { IParamsRoute } from "../types";

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  describe("register & sort", () => {
    it("should match static routes", () => {
      const staticRoute: IParamsRoute = {
        path: "/blog",
        component: {},
        type: "page",
      };
      router.register([staticRoute]);

      expect(router.match("/blog")?.route).toBe(staticRoute);
      expect(router.match("/blog/other")).toBeNull();
    });

    it("should sort specificity: static > dynamic > optional > wildcard", () => {
      const routes: IParamsRoute[] = [
        { path: "/*", component: "wildcard", type: "page" },
        { path: "/blog/:slug", component: "dynamic", type: "page" },
        { path: "/blog/featured", component: "static", type: "page" },
        { path: "/blog/:slug?", component: "optional", type: "page" },
      ];

      router.register(routes);

      // Static wins
      expect(router.match("/blog/featured")?.route.component).toBe("static");

      // Dynamic wins over optional/wildcard
      expect(router.match("/blog/hello")?.route.component).toBe("dynamic");

      // Optional wins over wildcard
      expect(router.match("/blog")?.route.component).toBe("optional");

      // Wildcard catches rest
      expect(router.match("/other/stuff")?.route.component).toBe("wildcard");
    });
  });

  describe("match parameters", () => {
    it("should extract dynamic parameters", () => {
      router.register([
        { path: "/users/:id/posts/:postId", component: {}, type: "page" },
      ]);

      const match = router.match("/users/123/posts/456");
      expect(match?.params).toEqual({ id: "123", postId: "456" });
    });

    it("should handle optional parameters", () => {
      router.register([{ path: "/lang/:code?", component: {}, type: "page" }]);

      expect(router.match("/lang/en")?.params).toEqual({ code: "en" });
      expect(router.match("/lang")?.params).toEqual({}); // Empty if missing
    });
  });

  describe("layout resolution", () => {
    it("should resolve layout hierarchy", () => {
      const rootLayout = {
        path: "/",
        component: "root",
        type: "layout",
      } as IParamsRoute;
      const blogLayout = {
        path: "/blog",
        component: "blog",
        type: "layout",
      } as IParamsRoute;
      const postPage = {
        path: "/blog/:id",
        component: "page",
        type: "page",
      } as IParamsRoute;

      router.register([rootLayout, blogLayout, postPage]);

      const match = router.match("/blog/123");
      expect(match?.layouts).toHaveLength(2);
      expect(match?.layouts[0]).toBe(rootLayout);
      expect(match?.layouts[1]).toBe(blogLayout);
    });
  });
});

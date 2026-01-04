import { describe, it, expect, beforeEach, vi } from "vitest";
import { Router } from "./Router";
import { Registry } from "./Registry";
import type { IModuleBundle, IParamsRoute } from "../types";

describe("Router", () => {
    let router: Router;
    let registry: Registry;

    beforeEach(() => {
        registry = Registry.getInstance();
        registry.clear();
        router = new Router(registry);
    });

    it("should return null if no routes match", () => {
        const match = router.match("/unknown");
        expect(match).toBeNull();
    });

    it("should match an exact route", () => {
        const route: IParamsRoute = {
            path: "/dashboard",
            component: "DashboardComponent",
        };
        const bundle: IModuleBundle = {
            id: "mod1",
            routes: [route],
        };
        registry.register(bundle);

        const match = router.match("/dashboard");
        expect(match).not.toBeNull();
        expect(match?.route).toBe(route);
        expect(match?.params).toEqual({});
    });

    it("should match a route with parameters", () => {
        const route: IParamsRoute = {
            path: "/users/:id",
            component: "UserComponent",
        };
        const bundle: IModuleBundle = {
            id: "mod2",
            routes: [route],
        };
        registry.register(bundle);

        const match = router.match("/users/123");
        expect(match).not.toBeNull();
        expect(match?.route).toBe(route);
        expect(match?.params).toEqual({ id: "123" });
    });

    it("should match multiple parameters", () => {
        const route: IParamsRoute = {
            path: "/posts/:postId/comments/:commentId",
            component: "CommentComponent",
        };
        const bundle: IModuleBundle = {
            id: "mod3",
            routes: [route],
        };
        registry.register(bundle);

        const match = router.match("/posts/abc/comments/def");
        expect(match).not.toBeNull();
        expect(match?.params).toEqual({ postId: "abc", commentId: "def" });
    });

    it("should fail gracefully on partial match mismatch", () => {
        const route: IParamsRoute = {
            path: "/users/:id/details",
            component: "DetailComponent",
        };
        registry.register({ id: "mod4", routes: [route] });

        // Length matches, but static part mismatch
        const match = router.match("/users/123/settings");
        expect(match).toBeNull();
    });

    it("should fail gracefully on length mismatch", () => {
        const route: IParamsRoute = {
            path: "/a/b",
            component: "Comp",
        };
        registry.register({ id: "mod5", routes: [route] });

        expect(router.match("/a")).toBeNull();
        expect(router.match("/a/b/c")).toBeNull();
    });
});

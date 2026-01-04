import type { IModuleBundle, IWidget, IHandler } from "../types/index.js";
export declare class Registry {
    private static instance;
    private modules;
    private widgetMap;
    private handlers;
    private servicesMap;
    private stateStores;
    private constructor();
    static getInstance(): Registry;
    register(bundle: IModuleBundle): void;
    getModules(): IModuleBundle[];
    getModule(id: string): IModuleBundle | undefined;
    getWidget(id: string): IWidget | undefined;
    getWidgets(): IWidget[];
    getHandlers(): IHandler[];
    getService<T = any>(id: string): T;
    clear(): void;
    getRoute(path: string): any | undefined;
    getStateStore(id: string): any;
}
//# sourceMappingURL=Registry.d.ts.map
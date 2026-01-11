import type { IFrameworkAdapter } from '../types';
import { Router } from './Router';
export declare class Registry {
    private router;
    private registeredPaths;
    constructor();
    /**
     * Registers a module using the provided adapter.
     * @param module The module object/metadata to register
     * @param adapter The adapter specific to the module's framework
        * @throws Error if any route path is already registered (Conflict Detection)
     */
    registerModule(module: any, adapter: IFrameworkAdapter): Promise<void>;
    /**
     * Expose router for matching
     */
    getRouter(): Router;
}
//# sourceMappingURL=Registry.d.ts.map
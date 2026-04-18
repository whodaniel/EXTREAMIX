1. **Update Vite Configuration**: Ensure `base: './'` is in `vite.config.ts` (already done). Make sure it outputs to `dist` (default). Check if build creates Chrome extension components. Move static files (`manifest.json`, `background.js`) to `public` so Vite copies them to `dist`. (Already moved).
2. **Implement React Router**: Create a hash-based router using `react-router-dom` (important for Chrome extensions and static hosting).
    * Use `<HashRouter>` or `createHashRouter`.
    * Define routes:
        * `/` (or `/ext` if running as extension): The current Extension UI (App.tsx refactored).
        * `/saas`: The SaaS Landing Page.
        * `/saas/dashboard`: User Dashboard.
        * `/saas/remote-node`: Remote Node view.
3. **Refactor `App.tsx` and `main.tsx`**:
    * Move the current contents of `App.tsx` to a new component, e.g., `src/pages/Extension.tsx`.
    * Update `App.tsx` to include the routing setup.
    * Add detection logic in `main.tsx` or `App.tsx` to automatically route to `/` if it's running as a Chrome extension (`chrome.runtime.id` is defined), and default to `/saas` otherwise, or let users navigate.
4. **Create SaaS Pages**:
    * `src/pages/SaaS/Landing.tsx`
    * `src/pages/SaaS/Dashboard.tsx`
    * `src/pages/SaaS/RemoteNode.tsx`
    * Add simple UI for these to satisfy the requirement.
5. **Verify Build**: Run `npm run build` to ensure the `dist` folder is created with all assets and `manifest.json`.
6. **Pre-commit checks**: Run `npm run lint` and verify build.

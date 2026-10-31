# SCIENCE EXPLORER — Final stability handoff

## Changes in this handoff
- AI Tutor server requests retain the 30-second total timeout and Gemini fallback handling from the supplied project.
- React and React DOM are explicitly deduplicated together with TanStack React Router and React Query in Vite dependency resolution.
- The service worker cache was versioned to v2 so the next deployment removes stale v1 caches.
- Online JavaScript/CSS/font assets now prefer the current network response and use cached files only when offline. This prevents an old cached React chunk from being served alongside a newer app shell.
- The authenticated route now safely falls back to an already persisted Supabase session if `getUser()` temporarily fails, rather than turning a transient verification/network failure into a generic route crash.

## Important limits
- Private `.env` values and API keys are intentionally not included.
- The app still requires its existing Supabase project configuration and server-side AI keys in the hosting environment.
- A live sign-in and AI provider test requires access to the user's Supabase project and API credentials. Those are not available in this archive.
- A full dependency install and production build could not be completed in this environment, so this handoff is source-checked but not certified as a successful live deployment.

## Deployment note
Upload/replace the project source in the existing hosting workspace and publish that updated project. The service-worker cache version change takes effect when the updated site is published and the browser loads the new service worker.

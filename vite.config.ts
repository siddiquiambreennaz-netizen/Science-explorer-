// Keep React, React DOM, and their TanStack React adapters on one module instance.
// This avoids invalid-hook-call crashes when the app is served from nested routes.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    resolve: {
      dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime", "react-dom/client", "@tanstack/react-router", "@tanstack/react-query"],
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});

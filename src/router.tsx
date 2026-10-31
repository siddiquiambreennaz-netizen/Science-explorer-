import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ({ error, reset }) => (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div className="space-y-3">
          <h1 className="font-display text-2xl font-extrabold text-foreground">Something went wrong on this page</h1>
          <p className="text-muted-foreground">{error instanceof Error ? "Please try again in a moment." : ""}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">Try again</button>
        </div>
      </main>
    ),
  });

  return router;
};

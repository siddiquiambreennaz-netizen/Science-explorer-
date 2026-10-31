const SHELL_CACHE = "science-explorer-shell-v1";
const ASSET_CACHE = "science-explorer-assets-v1";
const SHELL_URLS = ["/", "/offline.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("science-explorer-") && ![SHELL_CACHE, ASSET_CACHE].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cacheAppShell(extraPaths = []) {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(SHELL_URLS).catch(() => undefined);
  const appPaths = [...new Set(["/app", "/app/downloads", "/app/games", "/app/games/physics", "/app/games/chemistry", ...extraPaths])]
    .filter((path) => typeof path === "string" && path.startsWith("/app/") && !path.includes(".."));
  await Promise.all(appPaths.map(async (path) => {
    try {
      const request = new Request(new URL(path, self.location.origin), { credentials: "same-origin" });
      const response = await fetch(request);
      if (response.ok && (response.headers.get("content-type") || "").includes("text/html")) await cache.put(request, response.clone());
    } catch { /* some authenticated pages may not be available until the user signs in */ }
  }));
  try {
    const response = await fetch("/", { cache: "reload" });
    if (!response.ok) return;
    const html = await response.clone().text();
    await cache.put("/", response.clone());
    const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|woff2?|svg|png|ico))(?:\?[^"']*)?["']/gi)]
      .map((match) => match[1])
      .filter((value) => typeof value === "string" && value.startsWith("/"));
    await Promise.all(assetUrls.map((asset) => cache.add(asset).catch(() => undefined)));
  } catch {
    // A previously cached shell remains available when this refresh cannot reach the network.
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_APP_SHELL") {
    const paths = Array.isArray(event.data.paths) ? event.data.paths : [];
    event.waitUntil(cacheAppShell(paths));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/\/rest\/v1\/|\/auth\/v1\/|\/functions\/v1\//.test(url.pathname)) return;

  if (["script", "style", "image", "font", "worker"].includes(request.destination) || /\.(js|css|woff2?|png|jpe?g|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(request);
      const network = fetch(request).then((response) => {
        if (response.ok && response.type === "basic") cache.put(request, response.clone()).catch(() => undefined);
        return response;
      }).catch(() => null);
      return cached || await network || Response.error();
    })());
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        // Authenticated route HTML is a generic client-rendered shell (the protected route is SSR-disabled).
        // Cache only the document shell, never Supabase/API responses or user records.
        if (response.ok && url.pathname.startsWith("/app/") && (response.headers.get("content-type") || "").includes("text/html")) {
          const shell = await caches.open(SHELL_CACHE);
          shell.put(request, response.clone()).catch(() => undefined);
        }
        return response;
      } catch {
        const shell = await caches.open(SHELL_CACHE);
        return await shell.match(request) || await shell.match("/") || await shell.match("/offline.html") || Response.error();
      }
    })());
  }
});

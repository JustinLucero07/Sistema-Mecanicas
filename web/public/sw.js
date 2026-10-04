// Service worker mínimo: permite instalar la app y abrirla sin conexión.
// Solo toca archivos de esta misma web. Las llamadas a la API y las fotos
// (otro dominio) pasan directo a la red: nunca se guardan datos del taller
// en el caché del navegador.
const CACHE = "mecanicaos-v3";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/manifest.json"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Recursos con hash en el nombre: nunca cambian, se sirven desde caché.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // Páginas: siempre de la red; sin conexión, una página que lo explica.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});

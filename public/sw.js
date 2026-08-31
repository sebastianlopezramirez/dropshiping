/*
|--------------------------------------------------------------------------
| Service Worker — GadGet Store Med
|--------------------------------------------------------------------------
| Estrategia:
|   - Estáticos (JS, CSS, imágenes, fuentes): Cache First
|   - Páginas HTML / Inertia:                 Network First
|   - Offline fallback:                       muestra página offline
*/

const CACHE_NOMBRE    = 'gadget-store-v1';
const CACHE_ESTATICOS = 'gadget-store-static-v1';

const RECURSOS_PRECACHE = [
    '/tienda',
    '/logo.png',
    '/logo.webp',
    '/manifest.json',
    '/offline.html',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_ESTATICOS).then((cache) => {
            return cache.addAll(RECURSOS_PRECACHE).catch(() => {});
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((nombres) => {
            return Promise.all(
                nombres
                    .filter((n) => n !== CACHE_NOMBRE && n !== CACHE_ESTATICOS)
                    .map((n) => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (
        request.method !== 'GET' ||
        url.protocol === 'chrome-extension:' ||
        url.hostname !== self.location.hostname
    ) {
        return;
    }

    if (esRecursoEstatico(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const respuesta = await fetch(request);
        if (respuesta.ok) {
            const cache = await caches.open(CACHE_ESTATICOS);
            cache.put(request, respuesta.clone());
        }
        return respuesta;
    } catch {
        return new Response('Sin conexión', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const respuesta = await fetch(request);
        if (respuesta.ok) {
            const cache = await caches.open(CACHE_NOMBRE);
            cache.put(request, respuesta.clone());
        }
        return respuesta;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.headers.get('Accept')?.includes('text/html')) {
            const offline = await caches.match('/offline.html');
            if (offline) return offline;
        }
        return new Response('Sin conexión', { status: 503 });
    }
}

function esRecursoEstatico(pathname) {
    return /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|otf|gif)$/i.test(pathname);
}

/* Service Worker: Cache-first for images (Cloudinary + same-origin)
   - Caches opaque cross-origin image responses safely
   - Falls back to network if not cached
   - Versioned cache with simple old-cache cleanup on activate
*/

const SW_VERSION = 'v1';
const IMAGE_CACHE = `image-cache-${SW_VERSION}`;
const CACHE_ALLOWLIST = new Set([IMAGE_CACHE]);

self.addEventListener('install', (event) => {
  // Activate new SW immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Remove old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => !CACHE_ALLOWLIST.has(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

function isImageRequest(request) {
  if (request.method !== 'GET') return false;
  if (request.destination === 'image') return true;
  try {
    const url = new URL(request.url);
    if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)) return true;
    if (url.hostname.includes('res.cloudinary.com')) return true;
  } catch (_) {
    // ignore
  }
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isImageRequest(request)) return; // let the browser handle non-image

  event.respondWith(
    (async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request, {
        ignoreVary: true,
        ignoreSearch: false,
      });
      if (cached) return cached;

      try {
        const response = await fetch(request);
        // Cache successful or opaque responses (for cross-origin images)
        if (response && (response.ok || response.type === 'opaque')) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        // If offline and not cached, just fail (no offline placeholder provided)
        return new Response('', { status: 504, statusText: 'Gateway Timeout' });
      }
    })()
  );
});



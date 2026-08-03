const CACHE = 'spsystem-v3'
const STATIC = ['/', '/manifest.json', '/icon.svg']

self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { status: 502 })))
    return
  }
  // Network-first: siempre intenta el servidor; usa cache solo si no hay red (offline)
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.status === 200 && e.request.method === 'GET' && !e.request.url.includes('/_next/static/')) {
          const copy = r.clone()
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {})
        }
        return r
      })
      .catch(() => caches.match(e.request).then(r => r || new Response('Offline', { status: 503 })))
  )
})

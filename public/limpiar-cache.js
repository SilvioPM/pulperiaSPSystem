(function () {
  if ('caches' in window) {
    function limpiarCache() {
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .catch(() => {})
    }
    limpiarCache()
    window.addEventListener('load', limpiarCache)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') limpiarCache()
    })
    setInterval(limpiarCache, 3 * 60 * 60 * 1000)
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.update().catch(() => {}))
    }).catch(() => {})
  }

  var recargo = false
  function esErrorChunk(msg) {
    return /Loading chunk \d+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg || '')
  }

  window.addEventListener('error', function (e) {
    if (!recargo && esErrorChunk(e.message)) {
      recargo = true
      location.reload()
    }
  })

  window.addEventListener('unhandledrejection', function (e) {
    if (!recargo && e && e.reason && esErrorChunk(e.reason.message || e.reason)) {
      recargo = true
      location.reload()
    }
  })
})()

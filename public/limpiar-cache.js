(function () {
  if (!('caches' in window)) return

  function limpiarCache() {
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => console.log('[cache] almacenamiento de cache limpiado'))
      .catch(() => {})
  }

  limpiarCache()
  window.addEventListener('load', limpiarCache)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') limpiarCache()
  })
  setInterval(limpiarCache, 3 * 60 * 60 * 1000)
})()

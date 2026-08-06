/** Persistent storage helpers — ensure IndexedDB survives storage pressure and browser restarts */

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) {
      console.warn('[Storage] navigator.storage.persist not available (non-secure context or old browser)')
      return false
    }
    if (await navigator.storage.persisted()) {
      console.log('[Storage] Persistent storage already granted ✓')
      return true
    }
    const granted = await navigator.storage.persist()
    console.log(`[Storage] Persistent storage ${granted ? 'granted ✓' : 'denied — data may be evicted under pressure'}`)
    if (!granted) {
      // Try to show a subtle hint in console for debugging
      console.warn('[Storage] Tip: User interaction may be required for persistence in some browsers. Data is still saved in IndexedDB but may be cleared under storage pressure.')
    }
    return granted
  } catch (e) {
    console.warn('[Storage] persist() failed', e)
    return false
  }
}

export async function storageStatus(): Promise<{
  usage: number
  quota: number
  persisted: boolean
  usagePercent: number
} | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const est = await navigator.storage.estimate()
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false
    const usage = est.usage ?? 0
    const quota = est.quota ?? 0
    const usagePercent = quota ? Math.round((usage / quota) * 100) : 0
    return { usage, quota, persisted, usagePercent }
  } catch {
    return null
  }
}

// Check if IndexedDB is available and working
export async function checkIndexedDBHealth(): Promise<{ available: boolean; error?: string }> {
  try {
    if (!('indexedDB' in window)) {
      return { available: false, error: 'IndexedDB not available' }
    }
    // Try to open a test DB
    const test = window.indexedDB.open('health-check-' + Date.now(), 1)
    await new Promise<void>((resolve, reject) => {
      test.onsuccess = () => {
        test.result.close()
        window.indexedDB.deleteDatabase('health-check-' + Date.now())
        resolve()
      }
      test.onerror = () => reject(test.error)
      test.onblocked = () => reject(new Error('blocked'))
    })
    return { available: true }
  } catch (e) {
    return { available: false, error: (e as Error).message }
  }
}

// Estimate remaining storage and warn if low
export async function getStorageWarning(): Promise<string | null> {
  const status = await storageStatus()
  if (!status) return null
  if (status.usagePercent > 90) return `স্টোরেজ প্রায় পূর্ণ (${status.usagePercent}%) — ব্যাকআপ নিন`
  if (status.usagePercent > 80) return `স্টোরেজ ${status.usagePercent}% ব্যবহৃত`
  if (!status.persisted) return 'স্থায়ী স্টোরেজ অনুমোদিত নয় — ব্রাউজার চাপের সময় ডেটা মুছতে পারে'
  return null
}

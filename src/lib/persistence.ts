/** Best-effort: ask the browser NOT to evict our IndexedDB under storage pressure. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function storageStatus(): Promise<{
  usage: number
  quota: number
  persisted: boolean
} | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const est = await navigator.storage.estimate()
    const persisted = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : false
    return { usage: est.usage ?? 0, quota: est.quota ?? 0, persisted }
  } catch {
    return null
  }
}

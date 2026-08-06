import 'fake-indexeddb/auto'
import { vi } from 'vitest'

// Mock navigator.storage for persistence tests
Object.defineProperty(globalThis, 'navigator', {
  value: {
    storage: {
      persist: vi.fn().mockResolvedValue(true),
      persisted: vi.fn().mockResolvedValue(true),
      estimate: vi.fn().mockResolvedValue({ usage: 0, quota: 1000000 }),
    },
  },
  writable: true,
  configurable: true,
})

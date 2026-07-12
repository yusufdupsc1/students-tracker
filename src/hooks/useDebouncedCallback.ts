import { useRef, useEffect, useCallback } from 'react'

/** Returns a debounced version of `cb`. The latest call within `delay` ms wins. */
export function useDebouncedCallback<A extends unknown[]>(
  cb: (...args: A) => void,
  delay = 500
) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cbRef = useRef(cb)
  useEffect(() => {
    cbRef.current = cb
  }, [cb])
  useEffect(() => () => clearTimeout(timer.current), [])
  return useCallback(
    (...args: A) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => cbRef.current(...args), delay)
    },
    [delay]
  )
}

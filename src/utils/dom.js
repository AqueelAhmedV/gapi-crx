

import { flushSync } from "react-dom"

export function tryViewTransition(func, ...params) {
    if (document.startViewTransition) {
      document.startViewTransition(() => flushSync(() => {
        func(...params)
      }))
    } else {
      func(...params)
    }
  }

---
"nano-safe-storage": patch
---

`createStorage()` methods work when destructured. `clear()` with a prefix removes only that prefix, in the memory fallback too. README says `clear()` without a prefix clears the whole store.

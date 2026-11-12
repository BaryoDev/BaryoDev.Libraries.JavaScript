---
"deep-merge-lite": patch
---

A source with an own `constructor` key is no longer dropped, nested `constructor` objects are cloned instead of shared, and `__proto__` is skipped at every level.

---
"resilient-fetcher": patch
---

Stop retrying non-ok responses that retryOn rejects (4xx by default), and honor a caller-supplied AbortSignal.

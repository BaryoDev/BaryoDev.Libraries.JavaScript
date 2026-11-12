---
"resilient-fetcher": minor
---

Fixes: errors thrown by `onResponse` are no longer retried, a `Request` input is passed to fetch intact, a caller abort during backoff rejects at once, `timeout: Infinity` or `0` means no timeout, and the body of a non-ok response is cancelled before a retry. Minor because `HttpStatusError` is now exported and has `status` and `response`, and `timeout: 0` changes from an immediate timeout to no timeout.

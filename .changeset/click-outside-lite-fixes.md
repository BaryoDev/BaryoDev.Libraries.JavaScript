---
"click-outside-lite": patch
---

Clicks inside an element in a shadow root are no longer reported as outside (uses `composedPath()`), the `once` cleanup runs even if the callback throws, and an invalid `ignore` selector throws once at setup instead of on every event.

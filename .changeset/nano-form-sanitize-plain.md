---
"nano-form-sanitize": patch
---

With `deep: true`, only plain objects are recursed into. File, Blob, Map, Set, URL and class instances are returned as they are instead of becoming `{}`.

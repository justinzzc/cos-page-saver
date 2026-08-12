# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

<!--
Document your project's quality standards here.

Questions to answer:
- What patterns are forbidden?
- What linting rules do you enforce?
- What are your testing requirements?
- What code review standards apply?
-->

(To be filled by the team)

## Chrome Extension Contracts

This project uses a dependency-free Manifest V3 extension with native ES modules. Keep shared settings and cross-context payloads in explicit helper modules.

### Cross-context rules

- `chrome.storage.local` is the source of truth for COS settings; service-worker globals must not hold long-lived credentials.
- Functions passed to `chrome.scripting.executeScript` must be self-contained because they cannot close over service-worker module imports.
- Popup messages use `{ type: "SAVE_PAGE", tabId }` and receive `{ ok: true, result }` or `{ ok: false, error }`.

### COS upload rules

- Sign the canonical `host` and `content-type` values according to COS, but do not explicitly set the `Host` header in `fetch`; browsers forbid scripts from setting it.
- Surface configuration, injection, extraction, CORS, and HTTP errors in the Popup instead of relying on a developer console.

### Required checks

- Run `node --check` for every JavaScript module.
- Parse `manifest.json` as JSON.
- Run `node smoke-test.mjs` for object-key generation.

---

## Forbidden Patterns

<!-- Patterns that should never be used and why -->

(To be filled by the team)

---

## Required Patterns

<!-- Patterns that must always be used -->

(To be filled by the team)

---

## Testing Requirements

<!-- What level of testing is expected -->

(To be filled by the team)

---

## Code Review Checklist

<!-- What reviewers should check -->

(To be filled by the team)

# Privacy and security

## 1. Privacy promise

Sky River Machine is local-only:

- No account is required.
- No browsing context is sent to a server.
- No remote model or analytics service is required.
- No telemetry is collected by default.
- No runtime-fetched JavaScript or model code is allowed.

The extension should be usable offline after installation.

## 2. Data inventory

Potentially stored locally:

- URLs, titles, domains, favicons, workspace names, lifecycle state, timestamps, protections, user corrections, summaries, search terms, and model metadata.

Not collected by default:

- Cookies, passwords, form values, page scripts, browsing history unrelated to managed tabs, keystrokes, full page bodies, or content from private windows.

Page text and summaries are opt-in, bounded, visibly configurable, and deletable. The UI must say exactly what is read, what is stored, and whether it is retained.

## 3. Permissions

Start with the smallest manifest permission set. Prefer:

- `tabs` for tab metadata when required.
- `storage` for small extension settings.
- `alarms` for scheduled reconciliation.
- `activeTab` for user-invoked page context rather than broad host permissions.
- Optional host permissions only when the user enables continuous page analysis.

Do not request history, cookies, web requests, downloads, or unlimited storage unless a tested feature needs them and the permission is explained in plain language.

Permission changes must not silently enable page reading or automation.

## 4. Threat model

Protect against:

- A malicious or compromised webpage attempting to message the extension.
- A content script leaking page data into an untrusted page context.
- An extension update introducing remote code.
- Model prompt injection inside page text.
- A stale tab ID causing the wrong tab to be closed.
- Crash or partial failure losing restoration information.
- A user exporting sensitive data unintentionally.

Controls:

- Treat all page content as untrusted data, never as instructions.
- Validate message origin, schema, sender, and target record.
- Keep browser APIs behind the adapter and policy boundary.
- Require a checkpoint and current-tab revalidation before close/archive.
- Bundle all executable code and model assets.
- Sanitize logs and never log page content by default.
- Show export/delete warnings.

## 5. Encryption boundary

Extension storage and IndexedDB are local but are not automatically encrypted. The product must not claim encryption at rest merely because no network is used.

The initial privacy posture is minimization, local processing, narrow permissions, and explicit retention. A passphrase-protected encrypted archive may be added later using Web Crypto, but it is a separate design because key loss must not become silent data loss.

## 6. Private windows

Default behavior is no private-window content capture and no cross-contamination between normal and private browsing contexts. The user must explicitly opt in per browser if private-window support is technically available.

## 7. Deletion and transparency

Settings must provide:

- Inspect stored data categories.
- Delete one tab record.
- Delete a workspace.
- Clear derived index/model cache.
- Delete all extension data.
- Export a local archive.

The privacy screen should state the limitations: deleting extension data cannot erase browser history, browser-managed caches, or copies the user exported elsewhere.

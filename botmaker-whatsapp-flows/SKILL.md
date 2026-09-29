---
name: botmaker-whatsapp-flows
description: "Trigger: WhatsApp Flows, Flow JSON, Botmaker flow endpoint, data_exchange, 400 Decryption problem, DAG routing. Build and debug Meta Flows with Botmaker endpoints."
license: MIT
metadata:
  author: ignacioFinochietti
  version: "2.0.0"
---

## Activation Contract

Load when designing Meta WhatsApp Flow JSON, writing or debugging a Botmaker WhatsApp Flow endpoint (`data_exchange` action code), or wiring a flow to bot code actions.

## Hard Rules

- Flow JSON: `"version": "6.3"`, `"data_api_version": "3.0"`, `SingleColumnLayout` with one `Form`, kebab-case properties, `__example__` on every `data` field.
- Routing is a forward-only DAG. Terminal screens: `"terminal": true`, not a key in `routing_model`, footer `complete`. Every `flow.nextScreen` must be declared.
- Endpoint URL `https://functions.botmaker.com/whatsapp-flows/:businessId/:wabaId/:actionCode` uses the 15–16 digit WABA ID, never a phone number (else `400 Decryption problem`).
- The Flow endpoint VM is NOT a bot code action: `user`, `rp`, `result`, `context` do not exist. Use `fetch` + `AbortController`, and guard every global with `typeof`.
- Send the step in payload key `component_action`, never `action` (it is dropped). Infer the step from `screen` when it is missing.
- Always set `flow.nextScreen` (current screen for in-place updates) before `flow.send()`. `flow.data` and `flow.nextScreen` are write-only.
- A `data_exchange` response replaces the screen `data`: resend every bound field.
- Read chat variables with `botmakerAPI.getChat(accessToken)`; `ACCESS_TOKEN` is empty. Never write tokens in shared files: use a placeholder pasted inside Botmaker.
- Keep each request under 2500 ms: 1200–1600 ms per HTTP call, parallel independent reads, memoize per execution (no cross-request storage).
- Log keys and timings only, never personal data.

## Decision Gates

| Situation | Action |
| --- | --- |
| Endpoint must persist data for the bot | Return it in the terminal `complete` payload; optionally `botmakerAPI.updateChat` (signature unverified, read back to confirm) |
| Need to send a file (PDF) | Not possible from the endpoint; a bot code action sends it after the flow |
| Porting a bot code action | Replace `user.get` with `getChat` variables, `rp` with `fetch`, drop `result.*` |
| Side effect (booking) in endpoint | Map provider errors to messages; on timeout do not invite a blind retry |
| Radio list may exceed 20 options | Use Dropdown (≤200) |
| Flow closes or shows generic error | Read endpoint LOGS: `[Flow] screen=... keys=...` shows what arrived |

## Execution Steps

1. Read `references/flow-json-rules.md` before writing Flow JSON.
2. Read `references/botmaker-endpoint-runtime.md` before writing endpoint code; read `references/botmaker-rest-api.md` when reading or writing chat variables.
3. Start from `examples/example-frontend.json` and `examples/example-backend.js`.
4. Add a `[Flow] screen/action/keys` log and a `done ms=` log to every endpoint.
5. Test each screen transition in WhatsApp and check the endpoint LOGS tab.

## Output Contract

Return the Flow JSON, the endpoint code, the list of bot variables and how they map to the `complete` payload, and every value the user must paste inside Botmaker (tokens, IDs).

## References

- `references/flow-json-rules.md` — Flow JSON schema, UX, routing and limits.
- `references/botmaker-endpoint-runtime.md` — verified endpoint globals, payload quirks, `botmakerAPI`, latency, security.
- `references/botmaker-rest-api.md` — Botmaker REST API v2.0: auth, `chatReference`, chat and variable operations.
- `examples/example-frontend.json` — minimal Flow JSON with reactive visibility.
- `examples/example-backend.js` — endpoint pattern for the real Botmaker runtime.

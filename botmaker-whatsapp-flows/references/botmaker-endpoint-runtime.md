# Botmaker Flow Endpoint Runtime

Facts observed in a production Botmaker account (Flow endpoint action code, logs from 2026-09-29), unless marked **unverified**.

## Two different VMs

| | Bot code action | WhatsApp Flow endpoint action |
| --- | --- | --- |
| Invoked by | Bot designer step | `https://functions.botmaker.com/whatsapp-flows/:businessId/:wabaId/:actionCode` |
| `user` (`user.get` / `user.set`) | Yes | **No** — `ReferenceError: user is not defined` |
| `rp` (request-promise) | Yes | **No** — `rp is not defined` |
| `result` (`result.done`, `result.text`, `result.fileFromBuffer`) | Yes | **No** (`typeof result === 'undefined'`) |
| `context` / `constants` | — | No |
| `fetch`, `AbortController` | — | Yes |
| `flow` | — | Yes: `data`, `nextScreen`, `send` |
| `data`, `screen`, `bmconsole` | — | Yes |
| `botmakerAPI` | — | Yes: `ACCESS_TOKEN`, `getChat`, `updateChat`, `getProducts` |

Consequence: code copied from bot actions breaks in the endpoint. Guard every global with `typeof x !== 'undefined'` and never call `user.*` or `rp` directly.

## `flow` object

- `flow.data` and `flow.nextScreen` are write-only setters: the log shows `set data {...}` / `set nextScreen X`, and reading them back returns nothing. Keep your own variables if you need the values.
- A `data_exchange` response replaces the whole screen `data`: resend every field the screen binds (lists, flags, forwarded values), not only the changed ones.
- Always assign `flow.nextScreen` (the current screen for an in-place update). A response without a screen was followed by the flow closing on the client.

## Payload behavior

- A payload key named `action` never reaches the endpoint (it collides with the protocol field `action: "data_exchange"`). Use `component_action`.
- Form values of components that are not rendered (e.g. inside a false `If`) are omitted from `data`.
- `${data.*}` forwarded values arrive normally.
- Fallback: when `component_action` is missing, infer the step from `screen` (and from which keys are present, e.g. `'confirmar' in data`).

## Chat variables through `botmakerAPI`

- `botmakerAPI.getChat(accessToken)` returns the chat of the person using the flow: `chat`, `creationTime`, `firstName`, `lastName`, `country`, `email`, `variables`, `tags`, ... Variable values are strings.
- `botmakerAPI.getChat()` and `getChat({ accessToken })` fail with `unauthenticated (401). Maybe you forgot passing accessToken param?`.
- `botmakerAPI.ACCESS_TOKEN` is an empty string in the endpoint: supply a Botmaker API access token (Integraciones > API) yourself.
- `botmakerAPI.updateChat` exists. **Unverified** signature: try `updateChat(accessToken, { variables })`, then `updateChat(accessToken, variables)`, and read the chat back to confirm a variable was stored.
- REST equivalent and full operation list: see `botmaker-rest-api.md`.

## Persistence and latency

- No per-user storage exists in the endpoint: caches only live for one execution. Memoize shared reads (sheet download, `getChat`) inside the request.
- Run independent calls in parallel (`Promise.all`).
- Budget: WhatsApp aborts after ~2500 ms. Observed: `getChat` + public Google Sheet CSV + one availability GET ≈ 800 ms.
- Side effects (bookings, payments) inside the endpoint: a timeout can hide a successful write. Show a message that does not invite a blind retry, and map the provider's duplicate/limit errors to clear messages.
- A file (PDF) cannot be sent from the endpoint (`result.fileFromBuffer` is unavailable). Return the data in the terminal `complete` payload and let a bot code action send it.

## Response to the bot

- The terminal footer `complete` payload is what the bot receives after the flow. Include every value the next bot actions need, in the exact names and formats they expect (e.g. `DD/MM/YYYY` dates, exact procedure labels).
- An empty string, not `"false"`, is the only safe falsy value for variables that bot code reads with `!!user.get(...)`.

## Security

- Never write access tokens or passwords in shared files or chats. Leave a placeholder (`'PEGAR_TOKEN_EN_BOTMAKER'`) and paste the value inside Botmaker.
- Log field names and timings, never DNI, birthdates, emails or phone numbers.

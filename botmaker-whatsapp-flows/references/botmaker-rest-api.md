# Botmaker REST API v2.0 (chat data)

Source: official OpenAPI spec `https://api.botmaker.com/v2.0/openapi.json` (docs UI: `https://api.botmaker.com/v2.0/`). Only the operations relevant to Flow endpoints are listed.

## Authentication

| Header | Use |
| --- | --- |
| `access-token` | Programs and integrations. Generated in Botmaker > Integraciones > API. |
| `bearer-token` | Agents connected to Botmaker. Not usable by programs. |

An access token is a long-lived JWT with API access to the whole business account. Treat it as a secret: placeholder in shared code, real value only inside Botmaker, rotate if it is ever exposed.

## `chatReference`

Path parameter used by the chat operations. One of:

- The `chatId` (visible in the chat URL `go.botmaker.com/#/chat/{chatId}`).
- `channelId` + `:` + `contactId`. For WhatsApp, `channelId` is the bot's phone line and `contactId` the person's number.
- An `externalId`, when the bot loads users from an organization's own database.

## Operations

| Operation | What it does |
| --- | --- |
| `GET /chats/{chatReference}` | Chat state. Only chats with activity in the last 2 months (older: `GET /chats`). |
| `PATCH /chats/{chatReference}` | Changes chat `variables`, tags, name, email or country. Send only the fields to change. |
| `GET /chats/variables?chat-id=&from=&to=` | Latest assignment of each variable in a chat, last 31 days max. |
| `GET /chats` | List and search chats. |
| `GET /variables` | List the variables defined in the account. |
| `POST /chats-actions/send-messages` | Send messages to a chat. |
| `POST /chats-actions/trigger-intent` | Trigger a bot intent in a chat. |

## `GET /chats/{chatReference}` response

Fields: `chat`, `creationTime`, `lastSessionCreationTime`, `externalId`, `firstName`, `lastName`, `country`, `email`, `whatsAppWindowCloseDatetime`, `variables`, `tags`, `queueId`, `agentId`, `onHoldAgentId`, `lastUserMessageDatetime`, `listMessagesURL`, `isBanned`, `isTester`, `isBotMuted`.

`variables` is an object of strings: `{ "varName": "some value", "numVar": "12345" }`.

## Relation with the Flow endpoint

- Inside a Flow endpoint, `botmakerAPI.getChat(accessToken)` returns the same chat shape for the person using the flow, without building a `chatReference` (verified).
- `botmakerAPI.updateChat` exists and is likely the in-VM equivalent of `PATCH /chats/{chatReference}` (**unverified**; see `botmaker-endpoint-runtime.md`).
- Calling the REST API directly with `fetch` needs a `chatReference`, which the Flow endpoint does not receive: prefer `botmakerAPI`.
- Each call adds latency to the 2500 ms budget of the flow request.

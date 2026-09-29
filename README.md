# Botmaker WhatsApp Flows: AI Agent Context Rules

## What is this?
This repository contains a strict, structured AI Agent Skill and Context Guide specifically designed for Large Language Models (LLMs) and coding agents developing **WhatsApp Flows** integrated with **Botmaker's Data Exchange** architecture.

This skill follows the universal **Agent Skills** specification and is compatible with:
- **Claude Code** (via `skills.sh` or `.claude/skills`)
- **Open Code** (via `.agents/skills`)
- **Google Antigravity** (via `.agents/skills` or global skills)
- **Cursor / GitHub Copilot / ChatGPT** (via custom prompt context)

## Why do I need this?
When using AI agents to generate Flow JSON files or Botmaker Action Code endpoints, models frequently produce fatal production bugs:
- **Deprecated Flow versions**: Uses `1.0` or `3.1` (frozen by Meta), causing `"Flow JSON version is not supported"` rejections.
- **Bot code copied into a Flow endpoint**: Uses `user.get`, `rp` or `result`, which do not exist in the Botmaker WhatsApp Flow endpoint VM (`user is not defined`, `rp is not defined`).
- **Dropped step key**: Sends the step in a payload key named `action`, which never reaches the endpoint. Use `component_action`.
- **Flow closing on update**: Responds without `flow.nextScreen`, or resends only part of the screen data.
- **Unreadable chat variables**: Calls `botmakerAPI.getChat()` without the access token (`unauthenticated (401)`).
- **The "400 Decryption problem" trap**: Configures endpoint URLs using the phone number instead of the 15–16 digit numerical WABA ID.
- **Missing Ping health-checks**: Fails automated Meta and Botmaker endpoint validation pings (`action === 'ping'`).
- **Uncapped dynamic strings**: Exceeds Meta's strict **30-character limit on dropdown/radio titles**, crashing WhatsApp UI in runtime.
- **Type mismatch in expressions**: Evaluates string vs boolean operands in `If`/`Switch` conditionals (`invalid operand format`).

This skill enforces strict rules and architectural patterns to eliminate these errors before code touches production.

## How to use it

### Automatic Installation (skills.sh)
If your AI agent supports the `skills.sh` ecosystem (Claude Code, etc.), install it directly:
```bash
npx skills add ignacioFinochietti/whatsapp-flows-botmaker-ai-prompt
```

### Direct Agent Installation
- **Open Code & Antigravity**: Clone or copy `botmaker-whatsapp-flows` into your project's `.agents/skills/` directory.
- **Claude Code**: Clone or copy `botmaker-whatsapp-flows` into `.claude/skills/`.

### Manual Prompt Context
1. Open [`/botmaker-whatsapp-flows/SKILL.md`](botmaker-whatsapp-flows/SKILL.md).
2. Copy the contents into your agent's system prompt or custom instructions.

## Included Files
Inside [`/botmaker-whatsapp-flows`](botmaker-whatsapp-flows):
- [`SKILL.md`](botmaker-whatsapp-flows/SKILL.md): Runtime contract loaded by the agent.
- [`references/flow-json-rules.md`](botmaker-whatsapp-flows/references/flow-json-rules.md): Flow JSON schema, UX, DAG routing and hard limits.
- [`references/botmaker-endpoint-runtime.md`](botmaker-whatsapp-flows/references/botmaker-endpoint-runtime.md): Globals available in the Botmaker Flow endpoint VM (verified in production logs), payload quirks, `botmakerAPI`, latency and security rules.
- [`references/botmaker-rest-api.md`](botmaker-whatsapp-flows/references/botmaker-rest-api.md): Botmaker REST API v2.0 authentication and chat/variable operations.
- [`examples/example-frontend.json`](botmaker-whatsapp-flows/examples/example-frontend.json): Flow JSON (v6.3 / 3.0) with reactive dynamic visibility and valid DAG routing.
- [`examples/example-backend.js`](botmaker-whatsapp-flows/examples/example-backend.js): Flow endpoint using `fetch` with timeouts, `botmakerAPI.getChat(accessToken)`, `component_action` routing with screen fallback, and diagnostic logs without personal data.

## License
MIT License

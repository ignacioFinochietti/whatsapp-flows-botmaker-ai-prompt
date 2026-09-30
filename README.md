# Botmaker WhatsApp Flows: AI Agent Context Rules (v2.0.0)

## What is this?
This repository contains a strict, production-verified AI Agent Skill and Context Guide specifically designed for Large Language Models (LLMs) and coding agents developing **WhatsApp Flows** integrated with **Botmaker's Data Exchange** architecture.

This skill follows the universal **Agent Skills** specification and is compatible with:
- **Claude Code** (via `skills.sh` or `.claude/skills`)
- **Open Code** (via `.agents/skills`)
- **Google Antigravity** (via `.agents/skills`, global skills, or `/wflows`)
- **Cursor / GitHub Copilot / ChatGPT** (via custom prompt context)

## Why do I need this?
When using AI agents to generate Flow JSON files or Botmaker Action Code endpoints, models frequently produce fatal production bugs:
- **The Two-VM Confusion**: LLMs frequently confuse Bot code actions with WhatsApp Flow endpoint actions (`data_exchange`). In the Flow endpoint VM, `user`, `rp`, `result`, and `context` **do not exist**. Calling `result.done()` or `user.get()` causes `ReferenceError: user is not defined`. Endpoints use native `fetch`, `AbortController`, and `botmakerAPI.getChat(accessToken)`.
- **Dropped `action` payload**: A payload key named `action` never reaches the endpoint because it collides with Meta's protocol field `action: "data_exchange"`. Step identifiers must be passed in `component_action`.
- **The "400 Decryption problem" trap**: Configuring endpoint URLs using a phone number instead of the 15–16 digit numerical WABA ID causes immediate gateway failure before code executes.
- **Omitted `flow.nextScreen`**: Responses without an explicit `nextScreen` (even for in-place updates) cause WhatsApp client drops.
- **Partial screen updates**: A `data_exchange` response completely replaces screen `data`; failing to resend all bound fields blanks out the UI.
- **Deprecated Flow versions**: Uses `1.0` or `3.1` (frozen by Meta), causing `"Flow JSON version is not supported"` rejections.
- **Uncapped dynamic strings**: Exceeds Meta's strict **30-character limit on dropdown/radio titles**, crashing WhatsApp UI at runtime.
- **Expression type mismatches**: Evaluating string vs boolean operands in `If`/`Switch` conditionals (`invalid operand format`).

This skill enforces strict rules and architectural patterns to eliminate these errors before code touches production.

## How to use it

### Automatic Installation (skills.sh)
If your AI agent supports the `skills.sh` ecosystem (Claude Code, etc.), install it directly:
```bash
npx skills add ignacioFinochietti/whatsapp-flows-botmaker-ai-prompt
```

### Direct Agent Installation
- **Open Code & Antigravity**: Clone or copy `botmaker-whatsapp-flows` into your project's `.agents/skills/` directory (or name it `wflows` to use `/wflows` as a slash command).
- **Claude Code**: Clone or copy `botmaker-whatsapp-flows` into `.claude/skills/`.

### Manual Prompt Context
1. Open [`/botmaker-whatsapp-flows/SKILL.md`](botmaker-whatsapp-flows/SKILL.md).
2. Copy the contents into your agent's system prompt or custom instructions.

## Repository Structure & References

```text
├── botmaker-whatsapp-flows/
│   ├── SKILL.md                          # Main skill contract and hard rules (v2.0.0)
│   ├── references/
│   │   ├── botmaker-endpoint-runtime.md  # Production-verified VM differences, globals, latency & security
│   │   ├── botmaker-rest-api.md          # Botmaker REST API v2.0 specification for chat variables
│   │   └── flow-json-rules.md            # Schema v6.3 / 3.0, DAG routing rules, and limits
│   └── examples/
│       ├── example-backend.js            # Production endpoint pattern with fetch + AbortController
│       └── example-frontend.json         # Reactive Flow JSON v6.3 with SingleColumnLayout
└── examples/                             # Root mirrored examples for quick GitHub browsing
    ├── example-backend.js
    └── example-frontend.json
```

## License
MIT License

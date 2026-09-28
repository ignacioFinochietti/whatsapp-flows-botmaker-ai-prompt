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
- **Hanging Botmaker VM execution**: Omits `result.done()` in Action Code, leaving asynchronous execution sandboxes hanging until timeout.
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

## Included Examples
Inside [`/examples`](examples):
- [`example-frontend.json`](examples/example-frontend.json): Production-grade WhatsApp Flow JSON (v6.3 / 3.0) with reactive dynamic visibility and valid DAG routing.
- [`example-backend.js`](examples/example-backend.js): Botmaker Action Code JS endpoint implementing health-check pings, SLA timeouts, 30-char clamping, and `result.done()` lifecycle termination.

## License
MIT License

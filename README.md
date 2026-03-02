# Botmaker WhatsApp Flows: AI Agent Context Rules

## What is this?
This repository contains a strict, structured AI Prompt Template (Context Document) specifically designed to guide Large Language Models (LLMs) and coding agents in the correct development of **WhatsApp Flows** using **Botmaker's Data Exchange** architecture.

This repository is compatible with **[skills.sh](https://skills.sh/)**, meaning you can install it directly into your AI agents as a native skill.

## Why do I need this?
When using AI (like GitHub Copilot, ChatGPT, or custom agents) to generate JSON files for WhatsApp Flows or JS Endpoints for Botmaker, the AI often:
- Hallucinates traditional webhook responses (`res.json()`) instead of the required `flow.send()`.
- Breaks WhatsApp routing components (`If/Switch`) by mixing data types (`Type mismatch`).
- Forgets to handle UI limits native to the WhatsApp API (e.g., Dropdown item limits).

This skill prevents all those issues by setting strict `[RULES]` and mapping `[KNOWN ERRORS]`.

## How to use it

### Automatic Installation (skills.sh)
If your AI agent supports the `skills.sh` ecosystem, you can install this skill directly by running:
```bash
npx skills add <YOUR_GITHUB_USERNAME>/whatsapp-flows-botmaker-ai-prompt
```
*(Make sure to push this repository to GitHub and make it public first!)*

### Manual Usage
1. Open the file [`/botmaker-whatsapp-flows/SKILL.md`](botmaker-whatsapp-flows/SKILL.md).
2. Copy the content below the YAML frontmatter.
3. Paste it into your AI Agent's "System Prompt", "Custom Instructions", or feed it directly into the chat context before asking it to write or debug code.

## Examples
Inside the `/examples` folder, you will find:
- `example-frontend.json`: A baseline WhatsApp Flow JSON implementing reactive visibility rules.
- `example-backend.js`: A baseline Botmaker Code Action JS Endpoint handling routing and fallback instructions.

## License
MIT License

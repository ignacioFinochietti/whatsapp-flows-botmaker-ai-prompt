---
name: botmaker-whatsapp-flows
description: >-
  Strict architectural rules, UI constraints, and error prevention guidelines for building
  Meta WhatsApp Flows (Flow JSON) and Botmaker Action Code endpoints (data_exchange). Use when designing
  flows, writing action code endpoints, fixing 400 Decryption problems, schema validation errors, or DAG routing.
---

# Development Guidelines: WhatsApp Flows & Botmaker Data Exchange

Strict architecture rules, Meta schema constraints, and error prevention runbooks for designing WhatsApp Flows and writing Botmaker Action Code (`data_exchange`) endpoints.

---

## 1. Golden Rules of Meta WhatsApp Flows (Frontend)

### Schema & Versions
- **Flow JSON Version**: Always use `"version": "6.3"` and `"data_api_version": "3.0"`. Never use deprecated or frozen versions (`1.0`, `2.0`, `3.0`, `3.1`), as Meta's builder rejects them with `"Flow JSON version is not supported"`.
- **Layout Architecture**: Every screen MUST declare `"type": "SingleColumnLayout"` with a single top-level `"Form"` container holding all interactive children and the footer.
- **Kebab-Case Enforcement**: All component keys and properties MUST be strictly kebab-case (`on-click-action`, `data-source`, `input-type`, `helper-text`). Using camelCase (`onClickAction`, `dataSource`) triggers schema validation rejection.
- **Mandatory `__example__`**: Every dynamic field declared in a screen's `data` schema MUST have a valid `__example__`. Omitting examples throws Meta's `"property has no example"` error.
- **Binding Syntax**:
  - Dynamic data from endpoint: `${data.property_name}`
  - Form input value: `${form.input_name}`

### UX & Screen Flow Architecture
- **[RULE - Zero Friction]**: NEVER create intermediary screens that only contain informational text and a "Continue" button. Always combine instructional text with actionable inputs/selectors on the same screen.
- **[RULE - Reactive In-Screen Visibility]**: Prefer dynamic visibility (`visible: "${data.showSection}"` and `enabled: "${data.isEnabled}"`) over creating separate transition screens. The endpoint can show, hide, or enable components on the active screen in real-time via `flow.data`.
- **[RULE - Expression Type Safety]**: When writing expressions in conditional routing or visibility bindings (`If`/`Switch`), operand data types MUST match identically (e.g., boolean `true` vs `"true"`, number vs string). Type mismatches throw `invalid operand format` or `Type mismatch`.

---

## 2. Routing Model & Navigation Contract (DAG)

Meta enforces a strict **Directed Acyclic Graph (DAG)** with **forward-only routing**:

```json
"routing_model": {
  "SCREEN_A": ["SCREEN_B", "SCREEN_C"],
  "SCREEN_B": ["SCREEN_D"]
}
```

### Critical Routing Rules:
1. **No Backward Routes / No Cycles**:
   - Meta strictly rejects backward routes that mirror forward routes:
     `Backward route [B->A] corresponding to forward route [A->B] is not allowed.`
   - Returning to previous screens is handled **natively by the `<` (Back) arrow** in WhatsApp's top-left app bar. Never declare backward routes or duplicate back buttons in data exchange.
2. **Terminal Screens**:
   - Screens with no forward progression (e.g. `CONFIRMATION`, `NO_RESULTS`) MUST declare `"terminal": true`.
   - Terminal screens MUST NOT be keys in `routing_model` (e.g. if the entire flow has only one terminal screen, `"routing_model": {}`).
   - Terminal screen footers MUST use `"name": "complete"` (never `data_exchange`).
3. **Declared Destinations**:
   - Any `flow.nextScreen` returned by the server MUST be explicitly declared in `routing_model[currentScreen]`. Undeclared targets trigger client-side runtime crashes.
4. **Explicit Cross-Screen State Propagation**:
   - WhatsApp Flows do NOT persist previous screen form state globally for the endpoint to inspect at any moment.
   - Crucial selections or inputs from prior screens MUST be explicitly forwarded inside the `payload` of subsequent `navigate` or `data_exchange` actions (e.g., `{ "previousSelectionId": "${form.currentSelection}", "action": "NEXT_STEP" }`).

---

## 3. Botmaker Action Code Endpoint (`data_exchange`)

### Endpoint URL Structure
```text
https://functions.botmaker.com/whatsapp-flows/:businessId/:wabaId/:actionCode
```
> [!IMPORTANT]
> `:wabaId` MUST be the **15–16 digit Meta WhatsApp Business Account ID (WABA ID)**, NEVER the phone number. Placing a phone number causes `Estado 400: Decryption problem` at the Botmaker gateway before your script runs.

### Production Boilerplate
```javascript
// Injected globals in Botmaker VM:
// screen, data, flow, bmconsole, user, result

async function handleFlow() {
  const currentScreen = typeof screen !== 'undefined' ? screen : null;
  const currentData = (typeof data !== 'undefined' && data) ? data : {};
  const action = currentData.action || currentData.component_action || null;

  // 1. Health-check ping (Mandatory for Meta & Botmaker endpoint verification)
  if (action === 'ping') {
    flow.data = { status: 'active' };
    flow.send();
    return;
  }

  // 2. Initial Flow Launch / Reset
  if (!currentScreen || action === 'iniciar' || action === 'INIT') {
    flow.data = {};
    flow.nextScreen = 'FIRST_SCREEN';
    flow.send();
    return;
  }

  // 3. Action Transitions
  if (action === 'fetch_details') {
    const selectedId = currentData.selectedId;
    // Query API / Database...
    flow.data = {
      showDynamicMessage: true,
      dynamicMessage: 'Details loaded successfully'
    };
    flow.send();
    return;
  }

  // Default fallback
  flow.send();
}

async function main() {
  try {
    await handleFlow();
  } catch (error) {
    if (typeof bmconsole !== 'undefined' && bmconsole.log) {
      bmconsole.log('[Flow Error]: ' + error.message);
    }
    if (typeof user !== 'undefined' && user.set) {
      user.set('error_flow', error.message || 'Unknown error');
    }
    if (typeof flow !== 'undefined' && flow.send) {
      flow.data = {
        showDynamicMessage: true,
        dynamicMessage: 'An unexpected error occurred. Please try again.'
      };
      flow.send();
    }
  } finally {
    // CRITICAL: Botmaker VM requires result.done() to release the sandbox
    if (typeof result !== 'undefined' && result && typeof result.done === 'function') {
      result.done();
    }
  }
}

main();
```

### Critical Backend Architecture Rules:
1. **Lifecycle Termination (`flow.send()` + `result.done()`)**:
   - Every `data_exchange` execution path MUST populate `flow.data` (and optionally `flow.nextScreen`) and call `flow.send()`.
   - The script execution MUST always trigger `result.done()` inside a `finally` block. Missing `result.done()` causes the Botmaker VM sandbox to hang until timeout.
2. **Context Access & Latency**:
   - Use injected globals (`user.get('var')` / `user.set('var', val)`) for zero-latency session variables.
   - Avoid heavy external REST calls like `botmakerAPI.getChat()` unless strictly required, as extra round-trips risk breaching WhatsApp's strict 2500ms latency SLA.
3. **Graceful UI Fallbacks**:
   - If an external API or database returns empty results, inject explicit fallback flags into `flow.data` (e.g. `showSelector: false`, `emptyMessage: "No items available"`, empty array `[]`) or navigate to a declared terminal screen (`NO_RESULTS`). Never leave selectors unpopulated without fallback handling.
4. **Input Sanitization ("Other" / Free Text)**:
   - When offering a fallback selection (like `"OTHER"`) followed by a free-text input (`TextInput`), overwrite the generic ID with the user's sanitized text response before persisting to CRM or session variables.

---

## 4. Component Patterns & Hard Limits

| Element | Max Limit | Consequence of Breach | Best Practice |
| :--- | :--- | :--- | :--- |
| **Dropdown / Radio Title** | **30 characters** | Client screen crash / Validation error | Enforce `title.substring(0, 30)` or helper utility. |
| **Description** | **200 characters** | Payload rejection | Enforce `desc.substring(0, 200)`. |
| **List / Dropdown Items** | **200 items** | Payload size / UI freeze | Enforce `.slice(0, 200)`. |
| **Payload Size** | **< 100 KB** | WhatsApp Flow failure | Exclude large images and unnecessary metadata. |
| **SLA Latency** | **< 2500 ms** | Client timeout spinner | Use 2000ms timeouts on external HTTP requests. |

---

## 5. Pre-flight Verification Checklist

Before publishing any WhatsApp Flow or Botmaker endpoint:
1. [ ] Flow JSON declares `"version": "6.3"` and `"data_api_version": "3.0"`.
2. [ ] All screens use `SingleColumnLayout` with a single top-level `Form`.
3. [ ] All component properties use strict kebab-case.
4. [ ] All dynamic data keys declare a valid `__example__`.
5. [ ] Routing model has NO backward route cycles.
6. [ ] Terminal screens declare `"terminal": true` and are NOT keys in `routing_model`.
7. [ ] Botmaker endpoint URL uses the numerical `wabaId` (15–16 digits), NOT a phone number.
8. [ ] Action Code handles `action === 'ping'` returning `{ status: 'active' }`.
9. [ ] Action Code always concludes with `result.done()` in a `finally` block.
10. [ ] Option titles are clamped to $\le$ 30 characters and lists capped at $\le$ 200 items.

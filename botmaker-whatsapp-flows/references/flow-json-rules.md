# Flow JSON Rules (Meta WhatsApp Flows)

Detailed frontend rules for Flow JSON. `SKILL.md` keeps the non-negotiable subset.

## Schema & Versions

- Use `"version": "6.3"` and `"data_api_version": "3.0"`. Deprecated or frozen versions (`1.0`, `2.0`, `3.0`, `3.1`) are rejected by Meta's builder with `"Flow JSON version is not supported"`.
- Every screen declares `"type": "SingleColumnLayout"` with a single top-level `"Form"` holding all interactive children and the footer.
- Component keys and properties are kebab-case (`on-click-action`, `data-source`, `input-type`, `helper-text`). camelCase fails schema validation.
- Every field declared in a screen's `data` schema needs a valid `__example__`, or Meta throws `"property has no example"`.
- Bindings: endpoint data `${data.property_name}`, form input `${form.input_name}`.

## UX Rules

- **Zero friction**: never create a screen with only text and a "Continue" button. Put instructions next to the inputs they explain.
- **Reactive in-screen visibility**: prefer `visible: "${data.flag}"`, `enabled: "${data.flag}"` or `If` components over extra transition screens. The endpoint can show, hide or enable components on the active screen via `flow.data`.
- **Expression type safety**: operands in `If`/`Switch` conditions and visibility bindings must have identical types (boolean `true` vs `"true"`, number vs string), or Meta throws `invalid operand format` / `Type mismatch`.
- A required component inside a non-rendered `If` branch is not validated, and its `${form.*}` value is omitted from the payload.
- Concatenating literal text with a binding (e.g. `"Code: ${data.code}"`) is not portable across versions: build the full string in the endpoint and bind `${data.code_text}`.

## Routing Model (DAG)

```json
"routing_model": {
  "SCREEN_A": ["SCREEN_B", "SCREEN_C"],
  "SCREEN_B": ["SCREEN_D"]
}
```

1. **No backward routes or cycles.** Meta rejects `Backward route [B->A] corresponding to forward route [A->B] is not allowed.` The native `<` arrow in the WhatsApp app bar handles going back.
2. **Terminal screens** declare `"terminal": true`, are NOT keys in `routing_model`, and their footer uses `"name": "complete"`.
3. **Declared destinations.** Every `flow.nextScreen` returned by the endpoint must be listed in `routing_model[currentScreen]`, or the client crashes.
4. **Explicit state propagation.** Screens do not share form state. Forward every value a later step needs in the payload (`"ciudad": "${data.ciudad}"`) and re-declare it in the next screen's `data`.

## Hard Limits

| Element | Limit | Practice |
| --- | --- | --- |
| Dropdown / Radio option title | 30 characters | `title.substring(0, 30)` |
| Option description | 200 characters | `desc.substring(0, 200)` |
| RadioButtonsGroup options | 20 items | Use Dropdown above 20 |
| Dropdown options | 200 items | `.slice(0, 200)` |
| Response payload | < 100 KB | No images or unused metadata |
| Endpoint latency | < 2500 ms | 1200–1600 ms timeout per HTTP call |

The RadioButtonsGroup limit comes from Meta's component docs and was not re-verified in a live flow.

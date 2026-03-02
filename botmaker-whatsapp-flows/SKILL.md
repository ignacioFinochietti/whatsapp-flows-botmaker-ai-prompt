---
name: botmaker-whatsapp-flows
description: Strict context and architecture rules for building WhatsApp Flows and Botmaker Data Exchange endpoints.
---
# Development Guidelines: WhatsApp Flows & Data Exchange (AI Agent Context)

This document contains strict implementation rules, architectural context, and error prevention guidelines for building WhatsApp Flows and their respective Data Exchange Endpoints within Botmaker.

**IMPORTANT FOR THE AGENT**: You MUST strictly adhere to these rules when designing, modifying, or debugging `.json` (Flows) or `.js` (Endpoints) files.

## 1. UI/UX Rules in JSON (Frontend)
- **[RULE - Zero Friction]**: NEVER create intermediary screens that only contain descriptive text and a "Continue" button.
  - *Correct Pattern*: Combine the text description on the same screen where the user must take an action, make a selection, or complete a form.
- **[RULE - Reactive Visibility]**: Utilize dynamic variables (`${data.yourVariableName}`) in the `visible` and `enabled` properties of components. This allows the backend to dynamically hide/show form elements in real-time based on business logic without artificially navigating to different screens.

## 2. Error Prevention (Flows & Typing)
- **[KNOWN ERROR]**: The WhatsApp validator throws *"invalid operand format"* or *"Type mismatch"* in conditional routing components (`If` or `Switch`).
- **[SOLUTION]**: The data types in the evaluation MUST be identical. Meticulously check references: do not compare a direct boolean with a string representation (e.g., `true` vs `"true"`), and be extremely careful when crossing references between screen form state (`${form.inputName}`) and injected backend data (`${data.injectedValue}`).
- **[KNOWN ERROR - Component Limits]**: Dropdowns or RadioButtons limit the number of items they can render natively depending on WhatsApp's API version.
- **[SOLUTION]**: Never inject an unfiltered array of 100+ items directly into a `<Dropdown>`. Implement server-side filtering logic or split decisions hierarchically (e.g., "Select Province" -> "Select City").

## 3. Data Exchange Architecture (.js Endpoints)
- **[RULE - Routing Pattern]**: The backend script MUST ALWAYS be structured using validations based on the `data.component_action` (or equivalent identifier) variable sent by the JSON flow in its `payload`.
  - *Conceptual Example*: `if (data.component_action === "update_items_list") { // API Logic; flow.data = {...}; flow.send(); }`
- **[RULE - State Propagation]**: Because WhatsApp Flows do not natively save past screen states globally for the endpoint to consume at any time, you MUST ALWAYS drag/propagate crucial previous user selections in the `payload` of the `navigate` or `data_exchange` actions towards subsequent interfaces (e.g., `{ "previousSelectionId": "${form.currentSelection}", "action": "NEXT_STEP" }`).
- **[RULE - Required UI Fallbacks]**: If the endpoint queries an external API or database (e.g., for availability, slots, or items) and it returns empty results, THE AGENT MUST inject fallback variables into `flow.data` to:
  1. Hide the affected selectors (e.g., `showSelector: false`).
  2. Display a friendly text message stating the unavailability (e.g., `unavailabilityMessage: "No items available at the moment."`).
  3. Disable continuation buttons to prevent dead-ends (e.g., `isFooterEnabled: false`).
- **[RULE - Data Exchange Response]**: Every `component_action` block in the backend MUST conclude by modifying the `flow.data` (and optionally `flow.nextScreen`) and explicitly terminating the request. In Botmaker's architecture, this is done using `flow.send();`. Failure to do this hangs the WhatsApp interface payload.

## 4. Botmaker Context
- **[RULE - Context Access]**: To retrieve variables previously saved in the user's WhatsApp session (e.g., tags, queue assignment, or user scope), the endpoint MUST instantiate the native API method `await botmakerAPI.getChat()` and read `dataChat.variables.TARGET_VARIABLE` BEFORE executing critical logic that depends on those data points.
- **[RULE - User Input Sanitization]**: When the flow offers a generic fallback option (like "Other") that subsequently requests free text input, the terminal JSON output must overwrite the generic ID ("Other") with the specific text response provided by the user to avoid data contamination in the subsequent CRM or database.

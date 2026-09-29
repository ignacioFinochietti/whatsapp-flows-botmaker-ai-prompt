// ==============================================================================
// Botmaker WhatsApp Flow endpoint (data_exchange) - verified runtime pattern.
//
// Available globals in the Flow endpoint VM: flow (data, nextScreen, send), data,
// screen, bmconsole, botmakerAPI (getChat, updateChat), fetch, AbortController.
// NOT available: user, rp, result, context. See references/botmaker-endpoint-runtime.md.
// ==============================================================================

// Paste the Botmaker API access token inside Botmaker only. Never commit it.
const BOTMAKER_ACCESS_TOKEN = 'PEGAR_ACCESS_TOKEN_EN_BOTMAKER';
const API_URL = 'https://example.com/api';
const HTTP_TIMEOUT_MS = 1200;

function log(message) {
  if (typeof bmconsole !== 'undefined' && bmconsole.log) bmconsole.log(message);
}

function cut(value, max) {
  const s = value == null ? '' : String(value);
  return s.length > max ? s.substring(0, max) : s;
}

// fetch with timeout. err.error keeps the parsed body (rp-compatible).
async function http({ uri, method = 'GET', qs, headers = {}, body, json = true, timeout = HTTP_TIMEOUT_MS }) {
  const url = new URL(uri);
  Object.entries(qs || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url.toString(), {
      method,
      headers: body !== undefined && json ? Object.assign({ 'Content-Type': 'application/json' }, headers) : headers,
      body: body !== undefined ? (json ? JSON.stringify(body) : body) : undefined,
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      err.statusCode = response.status;
      try { err.error = JSON.parse(text); } catch (e) { err.error = text; }
      throw err;
    }
    return json ? (text ? JSON.parse(text) : null) : text;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Timeout after ${timeout} ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Chat variables of the person using the flow, read once per execution.
let chatVariablesPromise = null;
function getChatVariables() {
  if (!chatVariablesPromise) {
    chatVariablesPromise = (async () => {
      if (typeof botmakerAPI === 'undefined' || typeof botmakerAPI.getChat !== 'function') return {};
      try {
        const chat = await botmakerAPI.getChat(BOTMAKER_ACCESS_TOKEN);
        return (chat && chat.variables) || {};
      } catch (err) {
        log(`[getChat] ${err.message}`);
        return {};
      }
    })();
  }
  return chatVariablesPromise;
}

// ---------- Handlers: always return EVERY field the target screen binds ----------
async function loadOptions(d) {
  const vars = await getChatVariables();
  let options = [];
  try {
    const result = await http({ uri: `${API_URL}/options`, qs: { branch: vars.branchId, q: d.query } });
    options = (result.items || []).slice(0, 200).map(o => ({ id: String(o.id), title: cut(o.name, 30) }));
  } catch (err) {
    log(`[loadOptions] ${err.message}`);
  }
  flow.data = {
    options,
    show_options: options.length > 0,
    show_error: options.length === 0,
    error_msg: options.length ? ' ' : 'No hay opciones disponibles en este momento.'
  };
  // Same screen: in-place update (nextScreen already set by the router).
}

// ---------- Router ----------
// "action" never reaches the endpoint: the Flow JSON sends "component_action".
function inferAction(currentScreen, d) {
  if (currentScreen === 'MAIN_SCREEN') return 'load_options';
  return null;
}

async function handleFlow() {
  const currentScreen = typeof screen !== 'undefined' ? screen : null;
  const d = (typeof data !== 'undefined' && data) ? data : {};
  let action = d.component_action || d.action || null;
  const startedAt = Date.now();
  // Keys only, never values (personal data).
  log(`[Flow] screen=${currentScreen} action=${action} keys=${Object.keys(d).join(',')}`);

  if (action === 'ping') {
    flow.data = { status: 'active' };
    flow.send();
    return;
  }
  if (!action && currentScreen) action = inferAction(currentScreen, d);

  // Every response needs a screen. Forward handlers overwrite it.
  if (currentScreen) flow.nextScreen = currentScreen;

  if (!currentScreen || action === 'INIT') {
    flow.data = { options: [], show_options: false, show_error: false, error_msg: ' ' };
    flow.nextScreen = 'MAIN_SCREEN';
  } else if (action === 'load_options') {
    await loadOptions(d);
  } else {
    log(`[Flow] Unknown action "${action}" on screen ${currentScreen}`);
    flow.data = { show_error: true, error_msg: 'Ocurrió un error inesperado. Por favor, intente nuevamente.' };
  }

  log(`[Flow] done action=${action} ms=${Date.now() - startedAt}`);
  flow.send();
}

async function main() {
  try {
    await handleFlow();
  } catch (error) {
    log('[Flow Error]: ' + error.message);
    if (typeof flow !== 'undefined' && flow.send) {
      flow.data = { show_error: true, error_msg: 'Ocurrió un error inesperado. Por favor, intente nuevamente.' };
      flow.send();
    }
  } finally {
    // `result` does not exist in the Flow endpoint VM; keep the guard for bot-action reuse.
    if (typeof result !== 'undefined' && result && typeof result.done === 'function') result.done();
  }
}

main();

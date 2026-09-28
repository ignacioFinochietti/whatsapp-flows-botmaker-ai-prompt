// ==============================================================================
// 1. CONFIGURATION & HELPERS
// ==============================================================================
const API_URL = "https://example.com/api";

function cut(str, max) {
    if (!str) return "";
    return str.length > max ? str.substring(0, max) : str;
}

async function fetchDetails(id) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2000ms SLA timeout

    try {
        const response = await fetch(`${API_URL}/details/${id}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const resultData = await response.json();

        // Enforce Meta Flow hard limits: <= 30 chars for titles, <= 200 items
        const sanitizedOptions = (resultData.optionsList || [])
            .slice(0, 200)
            .map(opt => ({
                id: String(opt.id),
                title: cut(opt.title || opt.name, 30)
            }));

        return {
            summary: cut(resultData.summary, 200),
            optionsList: sanitizedOptions
        };
    } catch (error) {
        clearTimeout(timeoutId);
        if (typeof bmconsole !== "undefined" && bmconsole.log) {
            bmconsole.log(`[fetchDetails Error]: ${error.message}`);
        }
        return null;
    }
}

// ==============================================================================
// 2. MAIN ENDPOINT LOGIC
// ==============================================================================
async function handleFlow() {
    const currentData = (typeof data !== "undefined" && data) ? data : {};
    const action = currentData.action || currentData.component_action || null;

    // Rule: Health-check ping (Required by Meta & Botmaker endpoint validation)
    if (action === "ping") {
        flow.data = { status: "active" };
        flow.send();
        return;
    }

    // Rule: Context Access
    // Prefer injected globals (user.get / user.set) over external API calls (botmakerAPI.getChat)
    // to preserve WhatsApp's strict 2500ms SLA.
    const userTag = (typeof user !== "undefined" && user.get)
        ? (user.get("user_tag") || "Standard")
        : "Standard";

    // Rule: Routing Pattern
    if (action === "fetch_details") {
        const detailsId = currentData.selectedId;
        const detailsData = await fetchDetails(detailsId);

        // Rule: Required UI Fallbacks
        if (!detailsData || !detailsData.optionsList || detailsData.optionsList.length === 0) {
            if (typeof bmconsole !== "undefined" && bmconsole.log) {
                bmconsole.log(`[WARNING] No details available for ID: ${detailsId}`);
            }
            flow.data = {
                showDynamicMessage: true,
                dynamicMessage: "Sorry, no details are available at this time.",
                dynamicOptions: []
            };
        } else {
            flow.data = {
                showDynamicMessage: true,
                dynamicMessage: `Loaded details for [${userTag}]: ${detailsData.summary}`,
                dynamicOptions: detailsData.optionsList
            };
        }
    }

    // Rule: Data Exchange Response
    // Always call flow.send() to flush flow.data back to the WhatsApp UI.
    flow.send();
}

// ==============================================================================
// 3. EXECUTION LIFECYCLE
// ==============================================================================
async function main() {
    try {
        await handleFlow();
    } catch (error) {
        if (typeof bmconsole !== "undefined" && bmconsole.log) {
            bmconsole.log("[Unhandled Exception]: " + error.message);
        }
        if (typeof flow !== "undefined" && flow.send) {
            flow.data = {
                showDynamicMessage: true,
                dynamicMessage: "An error occurred while processing your request."
            };
            flow.send();
        }
    } finally {
        // CRITICAL: Botmaker VM sandbox requires result.done() to finalize execution
        if (typeof result !== "undefined" && result && typeof result.done === "function") {
            result.done();
        }
    }
}

main();

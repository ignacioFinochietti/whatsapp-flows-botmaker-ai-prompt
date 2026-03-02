// ==============================================================================
// 1. CONFIGURATION
// ==============================================================================
// NOTE: Ideally, credentials should be securely stored in Botmaker variables.
const API_URL = "https://example.com/api";

// ==============================================================================
// 2. HELPER FUNCTIONS
// ==============================================================================
async function fetchDetails(id) {
    try {
        const response = await fetch(`${API_URL}/details/${id}`);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        bmconsole.log(`[fetchDetails Error]: ${error.message}`);
        return null;
    }
}

// ==============================================================================
// 3. MAIN ENDPOINT LOGIC
// ==============================================================================
async function handleFlow() {
    bmconsole.log('Incoming Payload from Flow: ', data);

    // Rule: Context Access
    const CHAT_DATA = await botmakerAPI.getChat();
    const USER_TAG = CHAT_DATA?.variables?.user_tag || 'Standard';

    // Rule: Routing Pattern
    if (data.component_action === "fetch_details") {
        const detailsId = data.selectedId;
        const detailsData = await fetchDetails(detailsId);

        // Rule: Required UI Fallbacks
        if (!detailsData || detailsData.length === 0) {
            bmconsole.log(`[WARNING] No details available for ID: ${detailsId}`);
            flow.data = {
                showDynamicMessage: true,
                dynamicMessage: "Sorry, no details are available at this time.",
                dynamicOptions: [] // Clear the list
            };
        } else {
            flow.data = {
                showDynamicMessage: true,
                dynamicMessage: `Successfully loaded details: ${detailsData.summary}`,
                dynamicOptions: detailsData.optionsList
            };
        }
    }

    // Rule: Data Exchange Response
    // Always call flow.send() to gracefully terminate and push flow.data back to WhatsApp UI.
    flow.send();
}

// Execute
handleFlow()
    .catch(err => bmconsole.log("Unhandled Exception: " + err.message));

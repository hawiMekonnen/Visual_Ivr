import client from "./client";

/**
 * Send a message to the AI Contact Center Conversational Chatbot
 * @param {Object} params
 * @param {string} params.message - The text message sent by the user
 * @param {string} [params.language="en"] - 'en' or 'am'
 * @param {Array} [params.history=[]] - Previous conversation messages [{role: 'user'|'model', text: '...'}]
 * @param {number|null} [params.currentNodeId=null] - Current node ID where the user is browsing
 * @param {string|null} [params.sessionId=null] - Current active session UUID
 * @returns {Promise<{reply: string, suggested_action: Object|null, quick_replies: string[], model: string}>}
 */
export async function sendChatMessage({
  message,
  language = "en",
  history = [],
  currentNodeId = null,
  sessionId = null,
}) {
  const payload = {
    message,
    language,
    history,
    current_node_id: currentNodeId,
    session_id: sessionId,
  };

  const response = await client.post("/api/chat/message", payload);
  return response.data;
}

/**
 * Fetch chatbot server health and AI model status
 */
export async function getChatInfo() {
  const response = await client.get("/api/chat/info");
  return response.data;
}

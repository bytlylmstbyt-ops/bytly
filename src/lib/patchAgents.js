/**
 * Patches the SDK's `base44.agents.subscribeToConversation` to use polling
 * instead of the built-in WebSocket subscription.
 *
 * WHY: The SDK's WebSocket `update_model` handler (agents.js:34) calls
 * `JSON.parse(jsonStr)` WITHOUT try/catch. When the server pushes a malformed
 * event, the SyntaxError becomes an unhandled promise rejection that crashes
 * the app. This patch replaces the subscription with a polling loop that
 * achieves the same result (real-time-ish conversation updates) without the
 * unguarded JSON.parse.
 *
 * Must be called once before the app renders (see main.jsx).
 */
export function patchAgentSubscription() {
  if (!window.base44?.agents?.subscribeToConversation) return;
  if (window.base44.agents.__patched) return;

  const agents = window.base44.agents;
  agents.__patched = true;

  agents.subscribeToConversation = (conversationId, onUpdate) => {
    if (!conversationId || typeof onUpdate !== "function") {
      return () => {};
    }

    let active = true;
    let lastMessageCount = 0;
    let timer = null;

    const poll = async () => {
      if (!active) return;
      try {
        const conv = await agents.getConversation(conversationId);
        if (!conv) return;
        const count = conv.messages?.length || 0;
        if (count !== lastMessageCount || count === 0) {
          lastMessageCount = count;
          try {
            onUpdate(conv);
          } catch (cbErr) {
            console.warn("[patched subscribeToConversation] callback error:", cbErr);
          }
        }
      } catch (err) {
        // Network/auth errors are expected occasionally — keep polling.
        console.warn("[patched subscribeToConversation] poll error:", err?.message || err);
      }
      if (active) {
        timer = setTimeout(poll, 1500);
      }
    };

    // Kick off immediately, then on an interval.
    poll();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  };
}
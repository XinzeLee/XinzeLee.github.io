// Records one page view with the Cloudflare visit counter (hosting/cloudflare-counter).
(() => {
  const COUNTER_URL = "https://xinzelee-counter.xinzelee.workers.dev";
  if (location.protocol === "file:" || COUNTER_URL.includes("REPLACE_WITH")) return;
  const endpoint = `${COUNTER_URL}/hit`;
  const payload = JSON.stringify({ path: location.pathname });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(endpoint, payload)) return;
  } catch {
    /* fall back to fetch */
  }
  fetch(endpoint, { method: "POST", body: payload, keepalive: true, mode: "no-cors" }).catch(() => {});
})();

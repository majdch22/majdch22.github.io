  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", e => e.waitUntil(clients.claim()));
  self.addEventListener("paymentrequest", e => {
    console.log("[SW] Payment handler fired!");
    console.log("[SW] Total:", JSON.stringify(e.total));
    console.log("[SW] Method:", e.methodName);
  });

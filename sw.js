  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", e => e.waitUntil(clients.claim()));
  self.addEventListener("paymentrequest", e => {
    console.log("[SW] fired!", e.total);
  });

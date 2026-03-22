  self.addEventListener("install", e => {
    self.skipWaiting();
    e.waitUntil(
      self.registration.paymentManager.instruments.set("basic", {
        name: "Test Pay",
        method: "https://gleeful-creponne-8ff162.netlify.app/pay.json"
      })
    );
  });

  self.addEventListener("activate", e => e.waitUntil(clients.claim()));

  self.addEventListener("paymentrequest", e => {
    console.log("[SW] Payment handler fired!");
    console.log("[SW] Total:", JSON.stringify(e.total));
    console.log("[SW] Method:", e.methodName);
  });

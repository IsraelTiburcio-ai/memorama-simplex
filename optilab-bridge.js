/* OptiLab protocol v1. Optional: standalone play never depends on the host. */
(function () {
  'use strict';
  var protocol = 'optilab-game';
  var gameId = 'memorama-simplex';
  var params = new URLSearchParams(location.search);
  var session = params.get('optilabSession');
  var hostOrigin = params.get('optilabOrigin');
  var connected = false;
  var run = null;
  var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function allowedHost() {
    try {
      var ref = new URL(document.referrer);
      var host = new URL(hostOrigin);
      var production = host.origin === 'https://israeltiburcio-ai.github.io' && ref.pathname.startsWith('/optilab/');
      var local = ['localhost', '127.0.0.1'].includes(host.hostname) && host.protocol === 'http:';
      return parent !== window && uuid.test(session || '') && ref.origin === host.origin && (production || local);
    } catch (_) { return false; }
  }
  var enabled = allowedHost();

  function send(type, extra) {
    if (!connected) return;
    parent.postMessage(Object.assign({ protocol: protocol, version: 1, gameId: gameId, session: session, type: type }, extra), hostOrigin);
  }
  window.addEventListener('message', function (event) {
    if (!enabled || event.origin !== hostOrigin || event.source !== parent) return;
    var d = event.data;
    if (!d || typeof d !== 'object' || Array.isArray(d) ||
        Object.keys(d).sort().join(',') !== 'gameId,protocol,session,type,version' ||
        d.protocol !== protocol || d.version !== 1 || d.gameId !== gameId ||
        d.session !== session || d.type !== 'host:init') return;
    connected = true;
    document.documentElement.classList.add('optilab-embedded');
    send('game:ready');
    // Repeated init is idempotent; it also recovers a host handshake after load.
    if (run) {
      send('game:started', { runId: run.id });
      if (run.result) send('game:completed', { runId: run.id, result: run.result });
    }
  });

  window.OptiLabBridge = {
    start: function () {
      run = { id: crypto.randomUUID(), result: null };
      send('game:started', { runId: run.id });
    },
    complete: function (result) {
      if (!run || run.result) return;
      run.result = result;
      send('game:completed', { runId: run.id, result: result });
    }
  };
})();

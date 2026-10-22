/* MEMORAMA SIMPLEX · lógica del juego (HTML + CSS + JavaScript vanilla) */
(function () {
  "use strict";

  var DATA = window.MEMORAMA_DATA;
  var TOPICS = DATA.topics;
  var PAIR_COUNT = 8;
  var MISS_DELAY_MS = 1300;   // tiempo visible de una pareja incorrecta
  var END_DELAY_MS = 900;     // pausa antes del resumen final
  var MUTE_KEY = "memorama-simplex:silenciado";

  var PAIR_BY_ID = {};
  DATA.pairs.forEach(function (p) { PAIR_BY_ID[p.id] = p; });

  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var BACK_ART =
    '<svg class="back-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<path d="M14 82 L14 36 L50 16 L86 46 L56 84 Z"/>' +
    '<circle class="dot-origin" cx="14" cy="82" r="4.5"/>' +
    '<circle cx="14" cy="36" r="3"/><circle cx="50" cy="16" r="3"/>' +
    '<circle cx="86" cy="46" r="3"/><circle cx="56" cy="84" r="3"/></svg>';

  function $(id) { return document.getElementById(id); }

  var els = {
    app: $("app"),
    start: $("screen-start"),
    game: $("screen-game"),
    board: $("board"),
    play: $("btn-play"),
    mute: $("btn-mute"),
    restart: $("btn-restart"),
    time: $("stat-time"),
    pairs: $("stat-pairs"),
    attempts: $("stat-attempts"),
    accuracy: $("stat-accuracy"),
    feedback: $("feedback"),
    dialog: $("end"),
    endLead: $("end-lead"),
    endTime: $("end-time"),
    endErrors: $("end-errors"),
    endAccuracy: $("end-accuracy"),
    endAttempts: $("end-attempts"),
    recap: $("end-recap"),
    again: $("btn-again"),
    close: $("btn-close")
  };

  /* ---------- utilidades ---------- */
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function plainText(html) {
    var box = document.createElement("div");
    box.innerHTML = html;
    return (box.textContent || "").replace(/\s+/g, " ").trim();
  }

  function formatTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + (r < 10 ? "0" + r : String(r));
  }

  // Color de tema mezclado con blanco (opaco) para el fondo de una carta acertada.
  function tintOf(hex, weight) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    function mix(c) { return Math.round(255 - (255 - c) * weight); }
    return "rgb(" + mix(r) + "," + mix(g) + "," + mix(b) + ")";
  }

  /* ---------- sonido: Web Audio sintetizado (sin archivos, sin música) ---------- */
  var Sound = (function () {
    var ctx = null;
    var muted = false;
    try { muted = window.localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { muted = false; }

    function getContext() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      }
      if (ctx.state === "suspended") {
        try { ctx.resume(); } catch (e) { /* ignorar */ }
      }
      return ctx;
    }

    function tone(freq, start, dur, type, peak, slideTo) {
      var c = getContext();
      if (!c) return;
      var t0 = c.currentTime + start;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }

    var cues = {
      flip: function () { tone(520, 0, 0.08, "triangle", 0.05, 700); },
      match: function () {
        tone(660, 0, 0.14, "sine", 0.07);
        tone(990, 0.09, 0.2, "sine", 0.06);
      },
      miss: function () {
        tone(330, 0, 0.16, "sine", 0.05);
        tone(247, 0.09, 0.22, "sine", 0.04);
      },
      win: function () {
        var notes = [523.25, 659.25, 783.99, 1046.5];
        for (var i = 0; i < notes.length; i++) {
          tone(notes[i], i * 0.13, 0.26, "sine", 0.06);
        }
      }
    };

    return {
      play: function (name) { if (!muted && cues[name]) cues[name](); },
      unlock: function () { if (!muted) getContext(); },
      isMuted: function () { return muted; },
      setMuted: function (value) {
        muted = !!value;
        try { window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) { /* ignorar */ }
      }
    };
  })();

  /* ---------- selección aleatoria: 8 parejas, una por tema ---------- */
  function pickPairs(count, avoid) {
    var byTopic = {};
    var order = [];
    DATA.pairs.forEach(function (p) {
      if (!byTopic[p.topic]) {
        byTopic[p.topic] = [];
        order.push(p.topic);
      }
      byTopic[p.topic].push(p);
    });
    var topics = shuffle(order);
    var chosen = [];
    for (var i = 0; i < topics.length && chosen.length < count; i++) {
      var pool = byTopic[topics[i]];
      var fresh = pool.filter(function (p) { return !avoid[p.id]; });
      chosen.push(shuffle(fresh.length ? fresh : pool)[0]);
    }
    return shuffle(chosen);
  }

  /* ---------- estado de la partida ---------- */
  var game = null;

  function createGame(pairs) {
    var cards = [];
    pairs.forEach(function (p) {
      cards.push({ pairId: p.id, topic: p.topic, html: p.a, text: plainText(p.a),
                   open: false, matched: false, el: null, tag: null });
      cards.push({ pairId: p.id, topic: p.topic, html: p.b, text: plainText(p.b),
                   open: false, matched: false, el: null, tag: null });
    });
    return {
      pairs: pairs,
      cards: shuffle(cards),
      pending: [],      // índices boca arriba sin pareja (máximo 2)
      busy: false,      // bloquea toques mientras se evalúa una pareja
      finished: false,
      attempts: 0,
      matched: 0,
      errors: 0,
      started: false,
      clockOn: false,
      clockStart: 0,
      elapsed: 0,
      ticker: null,
      timers: []
    };
  }

  /* ---------- render del tablero ---------- */
  function renderBoard(g) {
    els.board.innerHTML = "";
    var frag = document.createDocumentFragment();
    g.cards.forEach(function (card, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.setAttribute("data-index", String(i));
      btn.innerHTML =
        '<span class="card-inner">' +
          '<span class="face face-back" aria-hidden="true">' + BACK_ART + '</span>' +
          '<span class="face face-front" aria-hidden="true">' +
            '<span class="card-tag"></span>' +
            '<span class="card-text">' + card.html + '</span>' +
            '<span class="card-check">' + ICON_CHECK + '</span>' +
          '</span>' +
        '</span>';
      card.el = btn;
      card.tag = btn.querySelector(".card-tag");
      btn.addEventListener("click", makeFlipHandler(i));
      frag.appendChild(btn);
      syncCard(g, i);
    });
    els.board.appendChild(frag);
  }

  function makeFlipHandler(i) {
    return function () { flip(i); };
  }

  function cardLabel(g, i) {
    var c = g.cards[i];
    var head = "Carta " + (i + 1) + " de " + g.cards.length;
    if (c.matched) return head + ", pareja encontrada: " + c.text + ". " + TOPICS[c.topic].name + ".";
    if (c.open) return head + ", boca arriba: " + c.text;
    return head + ", boca abajo";
  }

  function syncCard(g, i) {
    var c = g.cards[i];
    c.el.classList.toggle("is-open", c.open);
    c.el.classList.toggle("is-matched", c.matched);
    c.el.setAttribute("aria-label", cardLabel(g, i));
    c.el.setAttribute("aria-disabled", c.matched ? "true" : "false");
  }

  function markMatched(g, i) {
    var c = g.cards[i];
    var color = TOPICS[c.topic].color;
    c.matched = true;
    c.open = true;
    c.el.style.setProperty("--c", color);
    c.el.style.setProperty("--tint", tintOf(color, 0.14));
    c.tag.textContent = TOPICS[c.topic].name;
    syncCard(g, i);
  }

  /* ---------- flujo de juego ---------- */
  function flip(i) {
    var g = game;
    if (!g || g.busy || g.finished) return;
    var c = g.cards[i];
    if (c.open) return;                 // ya boca arriba (o acertada)
    if (!g.started) startClock(g);
    Sound.unlock();
    c.open = true;
    syncCard(g, i);
    Sound.play("flip");
    g.pending.push(i);
    if (g.pending.length === 2) judge(g);
  }

  function judge(g) {
    g.busy = true;
    g.attempts += 1;
    var i = g.pending[0];
    var j = g.pending[1];
    var a = g.cards[i];
    var b = g.cards[j];

    if (a.pairId === b.pairId) {
      g.pending = [];
      g.matched += 1;
      markMatched(g, i);
      markMatched(g, j);
      setFeedback("ok", "Correcto: " + PAIR_BY_ID[a.pairId].ok);
      Sound.play("match");
      g.busy = false;
      updateHud(g);
      if (g.matched === g.pairs.length) finish(g);
      return;
    }

    g.errors += 1;
    setFeedback("miss", "No forman pareja.");
    Sound.play("miss");
    a.el.classList.add("is-miss");
    b.el.classList.add("is-miss");
    updateHud(g);
    later(g, MISS_DELAY_MS, function () {
      a.open = false;
      b.open = false;
      a.el.classList.remove("is-miss");
      b.el.classList.remove("is-miss");
      syncCard(g, i);
      syncCard(g, j);
      g.pending = [];
      g.busy = false;
    });
  }

  function finish(g) {
    g.finished = true;
    pauseClock(g);
    if (window.OptiLabBridge) window.OptiLabBridge.complete({
      completed: true,
      matchedPairs: g.matched,
      totalPairs: g.pairs.length,
      attempts: g.attempts,
      errors: g.errors,
      elapsedMs: Math.round(g.elapsed),
      accuracy: Math.round((g.matched / g.attempts) * 100)
    });
    clearInterval(g.ticker);
    renderTime(g);
    Sound.play("win");
    later(g, END_DELAY_MS, function () { showSummary(g); });
  }

  /* ---------- cronómetro (se pausa si la pestaña queda oculta) ---------- */
  function nowElapsed(g) {
    return g.elapsed + (g.clockOn ? performance.now() - g.clockStart : 0);
  }

  function startClock(g) {
    g.started = true;
    if (window.OptiLabBridge) window.OptiLabBridge.start();
    resumeClock(g);
  }

  function resumeClock(g) {
    if (g.clockOn || g.finished || !g.started) return;
    g.clockOn = true;
    g.clockStart = performance.now();
  }

  function pauseClock(g) {
    if (!g.clockOn) return;
    g.elapsed += performance.now() - g.clockStart;
    g.clockOn = false;
  }

  function renderTime(g) {
    els.time.textContent = formatTime(nowElapsed(g));
  }

  /* ---------- temporizadores ligados a una partida ---------- */
  function later(g, ms, fn) {
    var id = setTimeout(function () {
      g.timers = g.timers.filter(function (t) { return t !== id; });
      if (game === g) fn();
    }, ms);
    g.timers.push(id);
  }

  function clearLater(g) {
    g.timers.forEach(function (id) { clearTimeout(id); });
    g.timers = [];
  }

  /* ---------- marcador y mensajes ---------- */
  var feedbackToken = 0;

  function setFeedback(kind, text) {
    var token = ++feedbackToken;
    els.feedback.className = "feedback is-" + kind;
    els.feedback.textContent = "";
    // Vaciar y volver a escribir fuerza a los lectores de pantalla a anunciar el texto.
    setTimeout(function () {
      if (token === feedbackToken) els.feedback.textContent = text;
    }, 30);
  }

  function updateHud(g) {
    els.pairs.textContent = g.matched + "/" + g.pairs.length;
    els.attempts.textContent = String(g.attempts);
    els.accuracy.textContent = g.attempts ? Math.round((g.matched / g.attempts) * 100) + "%" : "—";
  }

  /* ---------- resumen final y diálogo ---------- */
  var lastFocusedCard = null;

  function showSummary(g) {
    var ms = g.elapsed;
    var acc = g.attempts ? Math.round((g.matched / g.attempts) * 100) : 0;
    els.endLead.textContent = "Encontraste las " + g.pairs.length + " parejas en " + formatTime(ms) + ".";
    els.endTime.textContent = formatTime(ms);
    els.endErrors.textContent = String(g.errors);
    els.endAccuracy.textContent = acc + "%";
    els.endAttempts.textContent = String(g.attempts);

    els.recap.innerHTML = "";
    g.pairs.forEach(function (p) {
      var topic = TOPICS[p.topic];
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="recap-topic" style="background:' + topic.color + '">' + topic.name + '</span>' +
        '<span class="recap-text">' + p.a +
          ' <span class="sr-only">con</span><span class="recap-arrow" aria-hidden="true">↔</span> ' +
          p.b + '</span>';
      els.recap.appendChild(li);
    });

    lastFocusedCard = document.activeElement;
    openDialog();
  }

  function openDialog() {
    els.dialog.hidden = false;
    els.app.setAttribute("inert", "");
    els.app.setAttribute("aria-hidden", "true");
    els.again.focus();
  }

  function closeDialog(restoreFocus) {
    if (els.dialog.hidden) return;
    els.dialog.hidden = true;
    els.app.removeAttribute("inert");
    els.app.removeAttribute("aria-hidden");
    if (restoreFocus) {
      var target = els.board.querySelector(".card");
      if (target) target.focus({ preventScroll: true });
    }
  }

  /* ---------- nueva partida ---------- */
  function newGame() {
    var previous = game;
    var avoid = {};
    if (previous) {
      clearInterval(previous.ticker);
      clearLater(previous);
      previous.pairs.forEach(function (p) { avoid[p.id] = true; });
    }

    var g = createGame(pickPairs(PAIR_COUNT, avoid));
    game = g;
    renderBoard(g);
    g.ticker = setInterval(function () { renderTime(g); }, 250);
    renderTime(g);
    updateHud(g);
    setFeedback("info", "Voltea dos cartas. Si forman pareja, quedan a la vista.");

    closeDialog(false);
    els.start.hidden = true;
    els.game.hidden = false;
    els.restart.hidden = false;

    var first = els.board.querySelector(".card");
    if (first) first.focus({ preventScroll: true });
  }

  /* ---------- sonido: botón de silencio ---------- */
  function renderMute() {
    els.mute.setAttribute("aria-pressed", Sound.isMuted() ? "true" : "false");
  }

  /* ---------- teclado ---------- */
  function onBoardKey(e) {
    var target = e.target;
    if (!target || !target.classList || !target.classList.contains("card") || !game) return;
    var i = parseInt(target.getAttribute("data-index"), 10);
    var col = i % 4;
    var next = null;
    if (e.key === "ArrowRight" && col < 3) next = i + 1;
    else if (e.key === "ArrowLeft" && col > 0) next = i - 1;
    else if (e.key === "ArrowDown" && i + 4 < game.cards.length) next = i + 4;
    else if (e.key === "ArrowUp" && i - 4 >= 0) next = i - 4;
    if (next === null) return;
    e.preventDefault();
    var el = els.board.querySelector('[data-index="' + next + '"]');
    if (el) el.focus();
  }

  /* ---------- eventos ---------- */
  els.play.addEventListener("click", function () {
    Sound.unlock();
    newGame();
  });
  els.restart.addEventListener("click", function () {
    Sound.unlock();
    newGame();
  });
  els.again.addEventListener("click", function () {
    Sound.unlock();
    newGame();
  });
  els.close.addEventListener("click", function () { closeDialog(true); });

  els.mute.addEventListener("click", function () {
    Sound.setMuted(!Sound.isMuted());
    if (!Sound.isMuted()) Sound.unlock();
    renderMute();
  });

  els.board.addEventListener("keydown", onBoardKey);

  document.addEventListener("keydown", function (e) {
    if (els.dialog.hidden) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog(true);
      return;
    }
    if (e.key === "Tab") {
      var order = [els.recap, els.close, els.again];
      var idx = order.indexOf(document.activeElement);
      var next;
      if (e.shiftKey) next = idx <= 0 ? order.length - 1 : idx - 1;
      else next = idx === -1 || idx === order.length - 1 ? 0 : idx + 1;
      e.preventDefault();
      order[next].focus();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (!game) return;
    if (document.hidden) pauseClock(game);
    else if (!els.game.hidden) resumeClock(game);
  });

  renderMute();
})();

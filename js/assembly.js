/* ASSEMBLY — integration layer. Default DOM is the end-state; this file rewinds and replays. */
(function () {
  'use strict';
  var R = INSCRIBE.reduced;
  var HAS_IO = 'IntersectionObserver' in window;
  if (!HAS_IO) document.documentElement.classList.add('reduced');   // no observers: serve the judge's copy
  if (!HAS_IO) R = true;
  PRESSURE.start();

  /* ---- Generic inscription triggers ---- */
  /* clip-path'd elements have ZERO intersection area (the observer sees the clipped
     rect), so we observe each target's unclipped parent and write on the children. */
  if (!R && 'IntersectionObserver' in window) {
    var ioTargets = new Map();
    document.querySelectorAll('.w8, path[data-draw]').forEach(function (el) {
      var host = el.closest('div, section, figure, li, header, p') || el;
      if (host === el && el.parentElement) host = el.parentElement;
      if (!ioTargets.has(host)) ioTargets.set(host, []);
      ioTargets.get(host).push(el);
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var els = ioTargets.get(en.target) || [];
        io.unobserve(en.target);
        els.forEach(function (el) {
          if (el.matches('.w8')) INSCRIBE.writeOn(el);
          else INSCRIBE.drawPath(el);
        });
      });
    }, { threshold: 0.25 });
    ioTargets.forEach(function (_els, host) { io.observe(host); });
  }

  /* ---- M2: the plan enters contested, then opens under the first swipe ---- */
  var plan = document.getElementById('plan-claim');
  if (plan) {
    if (R || !HAS_IO) { plan.classList.add('is-open'); INSCRIBE.swipe(plan.querySelector('.hl')); }
    else {
      new IntersectionObserver(function (es, obs) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          obs.disconnect();
          INSCRIBE.contest(plan);
          setTimeout(function () {
            INSCRIBE.open(plan);
            INSCRIBE.swipe(plan.querySelector('.hl'));
          }, 650);
        });
      }, { threshold: 0.6 }).observe(plan);
    }
  }

  /* ---- M3: the traverse (one transform, rAF-driven, linear by construction) ---- */
  var flowSec = document.getElementById('flow');
  var strip = document.getElementById('strip');
  function traverse() {
    if (!flowSec || !strip) return;
    if (matchMedia('(max-width: 720px)').matches || R) return;
    var rect = flowSec.getBoundingClientRect();
    var span = flowSec.offsetHeight - innerHeight;
    if (span <= 0) return;
    var p = Math.min(Math.max(-rect.top / span, 0), 1);
    var max = Math.max(strip.scrollWidth - innerWidth * 0.86, 0);
    strip.style.transform = 'translateX(' + (-p * max).toFixed(1) + 'px)';
  }
  PRESSURE.onFrame(traverse);

  /* ---- M3: the dropped argument — THE DECK PERSUADES falls at Cloud ---- */
  var deck = document.getElementById('deck-claim');
  var deckTag = document.getElementById('deck-drop-tag');
  function dropDeck() {
    if (!deck || deck.dataset.dropped) return;
    deck.dataset.dropped = '1';
    INSCRIBE.collapse(deck);
    INSCRIBE.strike(deck);
    if (deckTag) deckTag.style.visibility = 'visible';
  }
  if (R) dropDeck();
  else if (flowSec) {
    PRESSURE.onFrame(function () {
      var rect = flowSec.getBoundingClientRect();
      var span = flowSec.offsetHeight - innerHeight;
      if (span > 0 && -rect.top / span > 0.45) dropDeck();
      if (matchMedia('(max-width: 720px)').matches && rect.top < innerHeight * 0.2) dropDeck();
    });
  }

  /* ---- Marks: blue is you ---- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-mark]');
    if (!btn) return;
    var line = +btn.getAttribute('data-line');
    var type = btn.getAttribute('data-mark');
    var text = (btn.textContent || '').trim().slice(0, 60);
    var pressed = btn.getAttribute('aria-pressed') === 'true';
    if (pressed) { MARKS.remove(line + ':' + type); btn.setAttribute('aria-pressed', 'false'); btn.querySelector('.mk') && btn.querySelector('.mk').classList.remove('underline-blue'); }
    else { MARKS.add({ line: line, type: type, text: text }); btn.setAttribute('aria-pressed', 'true'); var mk = btn.querySelector('.mk'); if (mk && type === 'underline') mk.classList.add('underline-blue'); }
  });
  // restore persisted marks
  MARKS.list().forEach(function (m) {
    var btn = document.querySelector('[data-mark="' + m.type + '"][data-line="' + m.line + '"]');
    if (btn) { btn.setAttribute('aria-pressed', 'true'); var mk = btn.querySelector('.mk'); if (mk && m.type === 'underline') mk.classList.add('underline-blue'); }
  });

  /* ---- M5: gutter numbers surface; carry a question; the record's discipline ---- */
  var theysay = document.getElementById('theysay');
  var QUOTES = { q1: '“The cost doesn’t pencil.”', q2: '“Our data leaves.”', q3: '“People won’t change how they work.”' };
  var carried = MARKS.state.carried;
  function applyCarry(qid, animate) {
    document.querySelectorAll('.objection').forEach(function (obj) {
      var q = obj.getAttribute('data-q');
      var claim = obj.querySelector('.claim');
      var btn = obj.querySelector('[data-carry]');
      if (q === qid) {
        claim.classList.remove('is-collapsed'); claim.classList.add('is-open');
        INSCRIBE.swipe(claim);
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = 'Carried — the judge keeps this question';
      } else {
        INSCRIBE.collapse(claim);
        if (animate) INSCRIBE.strike(claim); else { claim.dataset.struck || INSCRIBE.strike(claim); }
        btn.setAttribute('aria-pressed', 'false');
        btn.disabled = true;
        btn.textContent = 'Dropped — answered on the record';
      }
    });
    MARKS.carried(qid);
    var cq = document.getElementById('carried-q');
    if (cq) cq.textContent = QUOTES[qid] || QUOTES.q2;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-carry]');
    if (!btn || btn.disabled) return;
    applyCarry(btn.getAttribute('data-carry'), true);
  });
  if (theysay && !HAS_IO) document.documentElement.classList.add('gutter-on');
  if (theysay && HAS_IO) {
    new IntersectionObserver(function (es, obs) {
      es.forEach(function (en) {
        if (en.isIntersecting) { document.documentElement.classList.add('gutter-on'); }
        // leaving downward without a choice: the record carries the data question
        if (!en.isIntersecting && en.boundingClientRect.top < 0 && !MARKS.state.carried) {
          obs.disconnect(); applyCarry('q2', false);
        }
      });
    }, { threshold: 0.15 }).observe(theysay);
  }
  if (carried) applyCarry(carried, false);
  else if (R) applyCarry('q2', false);

  /* ---- M6: the ballot ---- */
  function renderNotes() {
    var ul = document.getElementById('notes-ledger');
    if (!ul) return;
    var list = MARKS.list();
    ul.querySelectorAll('li:not(#notes-empty)').forEach(function (li) { li.remove(); });
    var empty = document.getElementById('notes-empty');
    if (empty) empty.style.display = list.length ? 'none' : '';
    list.forEach(function (m) {
      var li = document.createElement('li');
      li.textContent = 'L-' + m.line + ' — ' + (m.type === 'check' ? 'checked' : 'underlined') + (m.text ? ' — “' + m.text + '”' : '');
      ul.appendChild(li);
    });
  }
  renderNotes();
  window.addEventListener('marks:change', renderNotes);

  var pad = document.getElementById('sign-pad');
  var signed = false;
  function verdict(restoring) {
    if (signed) return;
    signed = true;
    var v = document.getElementById('verdict-line');
    v.style.visibility = 'visible';
    var span = v.querySelector('.hl');
    if (!R && !restoring) { v.classList.add('w8'); INSCRIBE.writeOn(v).then(function () { INSCRIBE.swipe(span); }); }
    else INSCRIBE.swipe(span);
    var st = document.getElementById('final-stamp');
    if (st) st.style.visibility = 'visible';
    if (!restoring) MARKS.seal({ sig: pad ? pad.dataset.sig || 'check' : 'check' });
  }
  if (pad) {
    var drawing = false, pts = [], path = null, inkLen = 0, lastP = null;
    function svgPoint(e) {
      var r = pad.getBoundingClientRect();
      return [Math.round((e.clientX - r.left) * 2) / 2, Math.round((e.clientY - r.top) * 2) / 2];
    }
    var activeSigPtr = null;
    pad.addEventListener('pointerdown', function (e) {
      if (!e.isPrimary || (e.button && e.button !== 0)) return;   // one pen, primary button only
      drawing = true; activeSigPtr = e.pointerId; inkLen = 0;
      try { pad.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or stale pointer: draw anyway */ }
      pts = [svgPoint(e)]; lastP = pts[0];
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pad.appendChild(path);
      e.preventDefault();
    });
    pad.addEventListener('pointermove', function (e) {
      if (!drawing || !path || e.pointerId !== activeSigPtr) return;
      var p = svgPoint(e);
      var d = Math.hypot(p[0] - lastP[0], p[1] - lastP[1]);
      if (d < 2) return;
      inkLen += d; lastP = p;
      if (pts.length < 400) pts.push(p);
      path.setAttribute('d', 'M' + pts.map(function (q) { return q[0] + ' ' + q[1]; }).join(' L '));
    });
    pad.addEventListener('pointerup', function (e) {
      if (!drawing || e.pointerId !== activeSigPtr) return;
      drawing = false; activeSigPtr = null;
      if (inkLen > 120 && path) { pad.dataset.sig = path.getAttribute('d') || 'check'; verdict(); }
    });
    pad.addEventListener('pointercancel', function (e) {   // a cancelled stroke is not a signature
      if (e.pointerId !== activeSigPtr) return;
      drawing = false; activeSigPtr = null;
      if (path && inkLen <= 120) { path.remove(); path = null; }
    });
    // returning judge: restore their actual ink, do not reseal
    if (MARKS.state.verdict) {
      var mark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var storedSig = MARKS.state.sig;
      mark.setAttribute('d', (storedSig && storedSig.indexOf('M') === 0) ? storedSig : 'M 20 70 L 45 95 L 110 30');
      pad.appendChild(mark);
      verdict(true);
    }
  }
  var checkBtn = document.getElementById('sign-check-btn');
  if (checkBtn) checkBtn.addEventListener('click', function () {
    if (pad && !pad.querySelector('path')) {
      var mark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mark.setAttribute('d', 'M 20 70 L 45 95 L 110 30');
      pad.appendChild(mark);
      INSCRIBE.drawPath(mark);
    }
    verdict();
  });

  /* ---- M7: index of the record + clear ---- */
  var idx = document.getElementById('record-index');
  if (idx) {
    // canonical entries only — mark buttons carry data-line for storage, never for identity
    document.querySelectorAll('.entry[data-line]').forEach(function (el) {
      var n = el.getAttribute('data-line');
      el.setAttribute('aria-label', 'line ' + n);
      if (!el.id) el.id = 'line-' + n;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + el.id;
      var txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 64);
      a.textContent = 'L-' + (n.length < 2 ? '0' + n : n) + ' — ' + txt;
      li.appendChild(a);
      idx.appendChild(li);
    });
  }
  function resetRecordUI() {
    MARKS.clear();
    // blue marks off
    document.querySelectorAll('[data-mark][aria-pressed="true"]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); var mk = b.querySelector('.mk'); if (mk) mk.classList.remove('underline-blue'); });
    // objections rearmed: strikes lifted, claims restored, carry buttons live again
    document.querySelectorAll('.objection').forEach(function (obj) {
      var claim = obj.querySelector('.claim');
      claim.classList.remove('is-collapsed', 'is-open', 'is-swiped', 'hl', 'struck-text');
      delete claim.dataset.struck;
      claim.querySelectorAll('.strike-svg').forEach(function (s) { s.remove(); });
      var btn = obj.querySelector('[data-carry]');
      btn.disabled = false;
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = 'Carry this question to the ballot →';
    });
    var cq = document.getElementById('carried-q');
    if (cq) cq.textContent = QUOTES.q2;
    // ballot rearmed
    if (pad) { pad.querySelectorAll('path').forEach(function (p) { p.remove(); }); pad.dataset.sig = ''; }
    var v = document.getElementById('verdict-line');
    if (v) { v.style.visibility = 'hidden'; v.classList.remove('w8', 'is-written'); delete v.dataset.inscribed; var hl = v.querySelector('.hl'); if (hl) hl.classList.remove('is-swiped'); }
    var st = document.getElementById('final-stamp'); if (st) st.style.visibility = 'hidden';
    signed = false;
  }
  var clearBtn = document.getElementById('clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    document.querySelectorAll('#notes-ledger li:not(#notes-empty)').forEach(function (li) { li.classList.add('struck-blue'); });
    setTimeout(function () {
      resetRecordUI();
      document.getElementById('clear-confirm').style.visibility = 'visible';
    }, R ? 0 : 700);
  });

  /* ---- The pen retires at the closed record ---- */
  var closed = document.getElementById('closed');
  if (closed && window.PEN && PEN.retire && HAS_IO) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) PEN.retire(); });
    }, { threshold: 0.4 }).observe(closed);
  }
})();

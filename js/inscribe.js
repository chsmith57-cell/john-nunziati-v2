/* INSCRIBE — the inscription law: everything is written, nothing is rendered.
   All methods return Promises, all idempotent, all no-op to end-state under reduced motion. */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function done(el, cls) { if (cls) el.classList.add(cls); return Promise.resolve(el); }
  function chSpeed(el, def) {
    var v = el.getAttribute('data-write');
    return (v && !isNaN(+v)) ? +v : def;
  }

  /* Enter = written on. Mask wipe left→right at ch/s; linear (pens don't ease mid-word). */
  function writeOn(el) {
    if (el.dataset.inscribed) return Promise.resolve(el);
    el.dataset.inscribed = '1';
    if (reduced || !el.animate) { el.classList.add('is-written'); return done(el); }
    var chars = (el.textContent || '').length || 10;
    var speed = chSpeed(el, 34);                            // ch per second
    var ms = Math.min(Math.max((chars / speed) * 1000, 180), 2600);
    el.classList.add('is-written');
    var anim = el.animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 -2% 0 0)' }],
      { duration: ms, easing: 'linear', fill: 'both' }
    );
    // the nib caret: a 2px toner rect riding the wipe edge
    var caret = document.createElement('span');
    caret.setAttribute('aria-hidden', 'true');
    caret.style.cssText = 'position:absolute;top:8%;bottom:8%;width:2px;background:var(--toner);left:0;';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(caret);
    caret.animate([{ left: '0%' }, { left: '100%' }], { duration: ms, easing: 'linear', fill: 'forwards' });
    return anim.finished.catch(function(){}).then(function () { caret.remove(); return el; });
  }

  /* Draw an SVG path via stroke-dashoffset; duration from the length law. */
  function drawPath(path) {
    if (!path || path.dataset.inscribed) return Promise.resolve(path);
    path.dataset.inscribed = '1';
    var len = 100;
    try { len = path.getTotalLength(); } catch (e) {}
    if (reduced || !path.animate) { return done(path); }
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    var ms = Math.min(Math.max(180, len / 1.4), 900);
    var anim = path.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: ms, easing: 'linear', fill: 'forwards' }
    );
    return anim.finished.catch(function(){}).then(function () { path.style.strokeDashoffset = 0; return path; });
  }

  /* Emphasize = one highlighter pass. */
  function swipe(el) {
    el.classList.add('hl');
    void el.offsetWidth;
    el.classList.add('is-swiped');
    return Promise.resolve(el);
  }

  /* Exit = strike. The text stays legible beneath; the record never deletes. */
  function strike(el) {
    if (el.dataset.struck) return Promise.resolve(el);
    el.dataset.struck = '1';
    el.classList.add('struck-text');
    var r = el.getBoundingClientRect();
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'strike-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M 2 58 C 30 50, 72 46, 98 40');
    p.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(p);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(svg);
    var sr = document.createElement('span');
    sr.className = 'sr-only'; sr.textContent = ' (struck from contention, still on the record)';
    el.appendChild(sr);
    return drawPath(p);
  }

  /* Connect = extend: leader lines between entries. */
  function extend(path) { return drawPath(path); }

  /* Argument-state verbs (variation-axis transitions live in CSS). */
  function contest(el) { el.classList.add('is-contested'); return Promise.resolve(el); }
  function open(el)    { el.classList.remove('is-contested', 'is-collapsed'); el.classList.add('is-open'); return Promise.resolve(el); }
  function collapse(el){ el.classList.remove('is-contested', 'is-open'); el.classList.add('is-collapsed'); return Promise.resolve(el); }

  window.INSCRIBE = {
    writeOn: writeOn, drawPath: drawPath, swipe: swipe, strike: strike,
    extend: extend, contest: contest, open: open, collapse: collapse,
    get reduced() { return reduced; },
  };
})();

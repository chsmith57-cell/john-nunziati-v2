/* PRESSURE — the site's only rAF loop. Scroll velocity smoothed into one scalar. */
(function () {
  'use strict';
  var value = 0, target = 0, lastY = 0, lastT = 0, raf = 0, running = false;
  var subs = [];
  function frame(t) {
    if (!running) return;
    var dt = lastT ? Math.min((t - lastT) / 16.667, 3) : 1;
    lastT = t;
    var y = window.scrollY;
    var v = Math.abs(y - lastY) / Math.max(dt, 0.001);   // px per 60Hz-frame
    lastY = y;
    target = Math.min(v / 55, 1);                        // ~55px/frame = full pressure
    value += (target - value) * 0.12 * dt;
    if (value < 0.005) value = 0;
    document.documentElement.style.setProperty('--pressure', value.toFixed(3));
    for (var i = 0; i < subs.length; i++) subs[i](value, dt, t);
    raf = requestAnimationFrame(frame);
  }
  window.PRESSURE = {
    get value() { return value; },
    onFrame: function (fn) { subs.push(fn); return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; },
    start: function () { if (running) return; running = true; lastT = 0; lastY = window.scrollY; raf = requestAnimationFrame(frame); },
    stop: function () { running = false; cancelAnimationFrame(raf); },
  };
})();

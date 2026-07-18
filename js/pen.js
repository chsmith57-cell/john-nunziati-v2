(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var fine = false;
  var retired = false;
  var started = false;
  var frame = 0;
  var style;
  var nib;
  var x = 0;
  var y = 0;
  var targetX = 0;
  var targetY = 0;
  var angle = -35;
  var targetAngle = -35;
  var lastMove = 0;
  var visible = false;
  var reduced = false;

  try {
    fine = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
    reduced = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (ignore) {}

  function supported() {
    return fine && doc.addEventListener && window.requestAnimationFrame &&
      window.cancelAnimationFrame && window.PointerEvent &&
      window.Element && Element.prototype.closest && root.classList &&
      doc.createElementNS;
  }

  function shortestTurn(from, to) {
    return ((to - from + 540) % 360) - 180;
  }

  function now() {
    return window.performance && typeof window.performance.now === 'function' ?
      window.performance.now() : Date.now();
  }

  function draw() {
    frame = 0;
    if (!visible || retired) return;

    x += (targetX - x) * 0.35;
    y += (targetY - y) * 0.35;

    if (reduced) {
      angle = -35;
    } else {
      var turn = shortestTurn(angle, targetAngle);
      angle += Math.max(-15, Math.min(15, turn));
    }

    nib.style.transform = 'translate3d(' + (x - 7) + 'px,' +
      (y - 26) + 'px,0) rotate(' + angle + 'deg)';

    if (now() - lastMove <= 200) frame = window.requestAnimationFrame(draw);
  }

  function wake() {
    if (!frame) frame = window.requestAnimationFrame(draw);
  }

  function conceal() {
    visible = false;
    if (root.classList) root.classList.remove('pen-active');
    if (nib) {
      nib.hidden = true;
      nib.style.display = 'none';
    }
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function onPointerMove(event) {
    if (retired || event.pointerType === 'touch') return;

    var paper = event.target && event.target.closest('[data-paper]');
    if (!paper) {
      conceal();
      return;
    }

    var nextX = event.clientX;
    var nextY = event.clientY;
    if (!visible) {
      x = nextX;
      y = nextY;
      visible = true;
      nib.hidden = false;
      nib.style.display = 'block';
      root.classList.add('pen-active');
    } else if (!reduced) {
      var dx = nextX - targetX;
      var dy = nextY - targetY;
      if (dx || dy) targetAngle = Math.atan2(dy, dx) * 180 / Math.PI - 90;
    }

    targetX = nextX;
    targetY = nextY;
    lastMove = now();
    wake();
  }

  function onPointerOut(event) {
    if (!event.relatedTarget) conceal();
  }

  function start() {
    if (started || retired || !supported() || !doc.head || !doc.body) return;
    started = true;

    style = doc.createElement('style');
    style.textContent = 'html.js.pen-active [data-paper]{cursor:none}';
    doc.head.appendChild(style);

    nib = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    nib.id = 'pen-cursor';
    nib.setAttribute('viewBox', '0 0 14 26');
    nib.setAttribute('width', '14');
    nib.setAttribute('height', '26');
    nib.setAttribute('aria-hidden', 'true');
    nib.setAttribute('focusable', 'false');
    nib.hidden = true;
    nib.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;' +
      'pointer-events:none;overflow:visible;transform-origin:7px 26px;' +
      'will-change:transform;display:none';

    var path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', '#24201A');
    path.setAttribute('d', 'M2 0h10l1 14-6 12-6-12L2 0zm3 4 .5 10L7 20l1.5-6L9 4H5z');
    path.setAttribute('fill-rule', 'evenodd');
    nib.appendChild(path);
    doc.body.appendChild(nib);

    root.classList.add('js');
    doc.addEventListener('pointermove', onPointerMove, { passive: true });
    doc.addEventListener('pointerout', onPointerOut, { passive: true });
    window.addEventListener('blur', conceal);
  }

  function retire() {
    if (retired) return;
    retired = true;
    doc.removeEventListener('DOMContentLoaded', start);
    conceal();
    if (!started) return;
    doc.removeEventListener('pointermove', onPointerMove);
    doc.removeEventListener('pointerout', onPointerOut);
    window.removeEventListener('blur', conceal);
    if (nib && nib.parentNode) nib.parentNode.removeChild(nib);
    if (style && style.parentNode) style.parentNode.removeChild(style);
  }

  if (supported()) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
    else start();
  }

  window.PEN = { retire: retire };
}());

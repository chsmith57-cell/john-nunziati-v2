(function () {
  'use strict';

  var doc = document;
  var chip;
  var style;
  var returnY = null;
  var cited;
  var citeTimer = 0;

  function supported() {
    return doc.addEventListener && doc.createElement && doc.querySelectorAll &&
      window.Element && Element.prototype.closest &&
      ('classList' in Element.prototype) &&
      window.setTimeout && window.scrollTo;
  }

  function behavior() {
    try {
      if (!window.matchMedia) return 'auto';
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ?
        'auto' : 'smooth';
    } catch (ignore) {
      return 'auto';
    }
  }

  function ensureChip() {
    if (chip || !doc.body || !doc.createElement) return chip;

    style = doc.createElement('style');
    style.textContent = '#cite-chip{position:fixed;left:50%;bottom:18px;' +
      'z-index:2147483646;transform:translateX(-50%);font:inherit;' +
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;' +
      'color:inherit;cursor:pointer}#cite-chip[hidden]{display:none}' +
      '#cite-chip:focus-visible{outline:2px solid currentColor;outline-offset:3px}';
    doc.head.appendChild(style);

    chip = doc.createElement('button');
    chip.id = 'cite-chip';
    chip.type = 'button';
    chip.textContent = 'RETURN TO THE BLOCK ?';
    chip.hidden = true;
    chip.addEventListener('click', back);
    doc.body.appendChild(chip);
    return chip;
  }

  function findLine(line) {
    if (!doc.querySelectorAll) return null;
    var wanted = String(line);
    var lines = doc.querySelectorAll('[data-line]');
    for (var i = 0; i < lines.length; i += 1) {
      if (lines[i].getAttribute('data-line') === wanted) return lines[i];
    }
    return null;
  }

  function go(line) {
    if (!supported()) return;
    var target = findLine(line);
    var button = ensureChip();
    if (!target || !button || !target.scrollIntoView) return;

    returnY = typeof window.scrollY === 'number' ? window.scrollY : window.pageYOffset || 0;
    try {
      target.scrollIntoView({ behavior: behavior(), block: 'center' });
    } catch (ignore) {
      target.scrollIntoView();
    }

    if (citeTimer) window.clearTimeout(citeTimer);
    if (cited && cited !== target) cited.classList.remove('cited');
    cited = target;
    cited.classList.add('cited');
    citeTimer = window.setTimeout(function () {
      cited.classList.remove('cited');
      cited = null;
      citeTimer = 0;
    }, 1200);

    button.hidden = false;
  }

  function back() {
    if (chip) chip.hidden = true;
    if (returnY === null) return;

    var y = returnY;
    returnY = null;
    try {
      window.scrollTo({ top: y, left: 0, behavior: behavior() });
    } catch (ignore) {
      window.scrollTo(0, y);
    }
  }

  function onClick(event) {
    var anchor = event.target && event.target.closest &&
      event.target.closest('a[data-cite]');
    if (!anchor) return;
    event.preventDefault();
    go(Number(anchor.getAttribute('data-cite')));
  }

  function onKeyDown(event) {
    if ((event.key === 'Escape' || event.keyCode === 27) && chip && !chip.hidden) {
      event.preventDefault();
      back();
    }
  }

  if (supported()) {
    doc.addEventListener('click', onClick);
    doc.addEventListener('keydown', onKeyDown);
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ensureChip);
    else ensureChip();
  }

  window.CITE = { go: go, back: back };
}());

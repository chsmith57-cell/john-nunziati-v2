/* MARKS — the judge's ledger. Blue is you. Persists to localStorage; degrades to memory, silently. */
(function () {
  'use strict';
  var KEY = 'nr.record.v1';
  var mem = null;
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { mem = null; }
    if (!mem || typeof mem !== 'object') mem = { marks: [], carried: null, sig: null, verdict: false };
    if (!Array.isArray(mem.marks)) mem.marks = [];
    return mem;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* memory-only, silently */ }
    try { window.dispatchEvent(new CustomEvent('marks:change', { detail: mem })); } catch (e) {}
  }
  window.MARKS = {
    open: function () { return load(); },
    add: function (m) {
      var s = load();
      var id = m.line + ':' + m.type;
      for (var i = 0; i < s.marks.length; i++) if (s.marks[i].id === id) return id;   // idempotent
      s.marks.push({ id: id, line: m.line, type: m.type, text: m.text || '' });
      save(); return id;
    },
    remove: function (id) {
      var s = load();
      s.marks = s.marks.filter(function (m) { return m.id !== id; });
      save();
    },
    list: function () { return load().marks.slice(); },
    carried: function (qid) { var s = load(); s.carried = qid; save(); },
    seal: function (o) { var s = load(); s.sig = (o && o.sig) || null; s.verdict = true; save(); },
    clear: function () { mem = { marks: [], carried: null, sig: null, verdict: false }; save(); },
    get state() { return load(); },
  };
})();

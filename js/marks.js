/* MARKS — the judge's ledger. Blue is you. Persists to localStorage; degrades to memory, silently. */
(function () {
  'use strict';
  var KEY = 'nr.record.v1';
  var mem = null;
  var TYPES = { check: 1, underline: 1 };
  var CARRY = { q1: 1, q2: 1, q3: 1 };
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { mem = null; }
    if (!mem || typeof mem !== 'object') mem = {};
    // schema validation: discard invalid records individually, never trust the parse
    var marks = Array.isArray(mem.marks) ? mem.marks.filter(function (m) {
      return m && TYPES[m.type] && typeof m.line === 'number' && isFinite(m.line) && m.line > 0 && m.line < 200;
    }).map(function (m) { return { id: m.line + ':' + m.type, line: m.line, type: m.type, text: String(m.text || '').slice(0, 80) }; }) : [];
    mem = {
      marks: marks,
      carried: CARRY[mem.carried] ? mem.carried : null,
      sig: (typeof mem.sig === 'string' && mem.sig.length < 6000) ? mem.sig : null,
      verdict: mem.verdict === true,
    };
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

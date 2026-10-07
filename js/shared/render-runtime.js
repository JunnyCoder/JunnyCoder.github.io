// Small bounded caches and cancellable UI jobs; independent of editor state.
window.EditorRuntime = (() => {
  function cache({entries = 256, bytes = 2 * 1024 * 1024} = {}) {
    const values = new Map();
    let used = 0;
    function remove(key) { const item = values.get(key); if (item) { used -= item.size; values.delete(key); } }
    return {
      get(key) { const item = values.get(key); if (!item) return; values.delete(key); values.set(key, item); return item.value; },
      set(key, value, size = (String(key).length + String(value).length) * 2) {
        remove(key);
        if (size > bytes) return value;
        values.set(key, {value, size}); used += size;
        while (values.size > entries || used > bytes) remove(values.keys().next().value);
        return value;
      },
      clear() { values.clear(); used = 0; },
      get size() { return values.size; },
      get bytes() { return used; }
    };
  }
  function job(run, delay = 180) {
    let timer = null, revision = 0;
    function cancel() { clearTimeout(timer); timer = null; revision++; }
    function flush() { if (timer === null) return; clearTimeout(timer); timer = null; run(revision); }
    return {
      schedule() { cancel(); const current = revision; timer = setTimeout(() => { timer = null; if (current === revision) run(current); }, delay); },
      cancel, flush,
      get pending() { return timer !== null; }
    };
  }
  // Cache lookups without retaining deleted DOM. Mutation records invalidate
  // synchronously on the next lookup, including edits made before callbacks run.
  function index(root, attribute) {
    let dirty = true;
    const nodes = new Map();
    const observer = new MutationObserver(() => { dirty = true; nodes.clear(); });
    observer.observe(root, {subtree: true, childList: true, attributes: true, attributeFilter: [attribute]});
    return {
      get(id) {
        if (observer.takeRecords().length) dirty = true;
        if (dirty) { nodes.clear(); root.querySelectorAll('[' + attribute + ']').forEach(node => nodes.set(node.getAttribute(attribute), node)); dirty = false; }
        return nodes.get(id);
      },
      clear() { nodes.clear(); dirty = true; },
      disconnect() { observer.disconnect(); nodes.clear(); }
    };
  }
  return {cache, job, index};
})();

// Canonical source serialization and bounded snapshot history. Generated preview
// pages are deliberately excluded from both persistence and mutation tracking.
window.PdfDocumentState = {create(root) {
  let html = null, allDirty = true;
  let blocks = new WeakMap();
  const metadata = state => JSON.stringify([state.settings, state.title, state.importedStyles]);
  const observer = new MutationObserver(invalidate);
  observer.observe(root, {subtree: true, childList: true, attributes: true, characterData: true});
  function invalidate(records) {
    if (!records.length) return;
    html = null;
    records.forEach(record => {
      let block = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (block === root) { allDirty = true; return; }
      while (block && block.parentElement !== root) block = block.parentElement;
      if (block) blocks.delete(block);
    });
  }
  function refresh() {
    invalidate(observer.takeRecords());
    if (allDirty) { blocks = new WeakMap(); allDirty = false; }
  }
  function same(a, b) { return Boolean(a && a.html === b.html && metadata(a) === metadata(b)); }
  function trim(history, maxBytes = 16 * 1024 * 1024) {
    let bytes = history.reduce((sum, state) => sum + (state.html.length + metadata(state).length) * 2, 0);
    while (history.length > 1 && (history.length > 30 || bytes > maxBytes)) bytes -= (history[0].html.length + metadata(history.shift()).length) * 2;
  }
  return {
    html(serialize) { refresh(); if (html === null) html = serialize(); return html; },
    block(node) { refresh(); let value = blocks.get(node); if (value === undefined) { value = node.outerHTML; blocks.set(node, value); } return value; },
    same, trim,
    clear() { html = null; blocks = new WeakMap(); allDirty = true; }
  };
}};

// Own iframe lifecycle and frame-coalesced scrolling, separate from import choices.
window.HtmlImportPreview = {create(frames) {
  let position = {ratio: 0, x: 0}, syncing = false, frameJob = null;
  const generations = new WeakMap();
  function metrics(frame) {
    const doc = frame.contentDocument;
    if (!doc) return null;
    const node = doc.scrollingElement || doc.documentElement;
    return {node, max: Math.max(0, Math.max(node.scrollHeight, doc.body?.scrollHeight || 0) - (frame.clientHeight || 270)), maxX: Math.max(0, node.scrollWidth - (frame.clientWidth || 500))};
  }
  function restore() {
    syncing = true;
    frames.forEach(frame => { const m = metrics(frame); if (m) { m.node.scrollTop = position.ratio * m.max; m.node.scrollLeft = position.x * m.maxX; } });
    requestAnimationFrame(() => { syncing = false; });
  }
  function scheduleRestore() { if (frameJob !== null) return; frameJob = requestAnimationFrame(() => { frameJob = null; restore(); }); }
  function write(frame, html) { generations.set(frame, (generations.get(frame) || 0) + 1); frame.srcdoc = html; }
  frames.forEach(frame => frame.addEventListener('load', () => {
    const doc = frame.contentDocument, generation = generations.get(frame);
    if (!doc) return;
    const valid = () => frame.contentDocument === doc && generations.get(frame) === generation;
    restore();
    doc.addEventListener('scroll', () => {
      if (syncing || !valid()) return;
      const m = metrics(frame); if (!m) return;
      position = {ratio: m.max ? m.node.scrollTop / m.max : 0, x: m.maxX ? m.node.scrollLeft / m.maxX : 0};
      scheduleRestore();
    }, true);
    const onReady = () => { if (valid()) scheduleRestore(); };
    frame.contentWindow?.addEventListener('resize', onReady);
    doc.fonts?.ready.then(onReady);
    doc.querySelectorAll('img').forEach(img => img.addEventListener('load', onReady, {once: true}));
  }));
  function cancel() { if (frameJob !== null) cancelAnimationFrame(frameJob); frameJob = null; syncing = false; }
  return {write, restore, scheduleRestore, cancel};
}};

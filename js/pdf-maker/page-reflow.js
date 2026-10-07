// Reuse only complete pages before the affected block. A block split across
// pages pulls the reflow boundary back to its first fragment. Global settings,
// document replacement, TOC/cover and print always retain the full-render path.
window.PdfPageReflow = {create(container, sourceState) {
  let previous = null;
  function begin(blocks, context, changedId, pending) {
    const keys = blocks.map(block => sourceState.block(block) + (pending && (block.dataset.elementId === pending.id || Array.from(block.querySelectorAll('[data-element-id]')).some(node => node.dataset.elementId === pending.id)) ? JSON.stringify(pending) : ''));
    let start = 0, keep = 0;
    const pages = Array.from(container.querySelectorAll('.pdf-page'));
    if (changedId && previous?.context === context && !blocks.some(block => block.matches('.cover-page,.toc-wrapper')) && pages.length) {
      let dirty = blocks.findIndex(block => block.dataset.blockId === changedId);
      if (dirty < 0) dirty = 0;
      for (let i = 0; i < Math.max(keys.length, previous.keys.length); i++) if (keys[i] !== previous.keys[i]) { dirty = Math.min(dirty, i); break; }
      const id = blocks[dirty]?.dataset.blockId;
      let pageIndex = id ? pages.findIndex(page => Array.from(page.querySelectorAll('[data-block-id]')).some(node => node.dataset.blockId === id)) : 0;
      if (pageIndex < 0) pageIndex = 0;
      // The first block on that page may continue from an earlier page.
      while (pageIndex > 0) {
        const first = pages[pageIndex].querySelector('[data-block-id]')?.dataset.blockId;
        const earlier = pages.slice(0, pageIndex).findIndex(page => Array.from(page.querySelectorAll('[data-block-id]')).some(node => node.dataset.blockId === first));
        if (earlier < 0) break;
        pageIndex = earlier;
      }
      const first = pages[pageIndex]?.querySelector('[data-block-id]')?.dataset.blockId;
      const index = blocks.findIndex(block => block.dataset.blockId === first);
      if (index >= 0) { start = index; keep = pageIndex; }
    }
    pages.slice(keep).forEach(page => page.remove());
    if (!keep) container.replaceChildren();
    previous = {keys, context};
    return {start, scaled: pages.slice(0, keep).reduce((sum, page) => sum + page.querySelectorAll('.scaled-block').length, 0)};
  }
  return {begin, reset() { previous = null; }};
}};

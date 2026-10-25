// Compatibility boundary: keep existing local drafts/history available.
window.EditorTransfer = (() => {
  const key = 'pdfMakerTransfer', historyKey = 'mdeditor.history.v1';
  return {
    historyKey,
    send(markdown) { localStorage.setItem(key, markdown); },
    peek() { return localStorage.getItem(key); },
    acknowledge(markdown) { if (localStorage.getItem(key) === markdown) localStorage.removeItem(key); },
    historyChanged(event) { return event.key === historyKey || event.key === null; },
    history() {
      try {
        const entries = JSON.parse(localStorage.getItem(historyKey) || '[]');
        return Array.isArray(entries) ? entries.filter(item => item && typeof item.content === 'string' && Number.isFinite(Number(item.ts)))
          .map(item => ({...item, ts: Number(item.ts)})) : [];
      } catch { return []; }
    }
  };
})();

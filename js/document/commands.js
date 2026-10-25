// A command plans against the current source before the adapter records history.
// CodeMirror and DOM authors deliberately keep their own undo implementations.
window.DocumentCommands = {
  setCodeLanguage(target, language, adapter) {
    const change = adapter.planCodeLanguage(target, SharedCodeBlocks.resolve(language));
    if (!change) return false;
    adapter.commit(change);
    return true;
  }
};

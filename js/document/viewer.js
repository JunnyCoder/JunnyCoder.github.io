// A third consumer of the document engine. No editor, history or storage imports.
window.DocumentViewer = {create({source, container, fit = () => {}}) {
  let assets = null, state = null, generation = 0, ready = false;
  const doc = container.ownerDocument;
  function render(print = false) {
    if (!state) return {pages: [], scaled: 0};
    container.style.zoom = '1';
    const result = DocumentRenderer.render({source, container, settings: state.settings,
      importedStyles: state.importedStyles, title: state.title});
    if (!print) fit(result.pages);
    return result;
  }
  function dispose() {
    generation++; ready = false; state = null;
    assets?.dispose(); assets = null;
    source.replaceChildren(); container.replaceChildren();
  }
  return {
    get ready() { return ready; }, render, dispose,
    async load(project) {
      dispose();
      const ticket = generation;
      const parsed = DocumentProject.validate(project), currentAssets = DocumentAssets.memory();
      assets = currentAssets;
      try {
        await currentAssets.load(parsed.assets);
        if (ticket !== generation) throw Error('문서가 닫혔습니다.');
        state = parsed.state;
        source.innerHTML = DocumentContent.safeHtml(state.html);
        let serial = 0;
        DocumentContent.normalizeSource(source, prefix => prefix + '-view-' + (++serial));
        DocumentContent.renderMath(source);
        await currentAssets.restore(source);
        if (ticket !== generation) throw Error('문서가 닫혔습니다.');
        render();
        const resources = await DocumentResources.ready(container);
        if (ticket !== generation) throw Error('문서가 닫혔습니다.');
        if (resources.failed.length || resources.failedBackgrounds) throw Error('문서의 이미지를 불러오지 못했습니다. 다시 시도해주세요.');
        const result = render();
        if (!result.pages.length) throw Error('문서 내용이 비어 있습니다.');
        ready = true; doc.title = state.title;
        return result;
      } catch (error) {
        currentAssets.dispose();
        if (ticket === generation) { ready = false; state = null; source.replaceChildren(); container.replaceChildren(); }
        throw error;
      }
    },
    print() {
      if (!ready) return false;
      render(true);
      try { doc.defaultView.print(); } finally { fit(Array.from(container.querySelectorAll('.pdf-page'))); }
      return true;
    }
  };
}};

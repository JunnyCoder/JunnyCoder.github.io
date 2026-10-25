// Authoring controls; read-only consumers load code-blocks.js only.
window.CodeControls = (() => {
  const {languages, resolve, labels, format} = SharedCodeBlocks;
  const decorated = new WeakMap();
  function decorate(root, onChange) {
    root.querySelectorAll('pre.shared-code-block').forEach(pre => {
      const document = pre.ownerDocument;
      pre.codeChangeHandler=onChange;
      const stamp=JSON.stringify([pre.dataset.codeLanguage,pre.dataset.style,pre.dataset.designStart,pre.dataset.designOutputFrom,pre.dataset.codeLineOffset,pre.querySelector(':scope > code')?.innerHTML]);
      if(decorated.get(pre)===stamp && pre.querySelector(':scope > .code-block-controls'))return;
      format(pre);
      pre.querySelector(':scope > .code-block-controls')?.remove();
      const controls = document.createElement('span');
      controls.className = 'code-block-controls';
      controls.contentEditable = 'false';
      const select = document.createElement('select');
      select.className = 'code-language-select';
      select.setAttribute('aria-label', '코드 블록 언어');
      languages().forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = labels[id] || id;
        select.append(option);
      });
      select.value = resolve(pre.dataset.codeLanguage);
      select.addEventListener('change', () => pre.codeChangeHandler(pre, select.value));
      const printLabel = document.createElement('span');
      printLabel.className = 'code-language-print';
      printLabel.textContent = labels[select.value] || select.value;
      controls.append(select, printLabel);
      ['click', 'dblclick', 'mousedown', 'keydown'].forEach(type => controls.addEventListener(type, event => event.stopPropagation()));
      pre.append(controls);
      decorated.set(pre,JSON.stringify([pre.dataset.codeLanguage,pre.dataset.style,pre.dataset.designStart,pre.dataset.designOutputFrom,pre.dataset.codeLineOffset,pre.querySelector(':scope > code')?.innerHTML]));
    });
  }
  return {attach: decorate};
})();

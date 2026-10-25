// The homepage owns modal controls; the iframe owns document layout and resources.
(() => {
  const dialog = document.getElementById('resume-dialog');
  const content = document.getElementById('resume-content');
  const print = document.getElementById('resume-print');
  let language = 'ko', frame = null, trigger = null;
  function release() {
    frame?.contentWindow?.ResumeViewer?.dispose();
    frame?.remove(); frame = null; print.disabled = true;
  }
  function show(lang) {
    release(); language = lang === 'en' ? 'en' : 'ko';
    dialog.querySelectorAll('[data-resume-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.resumeLanguage === language)));
    frame = document.createElement('iframe');
    frame.title = language === 'ko' ? '한국어 이력서' : 'English résumé';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals allow-popups');
    frame.src = 'tools/resume-viewer.html?v=20261026-layout-2&lang=' + language;
    content.replaceChildren(frame);
  }
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'resume-viewer' || event.data.language !== language) return;
    if (event.data.close) { dialog.close(); return; }
    print.disabled = event.data.ready !== true;
  });
  document.querySelectorAll('[data-resume-open]').forEach(button => button.addEventListener('click', () => {
    trigger = button; dialog.showModal(); document.body.classList.add('modal-open'); show(language);
  }));
  dialog.querySelectorAll('[data-resume-language]').forEach(button => button.addEventListener('click', () => show(button.dataset.resumeLanguage)));
  document.getElementById('resume-close').onclick = () => dialog.close();
  print.onclick = () => { if (!print.disabled) frame?.contentWindow?.ResumeViewer?.print(); };
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { release(); document.body.classList.remove('modal-open'); trigger?.focus(); });
})();

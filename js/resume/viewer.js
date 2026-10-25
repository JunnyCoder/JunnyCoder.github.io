(() => {
  const language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ko';
  const status = document.getElementById('viewer-status'), container = document.getElementById('resume-pages');
  document.documentElement.lang = language;
  const notify = state => parent.postMessage({type: 'resume-viewer', language, ...state}, location.origin);
  function fit(pages) {
    container.style.zoom = String(Math.min(1, Math.max(.15, (document.documentElement.clientWidth - 24) / (pages[0]?.offsetWidth || 794))));
  }
  const viewer = DocumentViewer.create({source: document.getElementById('resume-source'), container, fit});
  const file = '../assets/resume/resume_' + language + '.jpdf.json';
  const text = {
    loading: language === 'ko' ? '이력서를 불러오는 중입니다…' : 'Loading résumé…',
    missing: language === 'ko' ? '이력서를 준비 중입니다.' : 'The résumé is being prepared.',
    error: language === 'ko' ? '이력서를 불러오지 못했습니다. 다시 시도해주세요.' : 'Unable to load the résumé. Please try again.'
  };
  async function load() {
    status.hidden = false; status.textContent = text.loading; notify({ready: false});
    try {
      const response = await fetch(file, {cache: 'no-store'});
      if (response.status === 404) { status.textContent = text.missing; notify({ready: false, missing: true}); return; }
      if (!response.ok) throw Error('Unable to fetch project');
      const length = Number(response.headers.get('content-length'));
      if (length > DocumentProject.maxBytes) throw Error('Project too large');
      const project = DocumentProject.parse(await response.text());
      const result = await viewer.load(project);
      status.hidden = true; notify({ready: true, pages: result.pages.length});
    } catch (error) {
      viewer.dispose(); status.hidden = false; status.textContent = text.error;
      const retry = document.createElement('button'); retry.type = 'button';
      retry.textContent = language === 'ko' ? '다시 시도' : 'Retry'; retry.onclick = load; status.append(retry);
      notify({ready: false, error: true}); console.error(error);
    }
  }
  window.ResumeViewer = viewer;
  window.addEventListener('pagehide', () => viewer.dispose());
  window.addEventListener('resize', () => fit(Array.from(container.querySelectorAll('.pdf-page'))));
  window.addEventListener('beforeprint', () => { if (viewer.ready) viewer.render(true); });
  window.addEventListener('afterprint', () => fit(Array.from(container.querySelectorAll('.pdf-page'))));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') notify({close: true}); });
  load();
})();

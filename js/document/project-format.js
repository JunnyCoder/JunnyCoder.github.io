// Version 1 is shared by PDF Maker and the read-only viewer. No persistence here.
window.DocumentProject = (() => {
  const maxBytes = 150 * 1024 * 1024;
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function normalizeState(state) {
    if (!object(state) || typeof state.html !== 'string' || (state.settings !== undefined && !object(state.settings)))
      throw Error('문서의 저장 형식이 올바르지 않습니다.');
    const styles = state.importedStyles;
    if (state.title !== undefined && typeof state.title !== 'string') throw Error('작업 파일의 제목이 올바르지 않습니다.');
    if (styles && (!object(styles) || !Array.isArray(styles.css) || styles.css.some(css => typeof css !== 'string') ||
        (styles.attributes && (!object(styles.attributes) || Object.values(styles.attributes).some(value => typeof value !== 'string'))) ||
        (styles.missing && (!Array.isArray(styles.missing) || styles.missing.some(value => typeof value !== 'string')))))
      throw Error('작업 파일의 문서 스타일 정보가 올바르지 않습니다.');
    return {...state, settings: DocumentSettings.normalize(state.settings || {}, DocumentSettings.defaults, state.title),
      title: state.title || 'pdf-export', importedStyles: styles || {css: [], attributes: {}, missing: [], available: false}};
  }
  function validate(project) {
    if (!object(project) || project.format !== 'junny-pdf-project' || project.version !== 1 ||
        !object(project.state) || !object(project.state.settings)) throw Error('지원하는 PDF Maker 작업 파일이 아닙니다.');
    const state = normalizeState(project.state);
    DocumentAssets.validateList(project.assets);
    const root = document.createElement('div'); root.innerHTML = state.html;
    const ids = new Set(project.assets.map(asset => asset.id));
    root.querySelectorAll('img[data-image-asset]').forEach(image => {
      if (!ids.has(image.dataset.imageAsset)) throw Error('작업 파일에 필요한 이미지가 없습니다.');
    });
    return {format: project.format, version: 1, assets: project.assets, state};
  }
  function parse(text) {
    if (new Blob([text]).size > maxBytes) throw Error('150MB 이하의 작업 파일을 선택해주세요.');
    let value;
    try { value = JSON.parse(text); } catch { throw Error('작업 파일의 JSON을 읽지 못했습니다.'); }
    return validate(value);
  }
  function serialize(state, assets) {
    const project = validate({format: 'junny-pdf-project', version: 1, state, assets});
    const blob = new Blob([JSON.stringify(project)], {type: 'application/json'});
    if (blob.size > maxBytes) throw Error('작업 파일은 150MB까지 저장할 수 있습니다. 이미지나 문서 크기를 줄여주세요.');
    return blob;
  }
  return {maxBytes, normalizeState, validate, parse, serialize};
})();

// Image validation, display and transient resources; never opens a database.
window.DocumentAssets = (() => {
  function probe(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => done(false), timeout);
      function done(success) {
        clearTimeout(timer); image.onload = image.onerror = null;
        if (success && image.naturalWidth) resolve({ width: image.naturalWidth, height: image.naturalHeight });
        else reject(Error('이미지를 불러오지 못했습니다. 파일 또는 URL을 확인해주세요.'));
      }
      image.onload = () => done(true); image.onerror = () => done(false); image.src = url;
    });
  }
  async function validateFile(file) {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw Error('PNG, JPG, WebP 이미지 파일을 선택해주세요.');
    if (file.size > 20 * 1024 * 1024) throw Error('이미지는 파일당 20MB까지 추가할 수 있습니다. 더 작은 파일을 선택해주세요.');
    const bytes = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = () => reject(Error('이미지 파일을 읽지 못했습니다.')); reader.readAsArrayBuffer(file.slice(0, 12));
    });
    const valid = file.type === 'image/png' ? [137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte) :
      file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 :
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (!valid) throw Error('파일 내용이 지원하는 이미지 형식과 다릅니다.');
  }
  function snapshotHtml(html, document = window.document) {
    const root = document.createElement('div'); root.innerHTML = html;
    root.querySelectorAll('img[data-image-asset]').forEach(image => { image.removeAttribute('src'); image.removeAttribute('srcset'); });
    root.querySelectorAll('[data-image-failed]').forEach(image => image.removeAttribute('data-image-failed'));
    return root.innerHTML;
  }
  function httpUrl(value) {
    let url;
    try { url = new URL(value.trim()); } catch { throw Error('http:// 또는 https://로 시작하는 이미지 URL을 입력해주세요.'); }
    if (!['https:', 'http:'].includes(url.protocol)) throw Error('http:// 또는 https:// 이미지 URL만 사용할 수 있습니다.');
    return url.href;
  }
  function decorate(root) {
    const images = [...root.querySelectorAll('img[data-pdf-image]')];
    if (root.matches?.('img[data-pdf-image]')) images.unshift(root);
    images.forEach(image => {
      const width = Number(image.dataset.imageWidth);
      image.style.setProperty('width', (Number.isFinite(width) ? Math.max(1, Math.min(100, width)) : 100) + '%', 'important');
      image.style.setProperty('height', 'auto', 'important');
      image.style.setProperty('display', 'block', 'important');
      image.style.setProperty('max-width', '100%', 'important');
      image.style.setProperty('margin-left', image.dataset.imageAlign === 'left' ? '0' : 'auto', 'important');
      image.style.setProperty('margin-right', image.dataset.imageAlign === 'right' ? '0' : 'auto', 'important');
    });
  }
  function validateList(assets) {
    if (!Array.isArray(assets) || assets.length > 100) throw Error('작업 파일의 이미지 목록이 올바르지 않습니다.');
    const ids = new Set(); let bytes = 0;
    for (const asset of assets) {
      if (!asset || typeof asset.id !== 'string' || !asset.id || ids.has(asset.id) ||
          typeof asset.data !== 'string' || asset.data.length > 28*1024*1024 ||
          !['image/png','image/jpeg','image/webp'].includes(asset.type)) throw Error('작업 파일의 이미지 정보가 올바르지 않습니다.');
      ids.add(asset.id); bytes += Math.floor(asset.data.length * 3 / 4);
      if (bytes > 110*1024*1024) throw Error('작업 파일의 이미지 용량이 너무 큽니다.');
    }
  }
  function decode(asset) {
    let binary;
    try { binary = atob(asset.data); } catch { throw Error('작업 파일의 이미지가 손상됐습니다.'); }
    return new File([Uint8Array.from(binary, char => char.charCodeAt(0))], typeof asset.name === 'string' ? asset.name : 'image', {type: asset.type});
  }
  async function restore(root, urlFor) {
    await Promise.all(Array.from(root.querySelectorAll('img[data-image-asset]')).map(async image => {
      const id = image.dataset.imageAsset;
      try {
        const url = await urlFor(id);
        if (!url) throw Error('Missing image');
        if (root.contains(image) && image.dataset.imageAsset === id) {
          if (image.getAttribute('src') !== url) image.src = url;
          delete image.dataset.imageFailed;
        }
      } catch { if (root.contains(image) && image.dataset.imageAsset === id) image.dataset.imageFailed = 'true'; }
    }));
  }
  function memory() {
    const urls = new Map(); let disposed = false;
    function dispose() { disposed = true; urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); }
    return {
      async load(assets) {
        validateList(assets);
        try {
          for (const asset of assets) {
            const file = decode(asset); await validateFile(file);
            if (disposed) throw Error('문서가 닫혔습니다.');
            const url = URL.createObjectURL(file); urls.set(asset.id, url);
            await probe(url);
            if (disposed) throw Error('문서가 닫혔습니다.');
          }
        } catch (error) { dispose(); throw error; }
      },
      restore(root) { return restore(root, id => urls.get(id)); }, dispose
    };
  }
  return {probe, validateFile, validateList, decode, snapshotHtml, httpUrl, decorate, restore, memory};
})();

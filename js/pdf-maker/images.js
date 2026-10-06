// Persistent binary image assets; document snapshots contain asset IDs, never Blob URLs.
window.PdfImages = (() => {
  const urls = new Map();
  let database;
  const databaseReady = () => database ||= new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(Error('이 브라우저에서 이미지 저장을 사용할 수 없습니다. 이미지 URL을 이용해주세요.')); return; }
    const request = indexedDB.open('pdf-maker-images', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images', { keyPath: 'id' });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = null; }; resolve(request.result); };
    request.onblocked = () => { database = null; reject(Error('다른 탭이 이미지 저장소를 사용 중입니다. 다른 PDF Maker 탭을 닫고 다시 시도해주세요.')); };
    request.onerror = () => { database = null; reject(Error('이미지 저장소를 열지 못했습니다.')); };
  });
  async function access(mode, action) {
    const db = await databaseReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('images', mode);
      const request = action(transaction.objectStore('images'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(Error('이미지를 저장하거나 불러오지 못했습니다. 저장 공간을 확인해주세요.'));
    });
  }
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
  async function fileAsset(file) {
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
    const url = URL.createObjectURL(file);
    try {
      const dimensions = await probe(url);
      const id = 'image-' + (window.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2));
      await access('readwrite', store => store.put({ id, blob: file, name: file.name }));
      urls.set(id, url);
      return { id, url, name: file.name, ...dimensions };
    } catch (error) { URL.revokeObjectURL(url); throw error; }
  }
  async function remove(id) {
    try { await access('readwrite', store => store.delete(id)); } catch { /* Original error is shown by the editor. */ }
    if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
  }
  function snapshotHtml(html) {
    const root = document.createElement('div'); root.innerHTML = html;
    root.querySelectorAll('img[data-image-asset]').forEach(image => { image.removeAttribute('src'); image.removeAttribute('srcset'); });
    root.querySelectorAll('[data-image-failed]').forEach(image => image.removeAttribute('data-image-failed'));
    return root.innerHTML;
  }
  async function restore(root) {
    await Promise.all(Array.from(root.querySelectorAll('img[data-image-asset]')).map(async image => {
      const id = image.dataset.imageAsset;
      try {
        if (!urls.has(id)) {
          const record = await access('readonly', store => store.get(id));
          if (!record?.blob) throw Error('Missing image');
          // A concurrent restore may already have created the URL.
          if (!urls.has(id)) urls.set(id, URL.createObjectURL(record.blob));
        }
        if (root.contains(image) && image.dataset.imageAsset === id && image.getAttribute('src') !== urls.get(id)) { image.src = urls.get(id); delete image.dataset.imageFailed; }
      } catch {
        if (root.contains(image) && image.dataset.imageAsset === id) image.dataset.imageFailed = 'true';
      }
    }));
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
  function releaseUnused(htmls) {
    const retained = new Set();
    htmls.forEach(html => { for (const match of html.matchAll(/data-image-asset="([^"]+)"/g)) retained.add(match[1]); });
    for (const [id, url] of urls) if (!retained.has(id)) { URL.revokeObjectURL(url); urls.delete(id); }
  }
  async function exportAssets(html) {
    const root=document.createElement('div');root.innerHTML=html;
    const ids=[...new Set(Array.from(root.querySelectorAll('img[data-image-asset]')).map(image=>image.dataset.imageAsset))];
    if(ids.length>100) throw Error('작업 파일은 업로드 이미지 100개까지 저장할 수 있습니다.');
    const assets=[];let totalBytes=0;
    for (const id of ids) {
      const record=await access('readonly',store=>store.get(id));
      if (!record?.blob) throw Error('저장된 이미지를 찾을 수 없습니다. 이미지를 다시 추가한 뒤 작업 파일을 저장해주세요.');
      totalBytes+=record.blob.size;
      if(totalBytes>110*1024*1024)throw Error('작업 파일의 이미지 용량이 너무 큽니다. 이미지 크기를 줄여주세요.');
      const data=await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('이미지를 내보내지 못했습니다.'));reader.readAsDataURL(record.blob);
      });
      assets.push({id,name:record.name,type:record.blob.type,data});
    }
    return assets;
  }
  async function importAssets(assets) {
    if (!Array.isArray(assets) || assets.length>100) throw Error('작업 파일의 이미지 목록이 올바르지 않습니다.');
    const mapping=new Map();
    try {
      for (const asset of assets) {
        if (!asset || typeof asset.id!=='string' || mapping.has(asset.id) || typeof asset.data!=='string' || asset.data.length>28*1024*1024 || !['image/png','image/jpeg','image/webp'].includes(asset.type)) throw Error('작업 파일의 이미지 정보가 올바르지 않습니다.');
        let binary;try {binary=atob(asset.data);}catch {throw Error('작업 파일의 이미지가 손상됐습니다.');}
        const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
        const file=new File([bytes],typeof asset.name==='string'?asset.name:'image',{type:asset.type});
        const stored=await fileAsset(file);mapping.set(asset.id,stored.id);
      }
      return mapping;
    } catch(error) {await Promise.all(Array.from(mapping.values()).map(remove));throw error;}
  }
  return { fileAsset, probe, snapshotHtml, restore, remove, httpUrl, decorate, releaseUnused, exportAssets, importAssets };
})();

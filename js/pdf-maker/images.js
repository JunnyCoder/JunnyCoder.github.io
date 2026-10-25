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
  const {probe, snapshotHtml, httpUrl, decorate} = DocumentAssets;
  async function fileAsset(file) {
    await DocumentAssets.validateFile(file);
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
  async function restore(root) {
    return DocumentAssets.restore(root, async id => {
      if (!urls.has(id)) {
        const record = await access('readonly', store => store.get(id));
        if (!record?.blob) throw Error('Missing image');
        if (!urls.has(id)) urls.set(id, URL.createObjectURL(record.blob));
      }
      return urls.get(id);
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
    DocumentAssets.validateList(assets);
    const mapping=new Map();
    try {
      for (const asset of assets) {
        const file = DocumentAssets.decode(asset);
        const stored=await fileAsset(file);mapping.set(asset.id,stored.id);
      }
      return mapping;
    } catch(error) {await Promise.all(Array.from(mapping.values()).map(remove));throw error;}
  }
  return { fileAsset, probe, snapshotHtml, restore, remove, httpUrl, decorate, releaseUnused, exportAssets, importAssets };
})();

window.DocumentResources = (() => {
  async function ready(root) {
    const doc = root.ownerDocument;
    await doc.fonts?.ready;
    const images = Array.from(root.querySelectorAll('img')).filter(image => !DocumentContent.hidden(image, root));
    await Promise.all(images.map(image => new Promise(resolve => {
      const done = () => { clearTimeout(timer); image.removeEventListener('load', done); image.removeEventListener('error', done); resolve(); };
      const timer = setTimeout(done, 10000);
      image.addEventListener('load', done, {once: true}); image.addEventListener('error', done, {once: true});
      if (image.complete) done();
    })));
    const backgrounds = new Set();
    root.querySelectorAll('.cover-image-layer').forEach(node => {
      const value = node.style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
      if (value) backgrounds.add(value);
    });
    const backgroundResults = await Promise.allSettled(Array.from(backgrounds, url => DocumentAssets.probe(url)));
    const failed = images.filter(image => !image.complete || !image.naturalWidth);
    failed.forEach(image => { image.dataset.imageFailed = 'true'; });
    return {failed, failedBackgrounds: backgroundResults.filter(result => result.status === 'rejected').length};
  }
  return {ready};
})();

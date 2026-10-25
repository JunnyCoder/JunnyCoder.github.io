// Saved document settings have no dependency on input elements or storage.
window.DocumentSettings = (() => {
  const defaults = Object.freeze({
    colorTheme: 'modern', preserveHtmlCss: false, fontSize: 11, globalLineHeight: 1.6,
    enableHeaderFooter: false, headerTitleInput: '', footerAuthorInput: '',
    marginTop: 20, marginBottom: 20, marginLeft: 15, marginRight: 15,
    coverTitleInput: '', coverSubtitleInput: '', coverBgStyle: 'template', coverBgInput: '', coverImgInput: '',
    coverImageFit: 'cover', coverImageOpacity: 0, coverFilterColor: '#ffffff', coverFilterOpacity: 100,
    removeHtmlBackground: false, tocTitleInput: '목차', tocNumbering: false
  });
  const limits = {fontSize: [6, 36], globalLineHeight: [1, 3], coverImageOpacity: [0, 100],
    coverFilterOpacity: [0, 100], marginTop: [0, 50], marginBottom: [0, 50], marginLeft: [0, 50], marginRight: [0, 50]};
  const choices = {colorTheme: ['modern','dev','academic','report','editorial','minimal'],
    coverBgStyle: ['template','white','soft','warm','grid','custom'], coverImageFit: ['cover','tile','width','original']};
  function normalize(values = {}, base = defaults, title = '') {
    const next = {...defaults, ...base};
    Object.keys(defaults).forEach(id => {
      if (!Object.hasOwn(values, id)) return;
      let value = values[id];
      if (id in limits) {
        if ((typeof value !== 'number' && typeof value !== 'string') || value === '' || !Number.isFinite(Number(value))) return;
        next[id] = Math.max(limits[id][0], Math.min(limits[id][1], Number(value)));
      } else if (typeof defaults[id] === 'boolean') next[id] = value === true;
      else if (id in choices) {
        if (id === 'colorTheme' && value === 'tech') value = 'dev';
        next[id] = choices[id].includes(value) ? value : defaults[id];
      } else if (typeof value === 'string') next[id] = value;
    });
    if (!Object.hasOwn(values, 'coverBgStyle') && values.coverBgInput) next.coverBgStyle = 'custom';
    if (!Object.hasOwn(values, 'coverTitleInput') && Object.hasOwn(values, 'colorTheme') && Object.hasOwn(values, 'headerTitleInput')) next.coverTitleInput = values.headerTitleInput || title;
    return next;
  }
  function applyMargins(root, settings) {
    ['Top','Bottom','Left','Right'].forEach(side => root.style.setProperty('--page-margin-' + side.toLowerCase(), settings['margin' + side] + 'mm'));
  }
  return {defaults, limits, ids: Object.keys(defaults), normalize, applyMargins};
})();

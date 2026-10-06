/* UI preference shared by Markdown Editor and PDF Maker; separate from documents. */
(function () {
  'use strict';
  var storageKey = 'junny.editor-ui.theme.v1';
  var theme = 'dark';
  try { if (localStorage.getItem(storageKey) === 'light') theme = 'light'; } catch (_) {}

  function applyTheme(value) {
    theme = value === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.uiTheme = theme;
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = theme;
    var button = document.getElementById('uiThemeToggle');
    if (button) {
      var light = theme === 'light';
      button.setAttribute('aria-pressed', String(light));
      button.setAttribute('aria-label', light ? '다크 모드로 전환' : '라이트 모드로 전환');
      button.title = button.getAttribute('aria-label');
      button.querySelector('[data-theme-icon]').textContent = light ? '☀' : '☾';
      button.querySelector('[data-theme-label]').textContent = light ? '라이트' : '다크';
    }
  }
  applyTheme(theme);
  function bindToggle() {
    applyTheme(theme);
    var button = document.getElementById('uiThemeToggle');
    if (!button) return;
    button.addEventListener('click', function () {
      applyTheme(theme === 'dark' ? 'light' : 'dark');
      try { localStorage.setItem(storageKey, theme); } catch (_) {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindToggle, { once: true });
  else bindToggle();
  window.addEventListener('storage', function (event) {
    if (event.key === storageKey || event.key === null) applyTheme(event.newValue);
  });
})();

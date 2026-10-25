// One Marked 4.x configuration for both authoring tools. No module mutates it later.
window.DocumentMarkdown = (() => {
  const renderer = SharedCodeBlocks.configureRenderer(new marked.Renderer());
  renderer.link = (href, title, text) => '<a href="' + SharedHtmlBlocks.escape(href || '') + '"' +
    (title ? ' title="' + SharedHtmlBlocks.escape(title) + '"' : '') +
    ' target="_blank" rel="noopener noreferrer">' + text + '</a>';
  marked.setOptions({renderer, gfm: true, breaks: false, headerIds: false, mangle: false,
    langPrefix: 'hljs language-', highlight: null});
  marked.use({
    // Ordinary indented paragraphs remain text; code requires an explicit fence.
    tokenizer: {code() { return undefined; }},
    extensions: DocumentMath.extensions
  });
  return {
    lexer: source => marked.lexer(source),
    parse: (source, links) => DocumentMath.parse(source, links)
  };
})();

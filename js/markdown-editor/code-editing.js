// Source mapping belongs to the Markdown authoring adapter.
window.MarkdownCodeEditing = (() => {
  // Match parsed code tokens within their top-level source block. Raw HTML pre blocks
  // never enter this mapping, including HTML containing apparent Markdown fences.
  function markdownLocations(raw, tokens) {
    const locations = [];
    let sourceLine = 0, sourceOffset = 0;
    tokens.forEach(top => {
      // Reference definitions are removed from lexer output. Locate each raw
      // token in the source so later code controls still address the right fence.
      const found = raw.indexOf(top.raw, sourceOffset);
      if (found >= 0) { sourceLine += (raw.slice(sourceOffset,found).match(/\n/g) || []).length; sourceOffset = found + top.raw.length; }
      const lines = top.raw.split('\n');
      let cursor = 0;
      marked.walkTokens([top], token => {
        if (token.type !== 'code' || (window.SharedHtmlBlocks && String(token.lang || '').trim()==='junny-html')) return;
        const opening = token.raw.trimStart().split('\n')[0].trim();
        for (; cursor < lines.length; cursor++) {
          const match = lines[cursor].match(/^([\t ]*(?:>[\t ]*)*(?:(?:[-+*]|\d+[.)])[\t ]+)?)(`{3,}|~{3,})(.*)$/);
          if (!match || (match[2] + match[3]).trim() !== opening) continue;
          locations.push({ line: sourceLine + cursor, prefix: match[1], marker: match[2] });
          cursor += Math.max(1, token.raw.split('\n').length - (token.raw.endsWith('\n') ? 1 : 0));
          break;
        }
      });
      sourceLine += (top.raw.match(/\n/g) || []).length;
    });
    return locations;
  }
  function htmlLocations(tokens, raw = tokens.map(token => token.raw).join('')) {
    const locations = [];
    let sourceLine = 0, sourceOffset = 0;
    tokens.forEach(top => {
      const found = raw.indexOf(top.raw, sourceOffset);
      if (found >= 0) { sourceLine += (raw.slice(sourceOffset,found).match(/\n/g) || []).length; sourceOffset = found + top.raw.length; }
      const normalize = text => {
        let value = '', offset = 0;
        const indices = [];
        text.split('\n').forEach((line, index, lines) => {
          const prefix = line.match(/^[\t ]*(?:>[\t ]*)*(?:(?:[-+*]|\d+[.)])[\t ]+)?/)[0].length;
          for (let i = prefix; i < line.length; i++) { value += line[i]; indices.push(offset + i); }
          if (index < lines.length - 1) { value += '\n'; indices.push(offset + line.length); }
          offset += line.length + 1;
        });
        return { value, indices };
      };
      const original = normalize(top.raw);
      let cursor = 0;
      const position = offset => {
        const lines = top.raw.slice(0, offset).split('\n');
        return { line: sourceLine + lines.length - 1, ch: lines[lines.length - 1].length };
      };
      marked.walkTokens([top], token => {
        if (token.type === 'code') {
          const start = original.value.indexOf(token.raw.trimStart().split('\n')[0].trim(), cursor);
          if (start >= 0) {
            cursor = start;
            const count = token.raw.split('\n').length - (token.raw.endsWith('\n') ? 1 : 0);
            for (let i = 0; i < count; i++) {
              const next = original.value.indexOf('\n', cursor);
              cursor = next < 0 ? original.value.length : next + 1;
            }
          }
          return;
        }
        if (token.type !== 'html') return;
        const protectedRanges = Array.from(token.raw.matchAll(/<!--[^]*?-->|<(script|style|textarea)\b[^>]*>[^]*?<\/\1\s*>/gi))
          .map(match => [match.index, match.index + match[0].length]);
        for (const match of token.raw.matchAll(/<pre\b[^>]*>/gi)) {
          if (protectedRanges.some(([start, end]) => match.index >= start && match.index < end)) continue;
          const opening = normalize(match[0]).value;
          const start = original.value.indexOf(opening, cursor);
          if (start < 0) continue;
          const from = original.indices[start], to = original.indices[start + opening.length - 1] + 1;
          locations.push({ from: position(from), to: position(to), opening: top.raw.slice(from, to) });
          cursor = start + opening.length;
        }
      });
      sourceLine += (top.raw.match(/\n/g) || []).length;
    });
    return locations;
  }
  function create(editor) {
    function bind(root, raw, tokens) {
      const fences = markdownLocations(raw, tokens), html = htmlLocations(tokens, raw);
      root.querySelectorAll('pre').forEach(pre => { delete pre.codeLocation; delete pre.htmlCodeLocation; delete pre.codeLineHandle; delete pre.codeEndHandle; });
      root.querySelectorAll('pre[data-code-origin="markdown"]').forEach((pre, index) => {
        const location = fences[index]; if (!location) return;
        pre.codeLocation = {...location, opening: editor.getLine(location.line)};
        pre.codeLineHandle = editor.getLineHandle(location.line);
      });
      root.querySelectorAll('pre[data-code-origin="html"]').forEach((pre, index) => {
        const location = html[index]; if (!location) return;
        pre.htmlCodeLocation = location;
        pre.codeLineHandle = editor.getLineHandle(location.from.line);
        pre.codeEndHandle = editor.getLineHandle(location.to.line);
      });
    }
    function planCodeLanguage(pre, language) {
      if (!pre.codeLineHandle) return null;
      const line = editor.getLineNumber(pre.codeLineHandle);
      if (line == null) return null;
      if (pre.codeLocation) {
        const current = editor.getLine(line), location = pre.codeLocation;
        if (current !== location.opening) return null;
        const beginning = location.prefix + location.marker;
        const info = current.slice(beginning.length), word = info.match(/^(\s*)(\S+)/);
        const name = language === 'xml' ? 'html' : language;
        const metadataOnly = !word || /^(?:linenums$|filename=|start=|output=)/.test(word[2]);
        const text = metadataOnly ? beginning + name + (info && !/^\s/.test(info) ? ' ' : '') + info :
          beginning + word[1] + name + info.slice(word[0].length);
        return text === current ? null : {text, from: {line, ch: 0}, to: {line, ch: current.length}};
      }
      if (pre.htmlCodeLocation) {
        const location = pre.htmlCodeLocation, endLine = editor.getLineNumber(pre.codeEndHandle);
        if (endLine == null) return null;
        const from = {line, ch: location.from.ch}, to = {line: endLine, ch: location.to.ch};
        if (editor.getRange(from, to) !== location.opening) return null;
        const text = location.opening.replace(/\sdata-code-language\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
          .replace(/>$/, ' data-code-language="' + language + '">');
        return text === location.opening ? null : {text, from, to};
      }
      return null;
    }
    return {bind, planCodeLanguage, commit({text, from, to}) { editor.replaceRange(text, from, to, '+code-language'); }};
  }
  return {create, markdownLocations, htmlLocations};
})();

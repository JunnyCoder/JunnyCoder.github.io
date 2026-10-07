// Keep unchanged top-level nodes alive. Source offsets belong to this renderer,
// so scrolling and code editing do not need a second DOM parse per token.
window.MdPreviewRenderer = {create(host) {
  let records = [], previous = null, linksKey = '', tokens = [], fallbackBlocks = null;
  function update(raw) {
    if (raw === previous) return {tokens, blocks: fallbackBlocks || positions(raw), changed: false};
    tokens = marked.lexer(raw);
    const nextLinks = JSON.stringify(tokens.links || {});
    const next = tokens.map(token => ({raw: token.raw, type: token.type, token, nodes: null}));
    let prefix = 0, suffix = 0;
    if (nextLinks === linksKey) {
      while (prefix < records.length && prefix < next.length && same(records[prefix], next[prefix])) { next[prefix].nodes = records[prefix].nodes; prefix++; }
      while (suffix < records.length - prefix && suffix < next.length - prefix && same(records[records.length - suffix - 1], next[next.length - suffix - 1])) {
        next[next.length - suffix - 1].nodes = records[records.length - suffix - 1].nodes; suffix++;
      }
    }
    // Raw HTML containers may span lexer tokens and need one HTML parser context.
    const unsafe = tokens.some(token => token.type === 'html' && crossesHtmlBoundary(token.raw));
    if (unsafe) {
      const spans = sourceSpans(raw, tokens);
      const html = tokens.map((token,index) => {
        const single=[token];single.links=tokens.links;
        const part=window.PdfMath?PdfMath.parse(token.raw,tokens.links):marked.parser(single);
        return part.replace(/<([a-z][\w:-]*)(?=\s|>)/i,'<$1 data-md-source-token="'+index+'"');
      }).join('');
      host.innerHTML = DOMPurify.sanitize(html);
      const roots=Array.from(host.children),lastLine=raw.split('\n').length-1;
      fallbackBlocks=roots.map(element => {
        const marker=element.hasAttribute('data-md-source-token')?element:element.querySelector('[data-md-source-token]');
        const index=Number(marker?.getAttribute('data-md-source-token'));
        const line=Number.isInteger(index) && spans[index]?spans[index].line:0;
        return {line,endLine:lastLine,element};
      });
      fallbackBlocks.forEach((block,index) => {if(fallbackBlocks[index+1])block.endLine=Math.max(block.line,fallbackBlocks[index+1].line-1);});
      host.querySelectorAll('[data-md-source-token]').forEach(node=>node.removeAttribute('data-md-source-token'));
      records = [{raw, type: 'document', nodes: Array.from(host.childNodes)}];
      previous = raw; linksKey = nextLinks;
      return {tokens, blocks: fallbackBlocks, changed: true};
    }
    fallbackBlocks=null;
    for (let i = prefix; i < next.length - suffix; i++) {
      const record = next[i], single = [record.token]; single.links = tokens.links;
      const html = window.PdfMath ? PdfMath.parse(record.raw, tokens.links) : marked.parser(single);
      const box = document.createElement('div');
      box.innerHTML = DOMPurify.sanitize(html);
      record.nodes = Array.from(box.childNodes);
    }
    // Remove only changed nodes, then insert replacements before the suffix.
    if (previous === null) host.replaceChildren();
    else for (let i = prefix; i < records.length - suffix; i++) records[i].nodes.forEach(node => node.remove());
    const anchor = suffix ? next.slice(next.length - suffix).flatMap(record => record.nodes).find(node => node.parentNode === host) : null;
    const fragment = document.createDocumentFragment();
    for (let i = prefix; i < next.length - suffix; i++) next[i].nodes.forEach(node => fragment.append(node));
    host.insertBefore(fragment, anchor || null);
    records = next; previous = raw; linksKey = nextLinks;
    return {tokens, blocks: positions(raw), changed: true};
  }
  function crossesHtmlBoundary(raw) {
    const stack=[];
    const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
    for(const match of raw.replace(/<!--[\s\S]*?-->/g,'').matchAll(/<(\/?)([a-z][\w:-]*)\b[^>]*>/gi)){
      const tag=match[2].toLowerCase();if(voidTags.has(tag) || /\/\s*>$/.test(match[0]))continue;
      if(match[1]){if(stack.pop()!==tag)return true;}else stack.push(tag);
    }
    return stack.length>0;
  }
  function sourceSpans(raw, items) {
    let offset=0,line=0;
    return items.map(item=>{
      const found=raw.indexOf(item.raw,offset);
      if(found>=0){line+=(raw.slice(offset,found).match(/\n/g)||[]).length;offset=found;}
      const start=line;line+=(item.raw.match(/\n/g)||[]).length;offset+=item.raw.length;
      return {line:start,endLine:Math.max(start,line-(/\n$/.test(item.raw)?1:0))};
    });
  }
  function same(a, b) { return a.raw === b.raw && a.type === b.type; }
  function positions(raw) {
    const blocks = [];
    let offset = 0, line = 0;
    records.forEach(record => {
      const found = raw.indexOf(record.raw, offset);
      if (found >= 0) { line += (raw.slice(offset, found).match(/\n/g) || []).length; offset = found; }
      const start = line, count = (record.raw.match(/\n/g) || []).length;
      line += count; offset += record.raw.length;
      record.nodes.forEach(element => { if (element.nodeType === 1) blocks.push({line: start, endLine: Math.max(start, line - (/\n$/.test(record.raw) ? 1 : 0)), element}); });
    });
    return blocks;
  }
  function reset() { records = []; previous = null; linksKey = ''; tokens = []; fallbackBlocks=null; }
  return {update, reset, get tokens() { return tokens; }};
}};

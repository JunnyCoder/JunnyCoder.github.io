/* DOM conversion keeps text structure; HTML fallback is limited to irreducible regions. */
window.HtmlToMarkdown=(()=>{
 const plainEscape=s=>String(s).replace(/\\/g,'\\\\').replace(/([`*_\[\]<>#!+.~=-])/g,'\\$1');
 const esc=(s,normalize=false)=>{const parts=String(s).split(/(\$\$[\s\S]*?\$\$|(?<!\\)\$[^\n$]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g);return parts.map((p,i)=>i%2?p:plainEscape(normalize?p.replace(/[\t\r\n ]+/g,' '):p)).join('');};
 const fence=(text,info)=>{const runs=text.match(/`+/g)||[];const ticks='`'.repeat(Math.max(3,...runs.map(s=>s.length+1)));return '\n\n'+ticks+info+'\n'+text+(text.endsWith('\n')?'':'\n')+ticks+'\n\n';};
 function compact(markdown){
  let fenceMarker=null,math=false,blank=false;const output=[];
  for(const line of String(markdown).replace(/\r\n?/g,'\n').split('\n')){
   const opening=line.match(/^[\t >]*(?:(?:[-*+]|\d+[.)])\s+)?(`{3,}|~{3,})/);
   if(fenceMarker){output.push(line);if(opening && opening[1][0]===fenceMarker[0] && opening[1].length>=fenceMarker.length && line.slice(line.indexOf(opening[1])+opening[1].length).trim()==='')fenceMarker=null;continue;}
   if(opening && !(opening[1][0]==='`' && line.slice(line.indexOf(opening[1])+opening[1].length).includes('`'))){fenceMarker=opening[1];output.push(line);blank=false;continue;}
   if(/^\s*\$\$\s*$/.test(line)){math=!math;output.push(line.trim());blank=false;continue;}
   if(math){output.push(line);continue;}
   if(!line.trim()){if(!blank)output.push('');blank=true;}else{output.push(line);blank=false;}
  }
  return output.join('\n').trim()+'\n';
 }
 function validate(markdown,parsed){
  const problems=[];let tokens;
  try{tokens=parsed || marked.lexer(markdown);marked.walkTokens(tokens,token=>{
   if(token.type==='html')problems.push('HTML 태그가 포함되어 있습니다.');
   if(token.type==='code' && /^junny-html(?:\s|$)/i.test(token.lang||''))problems.push('고유 HTML 블록이 포함되어 있습니다.');
   if((token.type==='link'||token.type==='image') && /^\s*(?:javascript|vbscript|file):/i.test(token.href||''))problems.push('사용할 수 없는 링크 주소가 있습니다.');
  });}catch{problems.push('Markdown 구문을 분석하지 못했습니다.');}
  let fence=null;for(const line of String(markdown).split('\n')){const match=line.match(/^[\t >]*(?:(?:[-*+]|\d+[.)])\s+)?(`{3,}|~{3,})(.*)$/);if(!match)continue;if(!fence){if(match[1][0]==='`' && match[2].includes('`'))continue;fence=match[1];}else if(match[1][0]===fence[0] && match[1].length>=fence.length && !match[2].trim())fence=null;}if(fence)problems.push('닫히지 않은 코드블록이 있습니다.');
  return [...new Set(problems)];
 }
 function autoResolve(model,mode,choices){
  // Resolve in passes because simplifying a parent may expose another issue.
  const nodes=model.nodes || new Map(Array.from(model.root.querySelectorAll('[data-import-id]'),node=>[node.getAttribute('data-import-id'),node]));
  for(let pass=0;pass<nodes.size+1;pass++){
   const unresolved=convert(model,mode,choices).issues.filter(issue=>!issue.choice || (mode==='strict' && issue.choice==='html'));if(!unresolved.length)break;
   unresolved.forEach(issue=>{const node=nodes.get(issue.id);
    const action=mode==='html'?'html':node?.tagName==='TABLE'?'table':HtmlImportStructures.needsLiteralNumbers(node)?'numbered-text':node?.matches('div,section,article,main,header,footer,blockquote,ul,ol')?'flatten':node?.matches('math,mjx-container,svg,canvas,video,audio,.katex,.katex-display,.MathJax,.MathJax_Display')?'code':node?.querySelector('img')?'flatten':'text';choices.set(issue.id,action);if(action==='code')choices.set(issue.id+':language','xml');
   });
  }
 }
 function prepare(source){
  const original=new DOMParser().parseFromString(source,'text/html');
  HtmlImportStructures.checkComplexity(original.documentElement, String(source).length);
  const css=Array.from(original.querySelectorAll('style')).map(n=>n.textContent).join('\n');
  const removed=original.querySelectorAll('script,iframe,object,embed,form,link').length;
  original.querySelectorAll('math').forEach(node=>{if(node.querySelector('annotation[encoding="application/x-tex"]'))return;const tex=HtmlImportStructures.mathmlTex(node);if(tex!==null){const span=original.createElement('span');span.className='pdf-math';span.dataset.mathSource=tex;span.dataset.mathDisplay=String(node.getAttribute('display')==='block');const target=node.closest('.katex-display,.katex,mjx-container,.MathJax_Display,.MathJax')||node;span.dataset.mathDisplay=String(node.getAttribute('display')==='block' || target.matches('.katex-display,.MathJax_Display,[display="true"]'));target.replaceWith(span);}});
  original.querySelectorAll('.katex-display,.katex,mjx-container,.MathJax_Display,.MathJax').forEach(node=>{if(!node.isConnected)return;const tex=node.querySelector('annotation[encoding="application/x-tex"]')?.textContent || node.getAttribute('data-tex');if(tex!=null){const span=original.createElement('span');span.className='pdf-math';span.dataset.mathSource=tex;span.dataset.mathDisplay=String(node.matches('.katex-display,.MathJax_Display,[display="true"]'));node.replaceWith(span);}});
  original.querySelectorAll('script[type^="math/tex"]').forEach(n=>{const span=original.createElement('span');span.className='pdf-math';span.dataset.mathSource=n.textContent;span.dataset.mathDisplay=String(n.type.includes('mode=display'));n.replaceWith(span);});
  original.querySelectorAll('script,iframe,object,embed,form,style,link,meta,base').forEach(n=>n.remove());
  const root=document.createElement('div');root.innerHTML=DOMPurify.sanitize(original.body.innerHTML,{FORBID_ATTR:['contenteditable']});
  let serial=0;const nodes=new Map();root.querySelectorAll('*').forEach(n=>{n.setAttribute('data-import-id',String(++serial));nodes.set(n.getAttribute('data-import-id'),n);});
  return {root,css,removed,nodes};
 }
 const cleaned=node=>{const copy=node.cloneNode(true);copy.querySelectorAll('[data-import-id]').forEach(n=>n.removeAttribute('data-import-id'));copy.removeAttribute('data-import-id');return copy.outerHTML;};
 function reason(node,css){
  if(HtmlImportStructures.needsLiteralNumbers(node))return '역순 또는 개별 번호는 일반 Markdown 목록에서 유지되지 않습니다. 번호 텍스트 변환 또는 HTML 유지가 필요합니다.';
  if(node.matches('table') && (node.querySelector('[rowspan]:not([rowspan="1"]),[colspan]:not([colspan="1"]),table') || Array.from(node.rows).some(r=>Array.from(r.cells).some(c=>c.querySelector('ul,ol,pre,table') || c.querySelectorAll(':scope > p,:scope > div').length>1))))return '셀 병합 또는 여러 블록을 포함한 표';
  if(node.matches('math,mjx-container,.katex,.katex-display,.MathJax,.MathJax_Display') && !node.querySelector('annotation[encoding="application/x-tex"]') && !node.hasAttribute('data-tex'))return '원본 TeX를 찾을 수 없는 수식 · 텍스트 변환 또는 HTML 유지 필요';
  if(node.matches('svg,canvas,video,audio'))return 'Markdown으로 표현할 수 없는 시각·미디어 요소';
  if(node.matches('div,section,article,main,header,footer') && node.children.length>1){
   if(/display\s*:\s*(grid|flex)|position\s*:\s*absolute/i.test(node.getAttribute('style')||''))return '배치를 유지해야 하는 복합 영역';
   const rule=/([^{}]+)\{([^{}]*display\s*:\s*(?:grid|flex)[^{}]*)\}/gi;let m;while((m=rule.exec(css))){try{if(node.matches(m[1].trim()))return 'CSS로 배치된 복합 영역';}catch{}}
  }
  const known='H1 H2 H3 H4 H5 H6 P DIV SECTION ARTICLE MAIN HEADER FOOTER NAV SPAN STRONG B EM I DEL S STRIKE A IMG BR HR UL OL LI INPUT BLOCKQUOTE PRE CODE TABLE THEAD TBODY TFOOT TR TH TD CAPTION COLGROUP COL FIGURE FIGCAPTION DETAILS SUMMARY DL DT DD MARK U INS SUP SUB ABBR SMALL TIME CITE Q KBD SAMP VAR RUBY RT RP WBR MATH SEMANTICS ANNOTATION'.split(' ');
  if(!known.includes(node.tagName))return '지원되지 않는 태그: '+node.tagName.toLowerCase();
  return '';
 }
 function convert(model,mode='strict',choices=new Map()){
  const issues=[];
  function walk(node){
   if(node.nodeType===3)return esc(node.textContent,true);if(node.nodeType!==1)return '';
   const id=node.getAttribute('data-import-id'),choice=choices.get(id);
   if(!choice && node.hasAttribute('data-math-source'))return node.getAttribute('data-math-display')==='true'?'\n\n$$\n'+node.getAttribute('data-math-source')+'\n$$\n\n':'$'+node.getAttribute('data-math-source')+'$';
   if(!choice && node.matches('.katex-display,.katex,math,mjx-container,.MathJax,.MathJax_Display')){const tex=node.querySelector('annotation[encoding="application/x-tex"]')?.textContent || node.getAttribute('data-tex');if(tex!=null)return node.matches('.katex-display,.MathJax_Display,[display="block"],[display="true"]')?'\n\n$$\n'+tex+'\n$$\n\n':'$'+tex+'$';}
   let why=reason(node,model.css);
   if(mode==='html' && !why && node.matches('blockquote,ul,ol') && Array.from(node.querySelectorAll('*')).some(child=>{const decision=choices.get(child.getAttribute('data-import-id'));return decision==='html' || (!decision && reason(child,model.css));}))why='내부 복합 구조와 인용·목록 관계를 함께 보존해야 합니다.';
   if(why && !node.closest('pre')){
    issues.push({id,tag:node.tagName.toLowerCase(),reason:why,text:node.textContent.trim().slice(0,90),choice:choice||''});
    if(!choice){if(mode==='html')return fence('<style>'+model.css+'</style>\n'+cleaned(node),'junny-html');return '\n\n'+esc(node.textContent.trim())+'\n\n';}
   }
   if(choice==='omit')return '';
   if(choice==='html' && mode==='html')return fence('<style>'+model.css+'</style>\n'+cleaned(node),'junny-html');
   if(choice==='text')return '\n\n'+esc(node.textContent.trim())+'\n\n';
   if(choice==='code'){const language=(choices.get(id+':language')||'plaintext').trim().split(/\s/)[0];return fence(node.matches('math,mjx-container,svg,canvas,video,audio,.katex,.katex-display,.MathJax,.MathJax_Display')?cleaned(node):node.textContent,language==='junny-html'?'plaintext':language);}
   const tag=choice && !['flatten','numbered-text'].includes(choice)?choice.toUpperCase():node.tagName;
   const children=()=>Array.from(node.childNodes).map(walk).join('');
   if(node.hasAttribute('data-math-source'))return node.getAttribute('data-math-display')==='true'?'\n\n$$\n'+node.getAttribute('data-math-source')+'\n$$\n\n':'$'+node.getAttribute('data-math-source')+'$';
   const tex=node.querySelector('annotation[encoding="application/x-tex"]');
   if(tex && (node.classList.contains('katex') || tag==='MATH'))return '$'+tex.textContent+'$';
   if(node.classList.contains('katex-display'))return '\n\n$$\n'+(node.querySelector('annotation')?.textContent||node.textContent)+'\n$$\n\n';
   if(/^H[1-6]$/.test(tag))return '\n\n'+'#'.repeat(Number(tag[1]))+' '+children().trim()+'\n\n';
   if(['P','DIV','SECTION','ARTICLE','MAIN','HEADER','FOOTER','NAV','FIGURE'].includes(tag))return '\n\n'+children().trim()+'\n\n';
   if(tag==='SUP'||tag==='SUB')return '${}'+(tag==='SUP'?'^':'_')+'{'+node.textContent.replace(/[{}]/g,'')+'}$';
   if(tag==='BR')return '  \n';if(tag==='WBR')return '';if(tag==='HR')return '\n\n---\n\n';
   if(['STRONG','B'].includes(tag))return '**'+children()+'**';if(['EM','I'].includes(tag))return '*'+children()+'*';if(['DEL','S','STRIKE'].includes(tag))return '~~'+children()+'~~';
   if(tag==='A'){const href=node.getAttribute('href')||'';return href?'['+children()+']('+href.replace(/[()\s]/g,c=>encodeURIComponent(c))+')':children();}
   if(tag==='IMG'){const src=node.getAttribute('src')||'';return src?'!['+esc(node.getAttribute('alt')||'')+']('+src.replace(/[()\s]/g,c=>encodeURIComponent(c))+')':'';}
   if(tag==='PRE'){const code=node.querySelector('code');const language=(code?.className||node.className||'').match(/(?:language-|lang-)([\w+-]+)/)?.[1]||node.dataset.codeLanguage||'plaintext';return fence(window.SharedCodeBlocks?SharedCodeBlocks.codeText?.(node)||readCode(node):readCode(node),language);}
   if(tag==='CODE'){const text=node.textContent;const ticks='`'.repeat(Math.max(1,...(text.match(/`+/g)||[]).map(s=>s.length+1)));return ticks+' '+text.replace(/\n/g,' ')+' '+ticks;}
   if(tag==='BLOCKQUOTE')return '\n\n'+children().trim().split('\n').map(s=>'> '+s).join('\n')+'\n\n';
   if(tag==='UL'||tag==='OL'){
    const numbers=HtmlImportStructures.listNumbers(node);let itemIndex=0;
    const literal=tag==='OL' && (choice==='numbered-text' || HtmlImportStructures.needsLiteralNumbers(node));
    return '\n\n'+(Array.from(node.children).some(n=>n.tagName==='LI')?Array.from(node.children).filter(n=>n.tagName==='LI'):Array.from(node.children).length?Array.from(node.children):[node]).map(li=>{
     const checkbox=li.querySelector(':scope > input[type="checkbox"]');const number=numbers[itemIndex++] ?? itemIndex;const marker=tag==='OL'?String(number)+(literal?'\\. ':'. '):checkbox?'- ['+(checkbox.checked?'x':' ')+'] ':'- ';
     return marker+Array.from(li.childNodes).map(walk).join('').trim().replace(/\n/g,'\n'+' '.repeat(marker.length));
    }).join(literal?'  \n':'\n')+'\n\n';
   }
   if(tag==='INPUT')return '';
   if(tag==='TABLE'){
    if(node.tagName!=='TABLE'){issues.push({id,tag:node.tagName.toLowerCase(),reason:'표 변환에는 실제 table 구조가 필요합니다.',choice:''});return '\n\n'+esc(node.textContent)+'\n\n';}
    const rows=HtmlImportStructures.tableGrid(node,c=>Array.from(c.childNodes).map(walk).join('').trim().replace(/\|/g,'\\|').replace(/\s*\n+\s*/g,' '));
    if(!rows.length)return '';const width=Math.max(...rows.map(r=>r.length));const line=r=>'| '+Array.from({length:width},(_,i)=>r[i]||'').join(' | ')+' |';
    const firstHeader=Array.from(node.rows[0].cells).some(c=>c.tagName==='TH');const head=firstHeader?rows.shift():Array(width).fill('');
    return '\n\n'+line(head)+'\n'+line(Array(width).fill('---'))+'\n'+rows.map(line).join('\n')+'\n\n';
   }
   if(tag==='DETAILS')return '\n\n'+children().trim()+'\n\n';if(tag==='SUMMARY'||tag==='DT')return '\n\n**'+children().trim()+'**\n\n';if(tag==='DD'||tag==='FIGCAPTION')return '\n\n'+children().trim()+'\n\n';
   return children();
  }
  function readCode(node){const copy=node.cloneNode(true);copy.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));return copy.textContent;}
  // Never normalize whitespace inside fences: trailing blank lines are code content.
  const markdown=compact(Array.from(model.root.childNodes).map(walk).join(''));
  return {markdown,issues,unresolved:mode==='strict'?issues.filter(i=>!i.choice || i.choice==='html').length:0};
 }
 return {prepare,convert,fence,cleaned,compact,validate,autoResolve};
})();

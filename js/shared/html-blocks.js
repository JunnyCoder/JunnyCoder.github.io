/* A junny-html fence is a document block, not executable code. */
window.SharedHtmlBlocks=(()=>{
  const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const sanitize=html=>DOMPurify.sanitize(html,{FORBID_TAGS:['script','iframe','object','embed','form','input','button','textarea','link','meta','base'],FORBID_ATTR:['contenteditable']});
  function parse(source){
    const doc=new DOMParser().parseFromString(source,'text/html');
    const css=Array.from(doc.querySelectorAll('style')).map(n=>n.textContent).join('\n');doc.querySelectorAll('style').forEach(n=>n.remove());
    const root=document.createElement('div');root.innerHTML=sanitize(doc.body.innerHTML);
    root.querySelectorAll('*').forEach(node=>{['data-element-id','data-block-id','data-heading-id','data-import-id','data-html-block','data-html-source'].forEach(attr=>node.removeAttribute(attr));});
    return {html:root.innerHTML,css};
  }
  function key(source){let hash=2166136261;for(let i=0;i<source.length;i++){hash^=source.charCodeAt(i);hash=Math.imul(hash,16777619);}return 'html-'+(hash>>>0).toString(36);}
  function renderFence(source){return '<section class="shared-html-block" data-html-block="true" data-html-source="'+escape(encodeURIComponent(source))+'"></section>\n';}
  function scopedCss(css,scope){
    const style=document.createElement('style');style.media='not all';style.textContent=css;document.head.append(style);
    const prefix='[data-html-scope="'+scope+'"]';
    function rules(items){return Array.from(items||[]).map(rule=>{
      if(rule.type===1){
        const selectors=rule.selectorText.split(',').map(s=>s.trim()).filter(s=>s && !/:host|::slotted|:global/.test(s)).map(s=>{
          s=s.replace(/(^|\s)(html|body|:root)(?=[\s.#:[>+~]|$)/g,'$1').trim();
          if(/^[+~]/.test(s))return '';
          return s?prefix+' '+s:prefix;
        }).filter(Boolean);return selectors.length?selectors.join(',')+'{'+rule.style.cssText+'}':'';
      }
      if(rule.type===4 || rule.type===12)return rule.cssText.slice(0,rule.cssText.indexOf('{')+1)+rules(rule.cssRules)+'}';
      return ''; // Imports, font faces and global animation names cannot escape a block.
    }).join('\n');}
    try{return rules(style.sheet?.cssRules);}finally{style.remove();}
  }
  const parsedCache = window.EditorRuntime?.cache({entries: 128, bytes: 4 * 1024 * 1024});
  const cssCache = window.EditorRuntime?.cache({entries: 128, bytes: 2 * 1024 * 1024});
  const originals = new WeakMap();
  let styleSerial=0;
  function hydrate(root){
    const blocks=[...(root.matches?.('[data-html-block]')?[root]:[]),...root.querySelectorAll('[data-html-block]')];
    blocks.forEach(block=>{
      let source;try{source=decodeURIComponent(block.dataset.htmlSource||'');}catch{source='';}
      let parsed=parsedCache?.get(source);
      if(!parsed){parsed=parse(source);parsedCache?.set(source,parsed,(source.length+parsed.html.length+parsed.css.length)*2);}
      // Exact CSS cache keys share sheets; unique scope IDs avoid hash collisions.
      let sheet=cssCache?.get(parsed.css);
      if(!sheet){
        let scope;do{scope='html-style-'+(++styleSerial);}while(document.getElementById('style-'+scope));
        sheet={scope,css:scopedCss(parsed.css,scope)};
        cssCache?.set(parsed.css,sheet,(parsed.css.length+sheet.css.length+scope.length)*2);
      }
      const scope=sheet.scope;if(block.dataset.htmlScope!==scope)block.dataset.htmlScope=scope;
      // Restored/cloned blocks are checked against their exact source, never a hash.
      if(originals.get(block)!==source){block.innerHTML=parsed.html;block.dataset.htmlRendered=key(source);}
      originals.set(block,source);
      if(!document.getElementById('style-'+scope)){
        const style=document.createElement('style');style.id='style-'+scope;style.dataset.htmlBlockStyle=scope;style.textContent=sheet.css;document.head.append(style);
      }
    });
    const retained=new Set([...document.querySelectorAll('[data-html-scope]'),...blocks].map(node=>node.dataset.htmlScope));
    document.querySelectorAll('style[data-html-block-style]').forEach(style=>{if(!retained.has(style.dataset.htmlBlockStyle))style.remove();});
  }
  function sourceOf(block){try{return decodeURIComponent(block.dataset.htmlSource||'');}catch{return '';}}
  function update(block,source){block.dataset.htmlSource=encodeURIComponent(source);delete block.dataset.htmlRendered;hydrate(block);}
  function exportCss(){return Array.from(document.querySelectorAll('style[data-html-block-style]')).map(n=>n.textContent).join('\n');}
  return {escape,sanitize,parse,renderFence,hydrate,sourceOf,update,exportCss};
})();

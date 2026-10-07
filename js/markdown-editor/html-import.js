window.MdHtmlImporter={install({editor,backup,status}){
 const $=id=>document.getElementById(id),dialog=$('htmlImportDialog');
 let mode='strict',target='replace',model=null,choices=new Map(),selection=null,result=null,insertion=null,before='',fileRequest=0,dirty=false,sourceReady=false;
 const links=Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(n=>'<link rel="stylesheet" href="'+SharedHtmlBlocks.escape(n.href)+'">').join('');
 const frames=[$('htmlImportOriginalPreview'),$('htmlImportResultPreview')];
 const mathLinks=Array.from(document.querySelectorAll('link[href*="katex"]')).map(n=>'<link rel="stylesheet" href="'+SharedHtmlBlocks.escape(n.href)+'">').join('');
 const preview=HtmlImportPreview.create(frames);
 const previewJob=EditorRuntime.job(()=>{outputPreview();validateResult();},180);
 let liveRenderer=null,liveDocument=null,lastRenderedText=null,lastPreviewTokens=null;
 const fallbackRoot=document.createElement('div');
 const fallbackRenderer=window.MdPreviewRenderer?.create(fallbackRoot);
 function validateResult(){
  $('htmlImportAutoAll').disabled=!sourceReady || !model;
  const problems=mode==='strict'?HtmlToMarkdown.validate($('htmlImportOutput').value,lastRenderedText===$('htmlImportOutput').value?lastPreviewTokens:undefined):[];
  $('htmlImportApply').disabled=!sourceReady || !result || result.unresolved>0 || problems.length>0;
  if(problems.length)$('htmlImportStatus').textContent='Strict MD 검사: '+problems.join(' ');
  else if(result)$('htmlImportStatus').textContent=(result.unresolved?'변환 방식 선택 필요 '+result.unresolved+'개':'편집기에 적용할 수 있습니다.')+(model.removed?' · 실행·외부 삽입 요소 '+model.removed+'개 제외':'');
  return problems;
 }
 function renderMath(root){window.PdfMath?.render(root);if(window.renderMathInElement)renderMathInElement(root,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],ignoredClasses:['katex','katex-display','pdf-math'],throwOnError:false});}
 function frameDocument(body,css='',themed=false){return '<!doctype html><html data-ui-theme="light"><head><meta charset="UTF-8">'+(themed?links:mathLinks)+'<style>html{overflow:auto}body{height:auto!important;margin:0;padding:18px;overflow:visible!important;font:14px/1.65 sans-serif;color:#222;background:white}img{max-width:100%}pre{white-space:pre-wrap}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}[data-import-selected]{outline:2px solid #246ec4!important;outline-offset:2px}'+css+'</style></head><body'+(themed?' class="preview-body"':'')+' data-import-preview="true">'+body+'</body></html>';}
 function outputPreview(){
  const frame=$('htmlImportResultPreview'),doc=frame.contentDocument;
  // Once the frame has loaded, retain its document/fonts/scroll area and patch
  // only changed Markdown blocks. Head styles remain outside document content.
  const live=doc?.body?.hasAttribute('data-import-preview');
  const root=live?doc.body:fallbackRoot;
  const text=$('htmlImportOutput').value;
  if(live && window.MdPreviewRenderer){
   if(liveDocument!==doc){liveDocument=doc;liveRenderer=MdPreviewRenderer.create(root);}
   lastPreviewTokens=liveRenderer.update(text).tokens;
  }else if(fallbackRenderer)lastPreviewTokens=fallbackRenderer.update(text).tokens;
  else {root.innerHTML=DOMPurify.sanitize(window.PdfMath?PdfMath.parse(text):marked.parse(text));lastPreviewTokens=null;}
  lastRenderedText=text;
  SharedHtmlBlocks.hydrate(root);SharedCodeBlocks.normalize(root);window.PdfTemplates?.prepareDesign?.(root);renderMath(root);
  if(live){let style=doc.getElementById('importHtmlStyles');if(!style){style=doc.createElement('style');style.id='importHtmlStyles';doc.head.append(style);}style.textContent=SharedHtmlBlocks.exportCss();preview.scheduleRestore();}
  else preview.write(frame,frameDocument(root.innerHTML,SharedHtmlBlocks.exportCss(),true));
 }
 function regenerate(){
  if(!model || !sourceReady)return;
  previewJob.cancel();
  try{result=HtmlToMarkdown.convert(model,mode,choices);}catch(error){result=null;sourceReady=false;$('htmlImportApply').disabled=true;$('htmlImportAutoAll').disabled=true;$('htmlImportStatus').textContent=error.message;return;}
  $('htmlImportOutput').value=result.markdown;dirty=false;outputPreview();
  validateResult();
  $('htmlImportIssues').replaceChildren();result.issues.forEach(issue=>{
   const button=document.createElement('button');button.type='button';button.className='html-import-issue';button.textContent='<'+issue.tag+'> '+issue.reason+' · '+(issue.choice|| (mode==='html'?'HTML 블록 유지':'선택 필요'))+'\n'+issue.text;
   button.addEventListener('click',()=>select(issue.id));$('htmlImportIssues').append(button);
  });
 }
 function select(id){
  selection=model?.nodes.get(id);if(!selection)return;
  $('htmlImportSelection').hidden=false;$('htmlImportSelectedLabel').textContent='<'+selection.tagName.toLowerCase()+'> · '+selection.textContent.trim().slice(0,80);
  $('htmlImportMapping').querySelector('[value="table"]').disabled=selection.tagName!=='TABLE';
  $('htmlImportMapping').value=choices.get(id)||'auto';$('htmlImportLanguage').value=choices.get(id+':language')||'plaintext';
  const doc=$('htmlImportOriginalPreview').contentDocument;
  doc?.querySelectorAll('[data-import-selected]').forEach(n=>n.removeAttribute('data-import-selected'));const node=doc?.querySelector('[data-import-id="'+id+'"]');if(node){node.setAttribute('data-import-selected','');node.scrollIntoView?.({block:'nearest'});}
 }
 function canRegenerate(){return !dirty || confirm('직접 수정한 Markdown을 변환 결과로 다시 생성합니다. 계속할까요?');}
 function analyze(){
  if(!canRegenerate())return;
  previewJob.cancel();
  $('htmlImportAutoSummary').textContent='';
  try{model=HtmlToMarkdown.prepare($('htmlImportSource').value);}catch(error){sourceReady=false;$('htmlImportAutoAll').disabled=true;$('htmlImportApply').disabled=true;$('htmlImportStatus').textContent=error.message;return;}
  sourceReady=true;choices=new Map();selection=null;$('htmlImportSelection').hidden=true;
  const original=model.root.cloneNode(true);renderMath(original);preview.write($('htmlImportOriginalPreview'),frameDocument(original.innerHTML,model.css));regenerate();
 }
 $('htmlImportOriginalPreview').addEventListener('load',()=>{
  const doc=$('htmlImportOriginalPreview').contentDocument;if(!doc)return;doc.addEventListener('click',event=>{event.preventDefault();const node=event.target.closest('[data-import-id]');if(node)select(node.getAttribute('data-import-id'));});
 });
 $('htmlImportBtn').addEventListener('click',()=>{
  before=editor.getValue();insertion=editor.getCursor();dialog.showModal();$('htmlImportSource').focus();
 });
 function close(){fileRequest++;previewJob.cancel();preview.cancel();dialog.close();editor.focus();}
 $('htmlImportCancel').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 $('htmlImportAnalyze').addEventListener('click',analyze);
 $('htmlImportSource').addEventListener('input',()=>{previewJob.cancel();sourceReady=false;$('htmlImportAutoAll').disabled=true;$('htmlImportApply').disabled=true;$('htmlImportStatus').textContent='입력 변경됨 · 분석·변환을 눌러 결과를 갱신해주세요.';fileRequest++;});
 dialog.querySelectorAll('[data-input-mode]').forEach(button=>button.addEventListener('click',()=>{
  const file=button.dataset.inputMode==='file';$('htmlImportPaste').hidden=file;$('htmlImportUpload').hidden=!file;
  dialog.querySelectorAll('[data-input-mode]').forEach(n=>{n.classList.toggle('active',n===button);n.setAttribute('aria-pressed',String(n===button));});
 }));
 $('htmlImportFile').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;const request=++fileRequest;
  if(!/\.html?$/i.test(file.name) || file.size>10*1024*1024){$('htmlImportStatus').textContent='10MB 이하의 .html 또는 .htm 파일을 선택해주세요.';return;}
  try{const text=await file.text();if(request!==fileRequest || !dialog.open)return;$('htmlImportSource').value=text;analyze();}catch{$('htmlImportStatus').textContent='파일을 읽지 못했습니다.';}
 });
 dialog.querySelectorAll('[data-convert-mode]').forEach(button=>button.addEventListener('click',()=>{
  if(!canRegenerate())return;mode=button.dataset.convertMode;
  dialog.querySelectorAll('[data-convert-mode]').forEach(n=>{n.classList.toggle('active',n===button);n.setAttribute('aria-pressed',String(n===button));});
  $('htmlImportMapping').querySelector('[value="html"]').disabled=mode!=='html';regenerate();
 }));
 dialog.querySelectorAll('[data-apply-mode]').forEach(button=>button.addEventListener('click',()=>{
  target=button.dataset.applyMode;dialog.querySelectorAll('[data-apply-mode]').forEach(n=>{n.classList.toggle('active',n===button);n.setAttribute('aria-pressed',String(n===button));});
 }));
 $('htmlImportMapApply').addEventListener('click',()=>{
  if(!selection || !canRegenerate())return;const value=$('htmlImportMapping').value;
  const nodes=$('htmlImportMapAll').checked?Array.from(model.root.querySelectorAll(selection.tagName.toLowerCase())):[selection];
  nodes.forEach(node=>{const id=node.getAttribute('data-import-id');if(value==='auto')choices.delete(id);else choices.set(id,value);choices.set(id+':language',$('htmlImportLanguage').value);});regenerate();
 });
 $('htmlImportOutput').addEventListener('input',()=>{dirty=true;$('htmlImportApply').disabled=true;$('htmlImportStatus').textContent='변환 결과 확인 중…';previewJob.schedule();});
 $('htmlImportAutoAll').addEventListener('click',()=>{if(!model || !sourceReady || !canRegenerate())return;const count=result?.issues.filter(issue=>!issue.choice || (mode==='strict' && issue.choice==='html')).length||0;HtmlToMarkdown.autoResolve(model,mode,choices);regenerate();$('htmlImportAutoSummary').textContent=count+'개 자동 적용 · '+(mode==='strict'?'표·배치를 단순화하고 변환할 수 없는 수식·미디어는 원본 코드로 유지합니다. 결과를 확인해주세요.':'표현이 어려운 구조는 HTML 블록으로 유지합니다.');});
 $('htmlImportApply').addEventListener('click',()=>{
  previewJob.flush();
  if(!result || result.unresolved || !sourceReady)return;
  if(editor.getValue()!==before){$('htmlImportStatus').textContent='편집기 내용이 변경됐습니다. 모달을 닫고 다시 열어주세요.';return;}
  const text=HtmlToMarkdown.compact($('htmlImportOutput').value);
  if(validateResult().length)return;
  if(target==='replace' && before.trim() && !confirm('변환한 Markdown으로 현재 문서 전체를 교체합니다. 계속할까요?'))return;
  backup();editor.operation(()=>{if(target==='replace')editor.replaceRange(text,{line:0,ch:0},editor.posFromIndex(before.length),'html-import');else editor.replaceRange('\n\n'+text+'\n',insertion,insertion,'html-import');});close();status('HTML을 Markdown으로 변환해 '+(target==='replace'?'문서를 교체했습니다.':'삽입했습니다.'),false);
 });
}};

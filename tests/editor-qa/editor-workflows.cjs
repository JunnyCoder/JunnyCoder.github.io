const assert=require('node:assert/strict');
const markdown=require('./markdown-fixture.cjs'), pdf=require('./app-fixture.cjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let checks=0,failures=0;const opened=[];
async function md(...args){const app=await markdown(...args);opened.push(app);return app;}
async function paper(...args){const app=await pdf(...args);opened.push(app);return app;}
async function check(name,task){checks++;try{await task();console.log('PASS:',name);}catch(error){failures++;console.error('FAIL:',name,'\n',error.stack);}finally{opened.splice(0).forEach(app=>app.dom.window.close());}}
function fileInput(app,id,file){Object.defineProperty(app.$(id),'files',{configurable:true,value:[file]});app.$(id).dispatchEvent(new app.w.Event('change',{bubbles:true}));}
async function blobText(w,blob){return new Promise((resolve,reject)=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsText(blob);});}
(async()=>{
 await check('Markdown: literal find/replace, grouped undo, headings outside code, source download',async()=>{
  const original='# Java\n\nA+B a+b A+B\n\n```java\n# not a heading\n```\n\n## Spring\n';
  const p=await md(original),{$,cm,w}=p;
  $('findBtn').click();$('findInput').value='A+B';$('findInput').dispatchEvent(new w.Event('input'));assert.equal($('findCount').textContent,'3개 일치');
  $('findCase').checked=true;$('findCase').dispatchEvent(new w.Event('input'));assert.equal($('findCount').textContent,'2개 일치');
  $('replaceInput').value='$value';$('replaceAll').click();assert(cm.getValue().includes('$value a+b $value'));cm.undo();assert.equal(cm.getValue(),original);
  $('outlineBtn').click();assert.equal($('mdOutlineList').querySelectorAll('button').length,2);
  $('mdOutlineList').querySelectorAll('button')[1].click();assert.equal(cm.getCursor().line,8);
  let saved;w.URL.createObjectURL=blob=>{saved=blob;return 'blob:qa';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
  $('downloadMdBtn').click();assert.equal(await blobText(w,saved),original);
  assert.equal(p.errors.length,0);
 });
 await check('Markdown: narrow screens start with a full-width editor and retain preview/source switching',async()=>{
  const p=await md('# Mobile',{setup(w){w.matchMedia=()=>({matches:true});}}),{$,w}=p;
  const button=mode=>$('viewSegment').querySelector(`[data-mode="${mode}"]`);
  assert.equal($('panePreview').style.display,'none');assert.equal(button('editor').getAttribute('aria-pressed'),'true');
  button('preview').click();assert.equal($('paneEditor').style.display,'none');assert.equal($('panePreview').style.display,'flex');
  button('split').click();assert.equal($('paneEditor').style.display,'flex');assert.equal($('panePreview').style.display,'flex');
  assert.equal(p.cm.getValue(),'# Mobile');assert.equal(p.errors.length,0);
 });
 await check('Markdown: corrupt history entries are skipped and valid records can be restored',async()=>{
  const p=await md('# Current',{setup(w){w.localStorage.setItem('mdeditor.history.v1',JSON.stringify([null,{}, {ts:1,content:'# Saved'}]));}});
  p.$('historyBtn').click();assert.equal(p.errors.length,0,p.errors.map(e=>e.message).join('\n'));
  assert.equal(p.$('historyList').querySelectorAll('.history-item').length,1);
  p.$('historyList').querySelector('.history-item-preview').click();assert.equal(p.cm.getValue(),'# Saved');
 });
 await check('Markdown: failed/cancelled/stale imports preserve edits; multi-tab conflict is explicit',async()=>{
  const p=await md('# Current'),{$,cm,w}=p;let resolve;
  fileInput(p,'openMdInput',{name:'slow.md',text:()=>new Promise(r=>resolve=r)});cm.setValue('# New edit');resolve('# File');await wait(10);assert.equal(cm.getValue(),'# New edit');
  w.confirm=()=>false;fileInput(p,'openMdInput',{name:'cancel.md',text:async()=> '# Cancelled'});await wait(10);assert.equal(cm.getValue(),'# New edit');
  fileInput(p,'openMdInput',{name:'bad.md',text:async()=>{throw Error('unreadable');}});await wait(10);assert.equal(cm.getValue(),'# New edit');
  w.localStorage.setItem('mdeditor.autosave.v1','# Other tab');w.dispatchEvent(new w.StorageEvent('storage',{key:'mdeditor.autosave.v1',newValue:'# Other tab'}));
  $('tempSaveBtn').click();assert.equal(w.localStorage.getItem('mdeditor.autosave.v1'),'# Other tab');assert(!$('mdConflict').hidden);
  w.confirm=()=>true;$('mdLoadRemote').click();assert.equal(cm.getValue(),'# Other tab');
  w.Storage.prototype.setItem=()=>{throw Error('Quota');};$('tempSaveBtn').click();assert($('mdSaveStatus').textContent.includes('실패'));
  assert.equal(p.errors.length,0);
 });
 await check('PDF: corruption in a saved draft does not prevent a Markdown transfer',async()=>{
  const p=await paper('{broken',{setup(w){w.localStorage.setItem('pdfMakerTransfer','# Transferred\n\nKept content.');}});
  await wait(350);assert(p.$('sourceContent').textContent.includes('Transferred'));assert.equal(p.w.localStorage.getItem('pdfMakerTransfer'),null);assert.equal(p.errors.length,0);
 });
 await check('PDF: delayed file reads do not overwrite settings changed during import',async()=>{
  const p=await paper();await p.load('# Existing','old.md');let resolve;
  fileInput(p,'mdFileInput',{name:'new.md',text:()=>new Promise(r=>resolve=r)});await wait(0);p.$('confirmDocumentActionBtn').click();await wait(0);
  await p.input('fontSize','17');resolve('# Delayed file');await wait(30);
  assert.equal(p.$('fontSize').value,'17');assert(p.$('sourceContent').textContent.includes('Existing'));
 });
 await check('PDF: project save/reopen, malformed project atomicity and cancelled replacement',async()=>{
  const p=await paper();await p.load('# Portable\n\n## Section\n\nText.','portable.md');await p.input('fontSize','14');
  let saved;p.w.FileDownload.save=(name,blob)=>saved={name,blob};p.$('saveProjectBtn').click();await wait(15);
  assert(saved.name.endsWith('.jpdf.json'));const project=await blobText(p.w,saved.blob),parsed=JSON.parse(project);assert.equal(parsed.state.settings.fontSize,14);
  const before=p.$('sourceContent').textContent;fileInput(p,'projectFileInput',{name:'bad.jpdf.json',size:10,text:async()=>'{broken'});await wait(10);assert.equal(p.$('sourceContent').textContent,before);
  fileInput(p,'projectFileInput',{name:'ok.jpdf.json',size:project.length,text:async()=>project});await wait(10);assert(p.$('confirmDocumentDialog').open);p.$('cancelDocumentActionBtn').click();await wait(10);assert.equal(p.$('sourceContent').textContent,before);
  const other=await paper();fileInput(other,'projectFileInput',{name:'ok.jpdf.json',size:project.length,text:async()=>project});await wait(40);assert.equal(other.$('fontSize').value,'14');assert.equal(other.$('sourceContent').textContent,before);assert.equal(other.errors.length,0);
 });
 await check('PDF: cover/TOC, all themes, pagination/zoom, delete undo/redo and print',async()=>{
  const p=await paper();await p.load('# First\n\nText\n\n## Second\n\nTail.','layout.md');
  p.$('generateCoverBtn').click();p.$('generateTocBtn').click();await wait(30);assert(p.$('sourceContent').querySelector('.cover-page'));assert(p.$('pdfPreviewContainer').querySelector('.toc-item'));
  for(const option of p.$('colorTheme').options){await p.input('colorTheme',option.value);assert(p.pages().length>=2);}
  p.$('pdfZoom').value='fit';p.$('pdfZoom').dispatchEvent(new p.w.Event('change'));assert(Number(p.$('pdfPreviewContainer').dataset.zoom)>0);
  p.$('pageJump').value='999';p.$('jumpPageBtn').click();assert.equal(Number(p.$('pageJump').value),p.pages().length);
  const source=p.$('sourceContent'),paragraph=source.querySelector(':scope > p'),id=paragraph.dataset.blockId;
  p.$('toggleDeleteMode').click();p.$('pdfPreviewContainer').querySelector(`[data-block-id="${id}"]`).click();assert.equal(paragraph.style.display,'none');
  p.$('undoBtn').click();assert.notEqual(source.querySelector(`[data-block-id="${id}"]`).style.display,'none');p.$('redoBtn').click();assert.equal(source.querySelector(`[data-block-id="${id}"]`).style.display,'none');p.$('undoBtn').click();
  let prints=0;p.w.print=()=>prints++;p.$('downloadPdfBtn').click();await wait(40);assert.equal(prints,1);assert(!p.$('downloadPdfBtn').disabled);
  assert.equal(p.errors.length,0,p.errors.map(e=>e.message).join('\n'));
 });
 await check('PDF: narrow-screen panel switches preserve selection, pagination and navigation',async()=>{
  const p=await paper(null,{setup(w){w.matchMedia=()=>({matches:true});}}),{$,w}=p;
  await p.load('# Mobile\n\nEditable content.','mobile.md');
  assert.equal($('pdfZoom').value,'fit');assert($('elementPanelBtn').disabled);
  const button=name=>w.document.querySelector(`[data-pdf-panel="${name}"]`);
  button('settings').click();await p.input('fontSize','14');assert.equal($('pdfWorkspace').dataset.mobilePanel,'settings');
  assert(p.pages().length);button('document').click();
  $('pdfPreviewContainer').querySelector('p[data-element-id]').click();assert(!$('elementPanelBtn').disabled);
  button('element').click();assert.equal($('pdfWorkspace').dataset.mobilePanel,'element');assert.equal(button('element').getAttribute('aria-pressed'),'true');
  $('nextPageBtn').click();assert.equal($('pdfWorkspace').dataset.mobilePanel,'document');
  button('element').click();$('toggleDeleteMode').click();button('document').click();
  $('pdfPreviewContainer').querySelector('p[data-element-id]').click();assert($('elementPanelBtn').disabled);
  assert.equal($('pdfWorkspace').dataset.mobilePanel,'document');assert.equal(p.errors.length,0);
 });
 await check('PDF: draft conflict suspends saving and storage failure preserves in-memory content',async()=>{
  const p=await paper();await p.load('# Local','local.md');p.w.dispatchEvent(new p.w.Event('pagehide'));
  const remote=JSON.stringify({html:'<h1>Other</h1>',settings:{fontSize:12},title:'Other'});
  p.w.localStorage.setItem('pdfmaker.draft.v1',remote);p.w.dispatchEvent(new p.w.StorageEvent('storage',{key:'pdfmaker.draft.v1',newValue:remote}));
  await p.input('fontSize','15');p.w.dispatchEvent(new p.w.Event('pagehide'));assert.equal(p.w.localStorage.getItem('pdfmaker.draft.v1'),remote);assert(!p.$('pdfConflict').hidden);
  p.$('pdfLoadRemote').click();await wait(0);p.$('confirmDocumentActionBtn').click();await wait(20);assert(p.$('sourceContent').textContent.includes('Other'));
  p.w.Storage.prototype.setItem=()=>{throw Error('Quota');};p.w.dispatchEvent(new p.w.Event('pagehide'));assert(p.$('documentStatus').textContent.includes('저장'));assert(p.$('sourceContent').textContent.includes('Other'));assert.equal(p.errors.length,0);
 });
 await check('PDF: invalid saved documents are not silently overwritten by an empty autosave',async()=>{
  for (const value of ['{broken', JSON.stringify({html:'<p>Retain</p>',settings:{},importedStyles:{css:[42]}})]) {
    const p=await paper(value);await wait(300);assert.equal(p.w.localStorage.getItem('pdfmaker.draft.v1'),value);
    assert(p.$('projectStatus').textContent.includes('읽지 못했습니다'));assert.equal(p.errors.length,0);
  }
 });
 console.log(`${checks-failures}/${checks} editor workflow groups passed.`);if(failures)process.exit(1);
})().catch(error=>{opened.forEach(p=>p.dom.window.close());console.error(error);process.exit(1);});

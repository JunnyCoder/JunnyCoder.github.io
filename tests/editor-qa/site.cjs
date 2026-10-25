const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, ResourceLoader, VirtualConsole} = require('jsdom');
const root = process.env.SITE_ROOT || path.resolve(__dirname, '../..');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let failures = 0, checks = 0;
const open = new Set();

class LocalResources extends ResourceLoader {
  fetch(url) {
    const u = new URL(url);
    let file;
    if (u.hostname === 'site.test') file = path.join(root, decodeURIComponent(u.pathname));
    else if (/\/katex(?:\.min)?\.js$/.test(u.pathname)) file = require.resolve('katex/dist/katex.min.js');
    else if (/\/auto-render\.min\.js$/.test(u.pathname)) file = require.resolve('katex/dist/contrib/auto-render.min.js');
    else if (/\/purify\.min\.js$/.test(u.pathname)) file = path.join(root, 'tools/libs/purify.min.js');
    else if (/\/highlight\.min\.js$/.test(u.pathname)) file = path.join(root, 'tools/libs/highlight.min.js');
    if (file && fs.existsSync(file)) {
      const request=Promise.resolve(fs.readFileSync(file)); request.abort=()=>{}; return request;
    }
    return null;
  }
}
async function page(file, options={}) {
  const errors = [], alerts = [], console = new VirtualConsole();
  console.on('jsdomError', error => { if (!/CSS stylesheet/.test(error.message)) errors.push(error); });
  const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'), {
    url:'https://site.test/' + file + (options.query || ''), runScripts:'dangerously',
    resources:new LocalResources(), pretendToBeVisual:true, virtualConsole:console,
    beforeParse(w) {
      w.alert = message => alerts.push(message); w.confirm = () => true;
      w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
      w.matchMedia = () => ({matches:false, addEventListener(){},removeEventListener(){}});
      w.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
      w.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new w.Event('close')); };
      Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}});
      for (const [key, value] of Object.entries(options.storage || {})) w.localStorage.setItem(key, value);
      if (options.storageBlocked) Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Blocked','SecurityError');}});
      options.setup?.(w);
    }
  });
  open.add(dom);
  await new Promise((resolve,reject) => {
    const timer = setTimeout(() => reject(Error('Page load timed out: '+file)), 5000);
    dom.window.addEventListener('load', () => {clearTimeout(timer); resolve();}, {once:true});
  });
  await wait(20);
  const w = dom.window, $ = selector => w.document.querySelector(selector);
  return {dom,w,$,errors,alerts,close(){dom.window.close(); open.delete(dom);}};
}
async function check(name, task) {
  checks++;
  try { await task(); console.log('PASS:',name); }
  catch(error) { failures++; console.error('FAIL:',name,'\n',error.stack); }
  finally { for (const dom of open) dom.window.close(); open.clear(); }
}
const quiz = () => ({topics:[{id:1,topic:'Java',questions:[
  {id:'Q1',type:'객관식',question:'One?',choices:['A','B'],answer:'1',explanation:'First'},
  {id:'Q2',type:'객관식',question:'Two?',choices:['A','B'],answer:2,explanation:'Second'},
  {id:'Q3',type:'주관식',question:'Explain',answer:'Reason',explanation:'Explain it'}
]}]});
function choose(p,index,value) {
  const q = p.w.document.querySelectorAll('.q')[index];
  const input = q.querySelector(`input[value="${value}"]`);
  input.checked = true; input.dispatchEvent(new p.w.Event('change',{bubbles:true}));
}

(async()=>{
  await check('home: every detail/tab, keyboard navigation, anchors, dialog focus and copy failure',async()=>{
    const p = await page('index.html'), {w,$} = p;
    $('#mobile-toggle').click(); assert.equal($('#mobile-toggle').getAttribute('aria-expanded'),'true');
    w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal($('#mobile-toggle').getAttribute('aria-expanded'),'false');
    $('#tab-engineering').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    assert.equal($('#tab-ai-tools').getAttribute('aria-selected'),'true');
    for (const button of w.document.querySelectorAll('[data-detail]')) {
      button.click(); assert($('#detail-dialog').open); assert($('#detail-title').textContent);
      const count = w.document.querySelectorAll('[data-detail-tab]').length;
      for (let i=0;i<count;i++) {
        $(`[data-detail-tab="${i}"]`).click();
        assert.equal($('#detail-tabpanel').getAttribute('aria-labelledby'),`detail-tab-${i}`);
        assert($('#detail-tabpanel').textContent.trim());
        for (const image of $('#detail-tabpanel').querySelectorAll('img')) assert(fs.existsSync(path.join(root,image.getAttribute('src'))));
      }
      $('#close-detail').click(); assert(!$('#detail-dialog').open); assert.equal(w.document.activeElement,button);
    }
    w.navigator.clipboard.writeText = async()=>{throw Error('Denied');}; $('#copy-email').click(); await wait(0);
    assert($('#copy-status').textContent.includes('이메일 링크'));
    assert.equal(p.errors.length,0,p.errors.map(e=>e.message).join('\n'));
  });
  await check('resume modal: language switch, sender validation, close, iframe cleanup',async()=>{
    const p = await page('index.html'),{w,$}=p;
    $('[data-resume-open]').click(); assert($('#resume-dialog').open); assert($('#resume-print').disabled);
    $('[data-resume-language="en"]').click(); assert($('#resume-content iframe').src.endsWith('?lang=en'));
    const frame=$('#resume-content iframe');
    w.dispatchEvent(new w.MessageEvent('message',{origin:'https://wrong.test',source:frame.contentWindow,data:{type:'resume-viewer',language:'en',ready:true}}));
    assert($('#resume-print').disabled);
    w.dispatchEvent(new w.MessageEvent('message',{origin:w.location.origin,source:frame.contentWindow,data:{type:'resume-viewer',language:'en',ready:true}}));
    assert(!$('#resume-print').disabled);
    $('#resume-close').click(); assert(!$('#resume-content iframe')); assert($('#resume-print').disabled);
  });
  await check('Jekyll dashboard: only public tools, real SSAFY links',async()=>{
    const p = await page('tools/index.html');
    assert.deepEqual(Array.from(p.w.document.querySelectorAll('.card-btn'),a=>a.getAttribute('href')).sort(),['markdown-editor.html','pdf-maker.html','self-testing-quiz-bank.html']);
    const ssafy=await page('ssafy/index.html'); assert(ssafy.$('a[href="lunchmate.html"]'));
  });
  await check('quiz: corrupted and blocked storage leave uploads and theme usable',async()=>{
    for (const options of [{storage:{quizBank_datasets:'{broken',quizBank_answers:'{broken'}},{storageBlocked:true}]) {
      const p = await page('tools/self-testing-quiz-bank.html',options);
      p.w.processJSON(quiz(),'valid.json'); assert.equal(p.w.document.querySelectorAll('.q').length,3);
      p.w.toggleTheme(); assert.equal(p.$('html').dataset.theme,'dark');
      assert.equal(p.errors.length,0,p.errors.map(e=>e.message).join('\n'));
      assert(p.$('#storage-status') && !p.$('#storage-status').hidden);
    }
  });
  await check('quiz: imported datasets isolate answers with identical original question IDs',async()=>{
    const p=await page('tools/self-testing-quiz-bank.html'); p.w.processJSON(quiz(),'first.json');
    choose(p,0,'1'); p.w.processJSON(quiz(),'second.json');
    p.w.document.querySelectorAll('.ds-tab-item')[1].querySelector('button,span').click();
    assert.equal(p.w.document.querySelectorAll('.q input:checked').length,0);
    choose(p,0,'2');
    p.w.document.querySelectorAll('.ds-tab-item')[0].querySelector('button,span').click();
    assert.equal(p.$('.q input:checked').value,'1');
  });
  await check('quiz: single-view all-grading and progress include offscreen saved answers',async()=>{
    const p=await page('tools/self-testing-quiz-bank.html'); p.w.processJSON(quiz(),'valid.json');
    choose(p,0,'1'); choose(p,1,'2');
    const answer=p.$('.q textarea'); answer.value='Reason'; answer.dispatchEvent(new p.w.Event('input',{bubbles:true}));
    p.w.toggleViewMode(); assert.equal(p.w.document.querySelectorAll('.q').length,1);
    assert.equal(p.$('#bar').style.width,'100%');
    p.w.evaluateAll(false); assert(p.alerts.at(-1).includes('2문제 중 2문제 정답'));
    p.w.changeSingleView(1); assert(p.$('.result').classList.contains('correct'));
    choose(p,0,'1'); assert(!p.$('.result').classList.contains('correct'));
    p.w.toggleViewMode(); p.w.setStatusFilter('all');
    const all=p.$('#topicSelectAll'); all.checked=false; p.w.handleTopicSelectAll(all);
    assert.equal(p.w.document.querySelectorAll('.q').length,0); assert.equal(p.$('#bar').style.width,'0%');
  });
  await check('quiz: schema failures are atomic; imported HTML and filenames are safe',async()=>{
    const p=await page('tools/self-testing-quiz-bank.html'); p.w.processJSON(quiz(),'valid.json');
    const invalid=quiz(); invalid.topics[0].questions[0].choices=null;
    p.w.processJSON(invalid,'invalid.json'); assert.equal(p.w.document.querySelectorAll('.ds-tab-item').length,1);
    const rich=quiz(); rich.topics[0].questions[0].question='<b>Keep bold</b><img src=x onerror="window.injected=1"><script>window.injected=1<\/script>';
    p.w.processJSON(rich,'<img src=x onerror="window.injected=1">.json');
    p.w.document.querySelectorAll('.ds-tab-item')[1].querySelector('button,span').click();
    assert(p.$('.question b')); assert(!p.$('.question script')); assert(!p.$('.question [onerror]'));
    assert(!p.$('.ds-tab-item img')); assert.equal(p.w.injected,undefined);
    p.$('#singleKeywordInput').value='<img src=x>'; p.w.addSingleKeyword(); assert(!p.$('#keywordChipsContainer img'));
  });
  await check('quiz: existing saved answers migrate, reset/remove affect only the selected dataset',async()=>{
    const old={id:'ds_old',name:'old.json',questions:quiz().topics[0].questions.map(q=>({...q,topicId:1,topic:'Java'}))};
    const p=await page('tools/self-testing-quiz-bank.html',{storage:{quizBank_datasets:JSON.stringify([old]),quizBank_answers:JSON.stringify({Q1:'1'})}});
    assert.equal(p.$('.q input:checked').value,'1');
    p.w.processJSON(quiz(),'second.json'); p.$('#deleteDatasetBtn').click();
    assert.equal(p.w.document.querySelectorAll('.ds-tab-item').length,1);
    assert.equal(p.w.document.querySelectorAll('.q input:checked').length,0);
    p.$('#deleteDatasetBtn').click(); assert.equal(p.$('#floatingMenu').style.display,'none'); assert.equal(p.$('#fmToggleBtn').style.display,'none');
    assert.equal(p.w.document.querySelectorAll('.ds-tab-item').length,0);
  });
  await check('quiz prompt: tabs, delimiter, valid example JSON, clipboard rejection',async()=>{
    const p=await page('tools/self-testing-quiz-bank.html');
    p.w.switchTab('prompt'); assert(p.$('#tab-prompt').classList.contains('active'));
    p.$('#pgRawKeywords').value='Java\nSpring  SQL'; p.w.convertKeywords(); p.w.generatePrompt();
    const prompt=p.$('#pgResult').value; assert(prompt.includes('- Java')); assert(prompt.includes('- Spring')); assert(prompt.includes('- SQL'));
    const sample=prompt.slice(prompt.indexOf('{\n  "topics"')).trim(); assert(JSON.parse(sample).topics);
    p.w.navigator.clipboard.writeText=async()=>{throw Error('Denied');}; await p.w.copyPrompt();
    assert(p.alerts.at(-1).includes('복사'));
    assert.equal(p.errors.length,0,p.errors.map(e=>e.message).join('\n'));
  });
  await check('lunchmate: limit recovery, complete teams, share URL reload and history',async()=>{
    const p=await page('ssafy/lunchmate.html'),{w,$}=p;
    $('#namesInput').value=Array.from({length:31},(_,i)=>'Person '+i).join(','); $('#namesInput').dispatchEvent(new w.Event('input'));
    assert($('#generateBtn').disabled); $('#defaultBtn').click(); assert(!$('#generateBtn').disabled);
    const names=['가','나','다','라','마']; $('#namesInput').value=names.join(','); $('#namesInput').dispatchEvent(new w.Event('input'));
    $('#generateBtn').click(); assert.equal(w.document.querySelectorAll('.team-card li').length,5);
    const query=w.location.search, shared=await page('ssafy/lunchmate.html',{query});
    assert.deepEqual(Array.from(shared.w.document.querySelectorAll('.team-card li'),n=>n.textContent).sort(),names.sort());
    w.history.replaceState({},'',w.location.pathname); w.dispatchEvent(new w.PopStateEvent('popstate'));
    assert.equal($('#input-section').style.display,'block');
    assert.equal(p.errors.length,0);
  });
  await check('lunchmate: malformed shares recover; unavailable clipboard gives usable fallback',async()=>{
    const query='?data='+encodeURIComponent(btoa(encodeURIComponent(JSON.stringify([['valid'],[5]]))));
    const p=await page('ssafy/lunchmate.html',{query});
    assert.equal(p.$('#input-section').style.display,'block'); assert.equal(p.w.location.search,''); assert(p.alerts.length);
    p.$('#namesInput').value='A,B'; p.$('#generateBtn').click();
    Object.defineProperty(p.w.navigator,'clipboard',{value:undefined}); p.$('#copyBtn').click(); await wait(0);
    assert.equal(p.errors.length,0); assert.notEqual(p.$('#shareUrlDisplay').style.display,'none');
  });
  console.log(`${checks-failures}/${checks} site behavior groups passed.`);
  if(failures) process.exit(1);
})().catch(error=>{for(const dom of open)dom.window.close(); console.error(error);process.exit(1);});

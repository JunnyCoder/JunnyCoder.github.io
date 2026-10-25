// Disposable Safari inputs; never add these documents to assets/resume.
const fs=require('node:fs'),path=require('node:path');
const app=require('./app-fixture.cjs');
const root=path.resolve(__dirname,'../..');
const qa=process.env.PAGES_QA_DIR || path.join(root,'.pages-qa');
const dir=path.join(qa,'fixtures');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 const code=Array.from({length:65},(_,i)=>`System.out.println("Record ${i+1}");`).join('\n');
 const markdown='# QA Document\n\nThis is a disposable test document, not a résumé.\n\n## Backend\n\nJava · C# · DevOps · 한글 문서 검증\n\nInline formula: $E=mc^2$.\n\n### Java sample\n\n```java linenums start=1\n'+code+'\n```\n\n## Validation\n\n| Check | Result |\n| --- | --- |\n| Content | Preserved |\n| Math | $x^2+y^2$ |\n\n<table><tbody><tr><th colspan="2">Merged cells</th></tr><tr><td rowspan="2">Group</td><td>First</td></tr><tr><td>Last</td></tr></tbody></table>\n\nEND OF QA DOCUMENT.\n';
 fs.writeFileSync(path.join(dir,'document.md'),markdown);
 fs.writeFileSync(path.join(dir,'quiz.json'),JSON.stringify({topics:[{id:1,topic:'Backend QA',questions:[
  {id:'Q1',type:'객관식',difficulty:'easy',question:'Which protocol is used for web requests?',choices:['HTTP','SQL'],answer:'1',explanation:'HTTP carries web requests.'},
  {id:'Q2',type:'객관식',difficulty:'medium',question:'Select the Java keyword.',choices:['var','class'],answer:'2',explanation:'class declares a Java class.'},
  {id:'Q3',type:'주관식',difficulty:'medium',question:'Describe a database transaction.',answer:'An atomic unit of work.',explanation:'ACID properties.'}
 ]}]},null,2));
 fs.writeFileSync(path.join(dir,'document.html'),'<!doctype html><html><head><title>Imported QA</title><link rel="stylesheet" href="document.css"></head><body><h1>HTML import QA</h1><p>Preserved content and styles.</p><table><tr><td>A</td><td>B</td></tr></table></body></html>');
 fs.writeFileSync(path.join(dir,'document.css'),'body { font-size: 14pt; color: #213f35; } h1 { border-bottom: 2px solid #507c60; }');
 const p=await app();await p.load(markdown,'QA-document.md');p.$('generateCoverBtn').click();p.$('generateTocBtn').click();
 p.$('enableHeaderFooter').checked=true;p.$('enableHeaderFooter').dispatchEvent(new p.w.Event('input',{bubbles:true}));
 await wait(150);p.w.dispatchEvent(new p.w.Event('pagehide'));
 const state=JSON.parse(p.w.localStorage.getItem('pdfmaker.draft.v1'));
 state.html+='<figure><img data-image-asset="qa-logo" data-pdf-image="true" data-image-width="25" alt="QA image"><figcaption>Embedded image fixture</figcaption></figure>';
 const asset={id:'qa-logo',name:'logo.png',type:'image/png',data:fs.readFileSync(path.join(root,'assets/img/logo.png')).toString('base64')};
 fs.copyFileSync(path.join(root,'assets/img/logo.png'),path.join(dir,'image.png'));
 fs.writeFileSync(path.join(dir,'resume.jpdf.json'),JSON.stringify({format:'junny-pdf-project',version:1,state,assets:[asset]}));
 p.dom.window.close();console.log('Safari fixtures:',dir);
})().catch(error=>{console.error(error);process.exit(1);});

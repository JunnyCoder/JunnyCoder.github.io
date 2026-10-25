const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeHtml = value => DOMPurify.sanitize(String(value ?? ''), {
  USE_PROFILES: {html: true},
  FORBID_TAGS: ['style','form','input','button','textarea','select','iframe','object','embed'],
  FORBID_ATTR: ['id','name','style']
});
function storageNotice(message) {
  const status = $('#storage-status'); status.textContent = message; status.hidden = false;
}
function readStored(key, fallback, json = true) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : json ? JSON.parse(value) : value;
  } catch (_) {
    storageNotice('저장된 기록을 불러오지 못했습니다. 파일을 다시 열어 계속 사용할 수 있습니다.');
    return fallback;
  }
}
function persist(key, value, json = true) {
  try { localStorage.setItem(key, json ? JSON.stringify(value) : value); }
  catch (_) { storageNotice('브라우저에 저장하지 못했습니다. 현재 탭에서는 사용할 수 있지만 닫으면 새 기록이 사라집니다.'); }
}

// --- Theme Management ---
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  persist('quizBank_theme', newTheme, false);
  updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
  const btn = $('#themeToggleBtn');
  if (theme === 'dark') {
    btn.textContent = '☀️ 라이트모드';
  } else {
    btn.textContent = '🌙 다크모드';
  }
}

// --- State Variables ---
let datasets = []; 
let currentDsId = null;
let userAnswers = {}; 
let userResults = {}; 
let shuffledOrder = {}; 
let isSingleView = false; 
let singleViewIndex = 0; 
let isGrouped = false; // 주제별 묶음 모드 여부
let statusFilter = 'all'; // 'all', 'unsolved', 'wrong'

function saveDatasets() { persist('quizBank_datasets', datasets); }
function saveAnswers() { persist('quizBank_answers', userAnswers); }
function saveResults() { persist('quizBank_results', userResults); }

window.onload = () => {
  const savedTheme = readStored('quizBank_theme', 'light', false) === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);

  const restored = QuizData.restore(readStored('quizBank_datasets', []), readStored('quizBank_answers', {}), readStored('quizBank_results', {}));
  datasets = restored.datasets; userAnswers = restored.answers; userResults = restored.results;
  if (restored.skipped) storageNotice('일부 저장된 문제집의 형식이 올바르지 않아 불러오지 못했습니다. 원본 파일을 다시 열어주세요.');

  if (datasets.length) {
    if (datasets.length > 0) {
      $('#dropArea').style.display = 'none';
      $('#quizToolbarWrap').style.display = 'block';
      $('#fmToggleBtn').style.display = 'block';
      renderDatasetTabs();
      switchDataset(datasets[0].id);
    }
  }
};

window.addEventListener('click', function(e) {
  const customSelect = $('#topicCustomSelect');
  if (customSelect && !customSelect.contains(e.target)) {
    $('#topicDropdownList').classList.remove('show');
    $('#topicTrigger').setAttribute('aria-expanded', 'false');
  }
});

function handleJsonFiles(files) {
  Array.from(files).forEach(file => {
    if (!/\.json$/i.test(file.name)) {
      alert(`"${file.name}" 파일은 JSON 형식이 아닙니다.`);
      return;
    }
    if (file.size > QuizData.maxBytes) { alert('JSON 파일은 10MB 이하만 지원합니다.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        processJSON(data, file.name);
      } catch (err) {
        alert(`"${file.name}" 파싱 오류! 형식을 확인해주세요.\n` + err.message);
      }
    };
    reader.onerror = () => alert(`"${file.name}" 파일을 읽지 못했습니다. 다시 선택해주세요.`);
    reader.readAsText(file);
  });
}

function processJSON(data, fileName) {
  let dataset;
  try { dataset = QuizData.dataset(data, fileName); }
  catch (error) { alert(`"${fileName}" 파일을 불러오지 못했습니다.\n${error.message}`); return false; }
  const newDsId = dataset.id;
  datasets.push(dataset);
  saveDatasets(); 
  
  $('#dropArea').style.display = 'none';
  $('#quizToolbarWrap').style.display = 'block';
  $('#fmToggleBtn').style.display = 'block';
  toggleFloatingMenu(true);
  
  renderDatasetTabs();
  if(!currentDsId) {
    switchDataset(newDsId);
  } else {
    renderDatasetTabs();
  }
  return true;
}

function renderDatasetTabs() {
  $$('.ds-tab-item').forEach(el => el.remove());
  
  const container = $('#datasetTabs');
  const addBtn = $('.ds-add-btn');
  
  datasets.forEach(ds => {
    const btn = document.createElement('div');
    btn.className = `ds-tab ds-tab-item ${ds.id === currentDsId ? 'active' : ''}`;
    const select = document.createElement('button'); select.type = 'button'; select.textContent = ds.name;
    select.setAttribute('aria-pressed', String(ds.id === currentDsId)); select.onclick = () => switchDataset(ds.id);
    const close = document.createElement('button'); close.type = 'button'; close.textContent = '×';
    close.setAttribute('aria-label', ds.name + ' 닫기'); close.onclick = event => removeDataset(ds.id, event);
    btn.append(select, close);
    container.insertBefore(btn, addBtn);
  });
}

function removeDataset(dsId, event) {
  event?.stopPropagation();
  if(!confirm("해당 데이터 세트를 닫으시겠습니까?")) return;
  deleteDataset(dsId);
}

function deleteDataset(dsId) {
  const removed = datasets.find(ds => ds.id === dsId);
  removed?.questions.forEach(q => { delete userAnswers[q.id]; delete userResults[q.id]; });
  delete shuffledOrder[dsId];
  datasets = datasets.filter(ds => ds.id !== dsId);
  saveDatasets(); saveAnswers(); saveResults(); renderDatasetTabs();
  
  if(datasets.length > 0) {
    if(currentDsId === dsId) {
      switchDataset(datasets[0].id);
    } else {
      renderDatasetTabs();
    }
  } else {
    currentDsId = null;
    $('#dropArea').style.display = 'block';
    $('#quizToolbarWrap').style.display = 'none';
    $('#fmToggleBtn').style.display = 'none';
    $("#app").innerHTML = "";
    $("#fmNavContainer").innerHTML = "";
    $("#stats").textContent = "데이터를 업로드해주세요.";
    toggleFloatingMenu(false);
  }
}

function switchDataset(dsId) {
  const dataset = datasets.find(ds => ds.id === dsId);
  if (!dataset) return;
  currentDsId = dsId;
  singleViewIndex = 0;
  renderDatasetTabs(); 
  
  const currentQs = dataset.questions;
  const ts = [...new Map(currentQs.map(q => [q.topicId, q.topic])).entries()];
  const dropdownList = $('#topicDropdownList');
  
  let html = `
    <label class="cms-item">
      <input type="checkbox" id="topicSelectAll" onchange="handleTopicSelectAll(this)" checked> 
      <strong>전체 선택</strong>
    </label>
    <div style="height: 1px; background: var(--line); margin: 4px 0;"></div>
  `;
  
  ts.forEach(([id, name]) => {
    html += `
      <label class="cms-item">
        <input type="checkbox" class="topic-chk" value="${escapeHtml(id)}" onchange="handleTopicItemChange()" checked> 
        ${escapeHtml(id)}. ${escapeHtml(name)}
      </label>
    `;
  });
  dropdownList.innerHTML = html;
  updateTopicSelectLabel();

  $('#typeSelect').value = "all";
  render();
}

function toggleTopicDropdown() {
  const open = $('#topicDropdownList').classList.toggle('show');
  $('#topicTrigger').setAttribute('aria-expanded', String(open));
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && $('#topicDropdownList').classList.contains('show')) {
    toggleTopicDropdown(); $('#topicTrigger').focus();
  }
});

function handleTopicSelectAll(master) {
  const checkboxes = document.querySelectorAll('.topic-chk');
  checkboxes.forEach(chk => chk.checked = master.checked);
  updateTopicSelectLabel();
  render();
}

function handleTopicItemChange() {
  const checkboxes = document.querySelectorAll('.topic-chk');
  const master = document.getElementById('topicSelectAll');
  const allChecked = Array.from(checkboxes).every(chk => chk.checked);
  if (master) master.checked = allChecked;
  updateTopicSelectLabel();
  render();
}

function updateTopicSelectLabel() {
  const checkboxes = document.querySelectorAll('.topic-chk');
  const checkedItems = Array.from(checkboxes).filter(chk => chk.checked);
  const label = $('#topicSelectLabel');

  if (checkedItems.length === 0) {
    label.textContent = "주제 선택";
  } else if (checkedItems.length === checkboxes.length) {
    label.textContent = "전체 주제";
  } else {
    label.textContent = `${checkedItems.length}개 주제 선택`;
  }
}

$('#jsonUploadMain').addEventListener('change', e => {
  if(e.target.files.length) handleJsonFiles(e.target.files);
  e.target.value = '';
});

$('#jsonUploadAdd').addEventListener('change', e => {
  if(e.target.files.length) handleJsonFiles(e.target.files);
  e.target.value = ''; 
});

const dropArea = $('#dropArea');
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.style.borderColor = "var(--accent)"; });
dropArea.addEventListener('dragleave', e => { dropArea.style.borderColor = "var(--muted)"; });
dropArea.addEventListener('drop', e => {
  e.preventDefault();
  dropArea.style.borderColor = "var(--muted)";
  if(e.dataTransfer.files.length) handleJsonFiles(e.dataTransfer.files);
});

function getDifficultyBadge(diff) {
  if(!diff) return '';
  const d = diff.toLowerCase();
  if(d === 'easy') return `<span class="diff-badge diff-easy">easy</span>`;
  if(d === 'medium') return `<span class="diff-badge diff-medium">medium</span>`;
  if(d === 'hard') return `<span class="diff-badge diff-hard">hard</span>`;
  return `<span class="diff-badge diff-medium">${escapeHtml(diff)}</span>`;
}

// --- Status Filter & Grouping Actions ---
function setStatusFilter(filter) {
  statusFilter = filter;
  $('#filterAllBtn').className = filter === 'all' ? 'sm active-filter' : 'sm secondary';
  $('#filterUnsolvedBtn').className = filter === 'unsolved' ? 'sm active-filter' : 'sm secondary';
  $('#filterWrongBtn').className = filter === 'wrong' ? 'sm active-filter' : 'sm secondary';
  singleViewIndex = 0;
  render();
}

function toggleGrouping() {
  isGrouped = !isGrouped;
  const btn = $('#groupToggleBtn');
  btn.textContent = isGrouped ? '그룹 해제 (셔플 순서) 🔀' : '주제별 묶어보기 📁';
  render();
}

// --- Quiz Filtering Logic ---
function filtered() {
  if (!currentDsId) return [];
  const currentDs = datasets.find(ds => ds.id === currentDsId);
  if (!currentDs) return [];
  
  let currentQs = [...currentDs.questions];
  
  if (!isGrouped && shuffledOrder[currentDsId]) {
    currentQs.sort((a, b) => {
      const idxA = shuffledOrder[currentDsId].indexOf(a.id);
      const idxB = shuffledOrder[currentDsId].indexOf(b.id);
      return (idxA === -1 ? 9999 : idxA) - (idxB === -1 ? 9999 : idxB);
    });
  }

  const checkboxes = document.querySelectorAll('.topic-chk');
  const selectedTopics = Array.from(checkboxes).filter(chk => chk.checked).map(chk => chk.value);
  const ty = $("#typeSelect").value;

  return currentQs.filter(q => {
    const matchTopic = selectedTopics.includes(String(q.topicId));
    const matchType = (ty === "all" || q.type === ty);
    
    let matchStatus = true;
    const isAnswered = userAnswers[q.id] && userAnswers[q.id].trim() !== "";
    const isWrong = userResults[q.id] && userResults[q.id].className.includes('wrong');

    if (statusFilter === 'unsolved') {
      matchStatus = !isAnswered;
    } else if (statusFilter === 'wrong') {
      matchStatus = isWrong;
    }

    return matchTopic && matchType && matchStatus;
  });
}

function shuffleCurrentQuestions() {
  if (!currentDsId) return;
  const currentDs = datasets.find(ds => ds.id === currentDsId);
  if (!currentDs) return;
  
  let ids = currentDs.questions.map(q => q.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  shuffledOrder[currentDsId] = ids;
  isGrouped = false; 
  $('#groupToggleBtn').textContent = '주제별 묶어보기 📁';
  singleViewIndex = 0;
  render();
}

function toggleViewMode() {
  isSingleView = !isSingleView;
  const btn = $('#modeToggleBtn');
  btn.textContent = isSingleView ? '📋 전체 목록 보기' : '🎯 한 문제씩 보기';
  singleViewIndex = 0;
  render();
}

// --- Render Helper ---
function createQuestionHTML(q) {
  let input = "";
  let savedAns = userAnswers[q.id]; 
  
  if (q.type === "객관식") {
    input = `<div class="choices">${q.choices.map((c, i) => {
      let val = String(i + 1);
      let isChecked = (savedAns === val) ? "checked" : "";
      return `<label class="choice"><input type="radio" name="${q.id}" value="${val}" ${isChecked}><span>${safeHtml(c)}</span></label>`;
    }).join("")}</div>`;
  } else {
    input = `<textarea id="answer-${q.id}" aria-label="${escapeHtml(q.sourceId)} 답안" placeholder="답안을 작성하세요.">${escapeHtml(savedAns || "")}</textarea>`;
  }

  return `
    <div class="q" id="q-${q.id}">
      <div class="meta">
        <span class="topic-tag">${escapeHtml(q.topic)}</span>
        <span>${escapeHtml(q.sourceId)} · ${escapeHtml(q.type)}</span>
        ${getDifficultyBadge(q.difficulty)}
      </div>
      <div class="question">${safeHtml(q.question)}</div>
      ${input}
      <div class="q-actions">
        <button class="sm" onclick="evalSingle('${q.id}', false)">채점</button>
        <button class="sm secondary" onclick="evalSingle('${q.id}', true)">정답 및 해설 보기</button>
        <button class="sm secondary" onclick="resetSingle('${q.id}')" title="이 문제 기록 초기화">🔄 초기화</button>
      </div>
      <div class="result" id="result-${q.id}"></div>
    </div>
  `;
}

// --- Main Quiz Renderer ---
function render() {
  const qs = filtered(); 
  $("#app").innerHTML = "";
  $("#fmNavContainer").innerHTML = ""; 

  if (qs.length === 0) {
    $("#app").innerHTML = `<div style="text-align:center; padding:40px; color:var(--muted); background:var(--card); border-radius:16px; border:1px solid var(--line);">조건에 맞는 문제가 없습니다.</div>`;
    $("#stats").textContent = `현재 탭: 총 0문항`;
    updateProgressAndNav();
    return;
  }

  // Floating Nav Update
  const navContainer = $("#fmNavContainer");
  
  if (isGrouped) {
    const navGroups = new Map();
    qs.forEach(q => {
      if (!navGroups.has(q.topic)) navGroups.set(q.topic, []);
      navGroups.get(q.topic).push(q);
    });

    for (const [topic, topicQs] of navGroups) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "fm-topic-group";
      
      const titleDiv = document.createElement("div");
      titleDiv.className = "fm-topic-title";
      titleDiv.textContent = topic;
      groupDiv.appendChild(titleDiv);

      const navBox = document.createElement("div");
      navBox.className = "fm-nav";
      topicQs.forEach(q => {
        navBox.insertAdjacentHTML("beforeend", `<a href="#q-${q.id}" id="nav-${q.id}" onclick="jumpToQuestion('${q.id}')">${escapeHtml(q.sourceId)}</a>`);
      });
      groupDiv.appendChild(navBox);
      navContainer.appendChild(groupDiv);
    }
  } else {
    const navBox = document.createElement("div");
    navBox.className = "fm-nav";
    qs.forEach(q => {
      navBox.insertAdjacentHTML("beforeend", `<a href="#q-${q.id}" id="nav-${q.id}" onclick="jumpToQuestion('${q.id}')">${escapeHtml(q.sourceId)}</a>`);
    });
    navContainer.appendChild(navBox);
  }

  // Quiz Main Body Render
  if (isSingleView) {
    if (singleViewIndex >= qs.length) singleViewIndex = qs.length - 1;
    if (singleViewIndex < 0) singleViewIndex = 0;
    const q = qs[singleViewIndex];

    const sec = document.createElement("section"); 
    sec.className = "quiz-container";
    sec.innerHTML = createQuestionHTML(q) + `
      <div style="display:flex; justify-content:space-between; padding:16px; background:var(--bg); border-top:1px solid var(--line);">
        <button class="secondary sm" onclick="changeSingleView(-1)" ${singleViewIndex === 0 ? 'disabled' : ''}>⬅️ 이전 문제</button>
        <button class="primary sm" onclick="changeSingleView(1)" ${singleViewIndex === qs.length - 1 ? 'disabled' : ''}>다음 문제 ➡️</button>
      </div>
    `;
    $("#app").appendChild(sec);

  } else if (isGrouped) {
    const groups = new Map();
    qs.forEach(q => {
      if (!groups.has(q.topic)) groups.set(q.topic, []);
      groups.get(q.topic).push(q);
    });

    for (const [topic, topicQs] of groups) {
      const header = document.createElement("div");
      header.className = "topic-group-header";
      header.textContent = `📌 ${topic} (${topicQs.length}문항)`;
      $("#app").appendChild(header);

      const sec = document.createElement("section");
      sec.className = "quiz-container";
      sec.style.borderRadius = "0 0 16px 16px";
      
      let html = "";
      topicQs.forEach(q => { html += createQuestionHTML(q); });
      sec.innerHTML = html;
      $("#app").appendChild(sec);
    }
  } else {
    const sec = document.createElement("section"); 
    sec.className = "quiz-container";
    let html = "";
    qs.forEach(q => { html += createQuestionHTML(q); });
    sec.innerHTML = html;
    $("#app").appendChild(sec);
  }

  // 채점 결과 복원
  qs.forEach(q => {
    if (userResults[q.id]) {
      const resEl = $(`#result-${q.id}`);
      if (resEl) {
        resEl.className = userResults[q.id].className;
        resEl.innerHTML = safeHtml(userResults[q.id].html);
        resEl.style.display = userResults[q.id].display;
      }
    }
  });

  $("#stats").textContent = `현재 탭: 총 ${qs.length}문항`;
  updateProgressAndNav();
}

function changeSingleView(dir) {
  singleViewIndex += dir;
  render();
}

function jumpToQuestion(qId) {
  if (isSingleView) {
    const qs = filtered();
    const idx = qs.findIndex(q => q.id === qId);
    if (idx !== -1) {
      singleViewIndex = idx;
      render();
    }
  }
}

function evalSingle(qId, showOnly, batch = false) {
  const currentDs = datasets.find(ds => ds.id === currentDsId);
  if(!currentDs) return;
  const q = currentDs.questions.find(x => x.id === qId);
  const r = $(`#result-${qId}`);
  if(!q) return;
  
  let resClass = "";
  let resHtml = "";

  if (q.type === "객관식") {
    const selected = userAnswers[qId];
    if (!showOnly && !selected) {
      if (r) { r.className = "result neutral"; r.textContent = "보기 중 하나를 선택해주세요."; r.style.display = "block"; }
      return false;
    }
    
    if (showOnly) {
      resClass = "result neutral";
      resHtml = `<strong>정답:</strong> ${q.answer}<br><br><strong>해설:</strong> ${q.explanation || '해설이 없습니다.'}`;
    } else {
      const ok = selected === q.answer;
      resClass = "result " + (ok ? "correct" : "wrong");
      resHtml = ok ? `<strong>정답입니다! (${q.answer})</strong><br><br><strong>해설:</strong> ${q.explanation || ''}` 
                   : `<strong>오답입니다.</strong><br>내가 고른 답: ${escapeHtml(selected)} <br>정답: ${q.answer}<br><br><strong>해설:</strong> ${q.explanation || ''}`;
    }
  } else {
    resClass = "result neutral";
    resHtml = `<strong>예시 답안 (정답):</strong><br>${q.answer}<br><br><strong>해설:</strong><br>${q.explanation || '해설이 없습니다.'}`;
  }

  resHtml = safeHtml(resHtml);
  if (r) { r.className = resClass; r.innerHTML = resHtml; r.style.display = "block"; }

  userResults[qId] = { className: resClass, html: resHtml, display: "block" };
  if (!batch) { saveResults(); updateProgressAndNav(); }
  return resClass === 'result correct';
}

// --- 개별 문제 초기화 기능 ---
function resetSingle(qId) {
  // 1. 선택 데이터 및 결과 저장소 제거
  delete userAnswers[qId];
  delete userResults[qId];
  saveAnswers();
  saveResults();

  // 2. UI 요소 초기화 (객관식 라디오 / 주관식 텍스트)
  const radios = document.querySelectorAll(`input[name="${qId}"]`);
  radios.forEach(radio => radio.checked = false);

  const textarea = $(`#answer-${qId}`);
  if (textarea) textarea.value = "";

  // 3. 채점 결과 박스 숨기기
  const resEl = $(`#result-${qId}`);
  if (resEl) {
    resEl.style.display = "none";
    resEl.className = "result";
    resEl.innerHTML = "";
  }

  // 4. 진행도 및 내비게이션 바 상태 갱신
  updateProgressAndNav();
}

function evaluateAll(showOnly = false) {
  const qs = filtered(); 
  let mc = 0, totalMC = 0;
  
  qs.forEach(q => {
    const correct = evalSingle(q.id, showOnly, true);
    if(q.type === "객관식" && !showOnly) {
      totalMC++;
      if(correct) mc++;
    }
  });
  
  saveResults(); updateProgressAndNav();
  if (!showOnly && totalMC > 0) alert(`객관식 채점 결과: ${totalMC}문제 중 ${mc}문제 정답`);
}

function updateProgressAndNav() {
  const qs = filtered(); let done = 0;
  
  qs.forEach(q => {
    const isAttempted = Boolean(userAnswers[q.id]?.trim());
    if (isAttempted) done++;

    const navBtn = $(`#nav-${q.id}`);
    
    if (navBtn) {
        navBtn.className = ''; 
        if (userResults[q.id] && userResults[q.id].display === 'block') {
            if (userResults[q.id].className.includes('correct')) navBtn.classList.add('correct');
            else if (userResults[q.id].className.includes('wrong')) navBtn.classList.add('wrong');
            else navBtn.classList.add('attempted'); 
        } else if (isAttempted) {
            navBtn.classList.add('attempted');
        }
    }
  });
  
  $("#bar").style.width = (qs.length ? done / qs.length * 100 : 0) + "%";
}

// --- UI Utilities ---
function switchTab(tabId) {
  if (!['quiz','prompt'].includes(tabId)) return;
  $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
  $$('.tab-content').forEach(content => content.classList.remove('active'));
  $(`[data-tab-target="${tabId}"]`).classList.add('active');
  $(`#tab-${tabId}`).classList.add('active');
  $('#quizToolbarWrap').style.display = tabId === 'quiz' && datasets.length ? 'block' : 'none';
  toggleFloatingMenu(false);
}

function toggleFloatingMenu(show) {
  if (!datasets.length || !$('#tab-quiz').classList.contains('active')) {
    $('#floatingMenu').style.display = 'none'; $('#fmToggleBtn').style.display = 'none'; return;
  }
  if(show) {
    $('#floatingMenu').style.display = 'flex';
    $('#fmToggleBtn').style.display = 'none';
  } else {
    $('#floatingMenu').style.display = 'none';
    $('#fmToggleBtn').style.display = 'block';
  }
}

$("#resetBtn").onclick = () => {
  if(!confirm("현재 데이터 세트의 전체 풀이 기록 및 채점 결과를 초기화하시겠습니까?")) return;
  const currentDs = datasets.find(ds => ds.id === currentDsId);
  if(!currentDs) return;
  currentDs.questions.forEach(q => {
    delete userAnswers[q.id]; 
    delete userResults[q.id];
  }); 
  saveAnswers();
  saveResults();
  render(); 
};

$("#deleteDatasetBtn").onclick = () => {
  if(!confirm("현재 데이터 세트를 완전히 삭제하시겠습니까? (복구할 수 없습니다)")) return;
  deleteDataset(currentDsId);
};

$("#typeSelect").onchange = render;

function invalidateResult(qId) {
  delete userResults[qId]; saveResults();
  const result = document.getElementById('result-' + qId);
  if (result) { result.className = 'result'; result.style.display = 'none'; result.replaceChildren(); }
}
document.addEventListener("change", (e) => { 
  if(e.target.type === 'radio' && e.target.closest('.q')) {
    userAnswers[e.target.name] = e.target.value;
    invalidateResult(e.target.name);
    saveAnswers();
    updateProgressAndNav(); 
  }
});
document.addEventListener("input", (e) => { 
  if(e.target.tagName.toLowerCase() === 'textarea' && e.target.id.startsWith('answer-')) {
    const qId = e.target.id.replace('answer-', '');
    userAnswers[qId] = e.target.value;
    invalidateResult(qId);
    saveAnswers();
    updateProgressAndNav(); 
  }
});

// --- Prompt Generator Logic ---
let mdFiles = []; 
let keywordsList = [];

const mdDropArea = $('#mdDropArea');
document.querySelectorAll('[data-file-trigger]').forEach(trigger => trigger.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); document.getElementById(trigger.dataset.fileTrigger).click(); }
}));
mdDropArea.addEventListener('dragover', e => { e.preventDefault(); mdDropArea.style.borderColor = "var(--accent)"; });
mdDropArea.addEventListener('dragleave', e => { mdDropArea.style.borderColor = "var(--muted)"; });
mdDropArea.addEventListener('drop', e => {
  e.preventDefault();
  mdDropArea.style.borderColor = "var(--muted)";
  if(e.dataTransfer.files.length) handleMdFiles(e.dataTransfer.files);
});

$('#mdUpload').addEventListener('change', (e) => {
    if(e.target.files.length) handleMdFiles(e.target.files);
    e.target.value = ''; 
});

function handleMdFiles(files) {
  Array.from(files).forEach(file => {
    if(!/\.md$/i.test(file.name)) {
      alert(`"${file.name}" 파일은 마크다운(.md) 형식이 아닙니다.`);
      return;
    }
    if (file.size > QuizData.maxBytes) { alert('Markdown 파일은 10MB 이하만 지원합니다.'); return; }
    if(mdFiles.some(f => f.name === file.name)) return;

    const reader = new FileReader();
    reader.onload = ev => {
      mdFiles.push({ name: file.name, content: ev.target.result });
      renderMdFileList();
    };
    reader.onerror = () => alert(`"${file.name}" 파일을 읽지 못했습니다. 다시 선택해주세요.`);
    reader.readAsText(file);
  });
}

function renderMdFileList() {
  const container = $('#mdFileList');
  container.innerHTML = "";
  mdFiles.forEach((file, index) => {
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.innerHTML = `📄 ${escapeHtml(file.name)} <button type="button" aria-label="파일 제거" onclick="removeMdFile(${index})">&times;</button>`;
    container.appendChild(chip);
  });
}

function removeMdFile(index) {
  mdFiles.splice(index, 1);
  renderMdFileList();
}

// Keyword Mode Toggle
function toggleKwMode() {
  const mode = document.querySelector('input[name="kwMode"]:checked').value;
  const customBox = $('#customDelimiterBox');
  if(mode === 'custom') {
    customBox.style.display = 'block';
  } else {
    customBox.style.display = 'none';
  }
}

// Keyword Conversion Logic with Auto / Custom modes
function convertKeywords() {
  const rawText = $("#pgRawKeywords").value;
  if(!rawText.trim()) return;

  const mode = document.querySelector('input[name="kwMode"]:checked').value;
  let tokens = [];

  if(mode === 'auto') {
    // Split by 2 or more spaces, or newlines
    tokens = rawText.split(/(?:\s{2,}|\n+)/).map(t => t.trim()).filter(t => t.length > 0);
  } else {
    const delimiter = $('#pgDelimiter').value;
    if(!delimiter) {
      alert("구분자를 입력해주세요.");
      return;
    }
    // Escape special characters for RegExp safely
    const escaped = delimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    tokens = rawText.split(regex).map(t => t.trim()).filter(t => t.length > 0);
  }

  tokens.forEach(token => {
    if(!keywordsList.includes(token)) {
      keywordsList.push(token);
    }
  });

  $("#pgRawKeywords").value = "";
  renderKeywordChips();
}

function addSingleKeyword() {
  const input = $("#singleKeywordInput");
  const val = input.value.trim();
  if(!val) return;

  if(!keywordsList.includes(val)) {
    keywordsList.push(val);
  }
  input.value = "";
  renderKeywordChips();
}

function removeKeyword(index) {
  keywordsList.splice(index, 1);
  renderKeywordChips();
}

function clearKeywords() {
  keywordsList = [];
  renderKeywordChips();
}

function renderKeywordChips() {
  const container = $("#keywordChipsContainer");
  container.innerHTML = "";
  
  if(keywordsList.length === 0) {
    container.innerHTML = `<span style="color: var(--muted); font-size: 13px; align-self: center; margin: auto;">변환된 키워드가 여기에 표시됩니다.</span>`;
    return;
  }

  keywordsList.forEach((kw, index) => {
    const chip = document.createElement('div');
    chip.className = 'kw-chip';
    // # 제거된 순수 텍스트 표시
    chip.innerHTML = `${escapeHtml(kw)} <button type="button" aria-label="키워드 제거" onclick="removeKeyword(${index})">&times;</button>`;
    container.appendChild(chip);
  });
}

let urlCount = 1;
function addUrlField() {
    if(urlCount >= 10) { alert("URL은 최대 10개까지만 추가 가능합니다."); return; }
    urlCount++;
    const div = document.createElement('div');
    div.className = 'url-input-group';
    div.innerHTML = `<input type="text" class="pgUrl" aria-label="참고 URL" placeholder="추가 URL 입력..."><button type="button" class="danger sm" onclick="this.parentElement.remove(); urlCount--;">삭제</button>`;
    $('#urlContainer').appendChild(div);
}

function generatePrompt() {
  const instructions = $("#pgInstructions").value.trim();
  const mdOption = document.querySelector('input[name="mdOption"]:checked').value;
  const webSearch = $("#pgWebSearch").checked;
  const urls = Array.from($$('.pgUrl')).map(el => el.value.trim()).filter(val => val !== "");
  const countMC = $("#countMC").value.trim() || "2~3문항";
  const countShort = $("#countShort").value.trim() || "1~2문항";
  const countEssay = $("#countEssay").value.trim() || "0~1문항";
  
  if(mdFiles.length === 0 && keywordsList.length === 0 && urls.length === 0 && !instructions) {
    alert("학습 자료, 키워드, 지시사항 또는 URL 중 최소 하나는 입력해야 합니다."); return;
  }

  let prompt = `당신은 머신러닝·딥러닝 교육을 위한 퀴즈 출제 전문가입니다.\n\n아래에 제공된 학습 자료, 핵심 키워드, 외부 참고 자료 및 출제 조건을 바탕으로 학습용 퀴즈 문제를 생성하세요.\n\n출력은 반드시 하나의 유효한 JSON 파일만 출력해야 합니다.\nMarkdown 코드블록(\`\`\`json)은 절대 사용하지 마세요.\nJSON 앞뒤에 설명이나 부가 문장을 작성하지 마세요.\n\n[정보 우선순위]\n\n문제 출제에 사용하는 정보는 다음 우선순위를 따릅니다.\n\n1. 제공된 학습 자료\n2. 제공된 핵심 키워드\n3. 외부 참고 자료\n4. 웹 검색을 통한 보완 정보\n\n학습 자료를 가장 중요한 기준으로 사용하세요.\n\n`;
  
  if (webSearch) prompt += `웹 검색이 활성화되어 있으므로 필요한 경우 웹 검색을 활용하여 개념을 보완하고 정확한 해설을 작성하세요.\n`;
  if (urls.length > 0) {
      prompt += `\n[외부 참고 자료]\n\n다음 URL을 보조 자료로 활용할 수 있습니다.\n\n`;
      urls.forEach(url => prompt += `- ${url}\n`);
      prompt += `\n외부 자료는 학습 자료의 내용을 보완하거나 사실관계를 검증하는 목적으로만 사용하세요.\n`;
  }
  
  if(keywordsList.length > 0) {
    prompt += `\n[출제 핵심 키워드]\n\n`;
    keywordsList.forEach(kw => prompt += `- ${kw}\n`);
  }

  prompt += `\n[학습 자료]\n`;
  if(mdFiles.length > 0) {
      mdFiles.forEach(file => {
          if(mdOption === 'full') {
              prompt += `--- 파일 시작: ${file.name} ---\n${file.content}\n--- 파일 끝 ---\n\n`;
          } else {
              prompt += `(첨부된 파일 '${file.name}'의 내용을 반드시 읽고 문제에 반영하세요.)\n\n`;
          }
      });
  } else {
    prompt += `(첨부된 파일 없음)\n\n`;
  }

  if(instructions) {
    prompt += `[추가 지시사항]\n${instructions}\n\n`;
  }

  prompt += `[문제 수 및 유형 조건]\n`;
  prompt += `- 각 주제/키워드당 생성할 문제 수 :\n`;
  prompt += `  * 객관식: ${countMC}\n`;
  prompt += `  * 주관식: ${countShort}\n`;
  prompt += `  * 서술형: ${countEssay}\n\n`;

  prompt += `[난이도]\n모든 문제에는 difficulty 필드를 반드시 포함하고 값은 "easy", "medium", "hard" 중 하나로 지정하세요.\n\n`;

  prompt += `[출력 JSON 구조]\n\n`;
  prompt += `{
  "topics": [
    {
      "id": 1,
      "topic": "주제명",
      "questions": [
        {
          "id": "Q1-1",
          "type": "객관식",
          "difficulty": "medium",
          "related_topics": [],
          "question": "문제 내용",
          "choices": ["보기1", "보기2", "보기3", "보기4", "보기5"],
          "answer": "3",
          "explanation": "상세한 해설"
        }
      ]
    }
  ]
}\n\n`;

  $("#pgResult").value = prompt;
}

async function copyPrompt() {
  const text = $("#pgResult").value;
  if(!text) return;
  try {
    await navigator.clipboard.writeText(text);
    alert("프롬프트가 복사되었습니다!");
  } catch (_) {
    $('#pgResult').focus(); $('#pgResult').select();
    alert('자동 복사를 사용할 수 없습니다. 선택된 프롬프트를 직접 복사해주세요.');
  }
}

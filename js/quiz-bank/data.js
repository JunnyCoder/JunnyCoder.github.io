// File validation and dataset-local identifiers; no DOM or persistence effects.
window.QuizData = (() => {
  const maxBytes = 10 * 1024 * 1024, maxQuestions = 5000;
  const types = new Set(['객관식', '주관식', '연계형', '서술형']);
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const text = (value, label, allowEmpty = false) => {
    if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > 200000) {
      throw Error(label + ' 내용을 확인해주세요.');
    }
    return value;
  };
  const uid = () => 'ds_' + (globalThis.crypto?.randomUUID?.() || Date.now() + '_' + Math.random().toString(36).slice(2));
  function question(raw, dsId, index, topicId, topic) {
    if (!record(raw) || !types.has(raw.type)) throw Error('지원하지 않는 문제 유형입니다.');
    const sourceId = String(raw.sourceId ?? raw.id ?? '').trim();
    if (!sourceId || sourceId.length > 200) throw Error('문제 ID를 확인해주세요.');
    const q = {...raw, id: dsId + '_q_' + index, sourceId,
      topicId: String(topicId), topic: text(topic, '주제'),
      question: text(raw.question, '문제'), answer: text(String(raw.answer ?? ''), '정답'),
      explanation: text(raw.explanation ?? '', '해설', true),
      difficulty: ['easy','medium','hard'].includes(raw.difficulty) ? raw.difficulty : 'medium'};
    if (q.type === '객관식') {
      if (!Array.isArray(raw.choices) || raw.choices.length < 2 || raw.choices.length > 20 ||
          !raw.choices.every(choice => typeof choice === 'string' && choice.trim()) ||
          !/^\d+$/.test(q.answer) || Number(q.answer) < 1 || Number(q.answer) > raw.choices.length) {
        throw Error(sourceId + ': 객관식 보기와 정답 번호를 확인해주세요.');
      }
      q.choices = raw.choices.map(choice => text(choice, '보기'));
      q.answer = String(Number(q.answer));
    }
    return q;
  }
  function dataset(data, name) {
    if (!record(data) || !Array.isArray(data.topics) || !data.topics.length) throw Error("'topics' 배열에 주제를 추가해주세요.");
    const id = uid(), questions = [], ids = new Set(), topicIds = new Set();
    for (const topic of data.topics) {
      if (!record(topic) || !Array.isArray(topic.questions)) throw Error('주제별 questions 배열을 확인해주세요.');
      const topicId = String(topic.id ?? '');
      if (!topicId || topicIds.has(topicId)) throw Error('주제 ID가 없거나 중복되었습니다.');
      topicIds.add(topicId);
      for (const raw of topic.questions) {
        if (questions.length >= maxQuestions) throw Error('문제는 파일당 최대 ' + maxQuestions + '개까지 지원합니다.');
        const q = question(raw, id, questions.length, topicId, topic.topic);
        if (ids.has(q.sourceId)) throw Error('중복된 문제 ID: ' + q.sourceId);
        ids.add(q.sourceId); questions.push(q);
      }
    }
    if (!questions.length) throw Error('문제가 없는 파일입니다.');
    return {id, name: text(name, '파일명'), questions, version: 2};
  }
  function restore(saved, answers, results) {
    const restored = {datasets: [], answers: Object.create(null), results: Object.create(null), skipped: 0};
    if (!Array.isArray(saved)) { restored.skipped++; return restored; }
    const used = new Set();
    for (const ds of saved) {
      try {
        if (!record(ds) || !Array.isArray(ds.questions) || !ds.questions.length || ds.questions.length > maxQuestions) throw Error('Invalid dataset');
        const id = typeof ds.id === 'string' && /^ds_[\w-]+$/.test(ds.id) && !used.has(ds.id) ? ds.id : uid();
        const questions = ds.questions.map((q,i) => question(q,id,i,q.topicId,q.topic));
        const name = text(ds.name, '파일명');
        used.add(id);
        questions.forEach((q,i) => {
          const oldId = ds.questions[i].id;
          const answer = record(answers) ? (answers[q.id] ?? answers[oldId]) : null;
          if (typeof answer === 'string') restored.answers[q.id] = answer;
          const result = record(results) ? (results[q.id] ?? results[oldId]) : null;
          if (record(result) && typeof result.html === 'string' && /^result (correct|wrong|neutral)$/.test(result.className)) {
            restored.results[q.id] = {className: result.className, html: result.html, display: 'block'};
          }
        });
        restored.datasets.push({id, name, questions, version: 2});
      } catch (_) { restored.skipped++; }
    }
    return restored;
  }
  return {dataset, restore, maxBytes};
})();

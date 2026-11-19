(function () {
  'use strict';
  const data = window.SurveyData;
  const engine = window.SurveyEngine;
  const main = document.getElementById('main');
  const key = 'vector-survey-v1';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function icon(name, size) {
    const paths = {
      'up-right': '<path d="M5 19 19 5M5 5h14v14"/>',
      left: '<path d="M19 12H5m6-6-6 6 6 6"/>',
      right: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
      'down-left': '<path d="M19 5 5 19m0-12v12h12"/>',
      download: '<path d="M12 3v13m-5-5 5 5 5-5M5 17v4h14v-4"/>',
      'thumbs-up': '<path d="M8 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h4Zm0 0 5-8c2 0 3 1.5 2.5 3.5L14 10h5a3 3 0 0 1 2.9 3.7l-1.3 5A3 3 0 0 1 17.7 21H8"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      star: '<path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5"/>',
      cards: '<rect x="7" y="5" width="14" height="16" rx="2"/><path d="M16 5V3H3v14h4m4-7h6m-6 4h6"/>',
      technology: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>',
      research: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6m-11-14v6m-3-3h6"/>',
      computer: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8m-4-5v5"/>',
      microscope: '<rect x="6" y="3" width="6" height="9" rx="1"/><path d="M7 1h4M9 1v2m0 9v3m-4 2h8M3 22h18M12 7h3a6 6 0 0 1 0 12h-3m-3 0v3"/>',
      creative: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
      help: '<path d="M12 21 3.5 12.5a5.3 5.3 0 0 1 7.5-7.5l1 1 1-1a5.3 5.3 0 0 1 7.5 7.5z"/>',
      organization: '<path d="M4 22V3m0 1c5-5 10 5 16 0v12c-6 5-11-5-16 0"/>',
      analysis: '<path d="M3 21h18M6 17v-5h3v5m3 0V7h3v10m3 0V3h3v14"/>',
      communication: '<path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 11h8m-8-4h5"/>',
      nature: '<path d="M5 20C-2 5 14 1 21 3c1 13-5 18-16 17Zm0 0L16 8m-7 8v-5m0 5h5"/>'
    };
    return '<svg class="icon"' + (size ? ` width="${size}" height="${size}"` : '') + ' viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (paths[name] || paths.star) + '</svg>';
  }
  const arrow = `<span aria-hidden="true">${icon('up-right')}</span>`;
  const total = data.situations.length;
  const maxScore = data.blocks.filter(block => block.includes(data.scales[0].id)).length;
  function initialState() {
    return { answers: data.situations.map(() => [0, 0, 0, 0]), visitedSituations: [], index: 0 };
  }
  let state = initialState();
  try {
    engine.validate(data);
  } catch (error) {
    main.innerHTML = '<div class="error-state"><h1>Не удалось загрузить опрос</h1><p>Проверь справочники: ' + esc(error.message) + '</p></div>';
    return;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && saved.version === data.version && Array.isArray(saved.answers) && saved.answers.length === data.blocks.length) {
      state.answers = saved.answers.map(a => engine.isAnswer(a) ? [...a] : [0, 0, 0, 0]);
      state.visitedSituations = state.answers.flatMap((_, i) =>
        engine.isAnswer(saved.answers[i]) && Array.isArray(saved.visitedSituations) && saved.visitedSituations.includes(i) ? [i] : []);
      if (Number.isInteger(saved.index)) state.index = Math.max(0, Math.min(total - 1, saved.index));
    }
  } catch (_) { /* При недоступном хранилище продолжаем в памяти вкладки. */ }
  const completed = () => state.visitedSituations.length;
  const started = () => state.visitedSituations.length > 0 || state.answers.some(a => a.some(value => value !== 0));
  function firstPending() {
    return state.answers.findIndex((_, i) => !state.visitedSituations.includes(i));
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify({ version: data.version, ...state })); }
    catch (_) { /* При недоступном хранилище продолжаем в памяти вкладки. */ }
  }
  function announce(text) { document.getElementById('announcement').textContent = text; }
  function compass() {
    const professions = [
      { icon: 'computer', x: 112, y: 78 },
      { icon: 'microscope', x: 368, y: 78 },
      { icon: 'help', x: 415, y: 198 },
      { icon: 'nature', x: 368, y: 318 },
      { icon: 'analysis', x: 112, y: 318 },
      { icon: 'cards', x: 65, y: 198 }
    ];
    const badges = professions.map(symbol => `<g class="compass-profession" transform="translate(${symbol.x} ${symbol.y})"><rect x="-26" y="-26" width="52" height="52" rx="13"/><g transform="translate(-12 -12)">${icon(symbol.icon, 24)}</g></g>`).join('');
    return `<div class="compass-card" aria-hidden="true"><svg class="compass" viewBox="0 0 480 400" fill="none"><defs><linearGradient id="needle" x1="150" y1="270" x2="310" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#9fbaab"/><stop offset="1" stop-color="#2a5647"/></linearGradient><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#658a77" opacity=".23"/></pattern></defs><rect x="45" y="22" width="390" height="340" fill="url(#dots)"/><circle cx="240" cy="198" r="142" stroke="#a6bcad" stroke-dasharray="3 7"/><circle cx="240" cy="198" r="108" stroke="#b0c3b5"/><circle cx="240" cy="198" r="73" stroke="#c2d0c3"/><path d="M240 40v316M82 198h316M128 86l224 224M128 310L352 86" stroke="#b2c4b6" stroke-dasharray="3 7"/><path d="M240 50v12m0 272v12M92 198h12m272 0h12" stroke="#64836b" stroke-width="2"/><path d="M162 277l49-109 109-49-49 109z" fill="url(#needle)"/><path d="M162 277l78-79 80-79-49 109z" fill="#1e4c3b"/><path d="M240 198l80-79-109 49z" fill="#4c7b61"/><circle cx="240" cy="198" r="10" fill="#f5f7ee" stroke="#315c45" stroke-width="3"/><circle cx="240" cy="56" r="5" fill="#e5ecdf" stroke="#708b6d"/><circle cx="98" cy="198" r="5" fill="#e5ecdf" stroke="#708b6d"/><circle cx="382" cy="198" r="5" fill="#e5ecdf" stroke="#708b6d"/><circle cx="240" cy="340" r="5" fill="#e5ecdf" stroke="#708b6d"/>${badges}</svg></div>`;
  }
  function home() {
    const count = completed();
    const startLabel = count === total ? 'Посмотреть результат' : started() ? 'Продолжить' : 'Начать опрос';
    main.innerHTML = `<div class="home-page">
      <section class="hero">${compass()}<div class="hero-copy"><h1>Найди своё<br><span class="serif">направление.</span></h1><p class="hero-description">Узнай, какие занятия тебе ближе и в каких профессиях можно попробовать себя.</p><div class="hero-actions"><button class="button primary large" data-action="start">${startLabel} ${arrow}</button>${started() ? '<button class="button secondary large" data-action="reset">Начать заново</button>' : ''}</div></div></section>
      <section id="how" class="home-section" aria-labelledby="situations-title"><h2 id="situations-title">Как пройти опрос</h2>
        <p>Перед тобой ${data.situations.length} тематических карточек: прогулка в парке, домашняя кухня, школьная ярмарка и другие знакомые темы. В каждой — четыре варианта того, что можно узнать или попробовать.</p>
        <p>Отмечай пальцем вверх всё, что тебе интересно. Можно отметить несколько вариантов, все или ни одного. Уметь делать это заранее не обязательно: представь, что нужные вещи доступны и есть возможность научиться. Правильных ответов нет.</p>
        <p>Можно представить подготовку, само событие или то, что захочется сделать после него.</p>
        <div class="choice-guide"><div class="choice-guide-item"><span class="answer-choice best selected">${icon('thumbs-up')}</span><p>Палец вверх отмечает интерес и добавляет один балл. Повторное нажатие убирает отметку.</p></div></div>
      </section>
      <section id="directions" class="home-section" aria-labelledby="scales-title"><h2 id="scales-title">От предпочтений — к профессиям</h2>
        <p>Каждый вариант относится к одному из ${data.scales.length} направлений интереса. Каждое направление встречается ${maxScore} раза — в разных темах. Балл показывает, сколько предложенных занятий ты отметил.</p>
        <ul class="home-scales" aria-label="Направления интересов">${data.scales.map(scale => `<li><span class="home-scale-icon">${icon(scale.icon)}</span>${esc(scale.title)}</li>`).join('')}</ul>
        <p>Твои ответы складываются в профиль предпочтений. Мы сравниваем его с профилями групп профессий и показываем три наиболее близкие. Например, интерес к обучению, медицине и психологической поддержке учитывается отдельно.</p>
        <button class="button primary large home-final-action" data-action="start">${startLabel} ${arrow}</button>
      </section>
    </div>`;
    main.querySelectorAll('[data-action="start"]').forEach(button => button.addEventListener('click', () => route(count === total ? 'results' : 'survey')));
    bindReset();
  }
  function hasAnsweredAhead() {
    return state.visitedSituations.some(i => i > state.index);
  }
  function progress() {
    const position = state.index + 1;
    return `<div class="survey-progress"><div class="progress-caption"><span>Вопрос ${position} из ${total}</span></div><div class="progress-bar" role="progressbar" aria-label="Текущий вопрос" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${position}" aria-valuetext="${position} из ${total}"><span class="progress-fill" style="width:${position / total * 100}%"></span></div></div>`;
  }
  function survey() {
    document.title = `Вопрос ${state.index + 1} — Компас профессий`;
    const i = state.index, question = data.situations[i], answer = state.answers[i];
    const valid = engine.isAnswer(answer);
    main.innerHTML = `<section class="survey-shell"><nav class="question-navigation" aria-label="Навигация по опросу"><button class="question-nav-button" id="previous">${icon('left')} Назад</button>${hasAnsweredAhead() ? `<button class="question-nav-button" id="forward">Вперёд ${icon('right')}</button>` : ''}</nav>${progress()}<p class="instruction">Что тебе было бы интересно узнать или попробовать? Отмечай <span class="instruction-icon" role="img" aria-label="палец вверх">${icon('thumbs-up')}</span> все подходящие варианты. Можно отметить несколько, все или ни одного.</p><h1 class="question-title" tabindex="-1">${esc(question.title)}</h1><div class="answer-grid">${question.options.map((option, j) => `<button type="button" class="answer-card ${answer[j] === 1 ? 'selected-best' : ''}" data-choice="best" data-option="${j}" aria-pressed="${answer[j] === 1}" aria-labelledby="option-${j}"><span class="answer-text" id="option-${j}">${esc(option)}</span><span class="answer-choice best ${answer[j] === 1 ? 'selected' : ''}" aria-hidden="true">${icon('thumbs-up')}</span></button>`).join('')}</div><div class="survey-controls"><button class="button primary" id="next" ${!valid ? 'disabled' : ''}>${i === total - 1 ? 'Мой результат' : `Следующая<span aria-hidden="true">${icon('right')}</span>`}</button></div></section>`;
    main.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
      const j = Number(button.dataset.option);
      const selected = answer[j] !== 1;
      answer[j] = selected ? 1 : 0;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('selected-best', selected);
      button.querySelector('.answer-choice').classList.toggle('selected', selected);
      save();
    }));
    document.getElementById('previous').addEventListener('click', previousQuestion);
    document.getElementById('next').addEventListener('click', nextQuestion);
    document.getElementById('forward')?.addEventListener('click', forwardQuestion);
  }
  function previousQuestion() {
    if (state.index === 0) route('');
    else { state.index--; save(); survey(); focusTitle(); }
  }
  function forwardQuestion() {
    if (!hasAnsweredAhead()) return;
    state.index++; save(); survey(); focusTitle();
  }
  function nextQuestion() {
    if (!engine.isAnswer(state.answers[state.index])) return;
    if (!state.visitedSituations.includes(state.index)) state.visitedSituations.push(state.index);
    if (state.index === total - 1) {
      const pending = firstPending();
      if (pending === -1) { save(); route('results'); return; }
      state.index = pending;
    } else state.index++;
    save(); survey(); focusTitle();
  }
  function number(value) { return (value > 0 ? '+' : '') + value.toLocaleString('ru-RU'); }
  function recommendationCard(group, index, hasSimilarity) {
    const professions = engine.rankProfessions(data, group.id);
    const examples = values => values.map(p => `<li>${esc(p.title)}</li>`).join('');
    return `<article class="profession-card"><h2>${index + 1}. ${esc(group.title)}</h2>
      <p class="profession-description">${esc(group.description)}</p>
      <ul class="profession-examples" aria-label="Примеры профессий">${examples(professions)}</ul>
      ${hasSimilarity ? `<div class="similarity"><div class="similarity-label"><span>Сходство</span><span>${number(Number(group.similarity.toFixed(3)))}</span></div><div class="similarity-track ${group.similarity < 0 ? 'negative' : 'positive'}" role="meter" aria-label="Сходство с твоими предпочтениями" aria-valuemin="${group.similarity < 0 ? -1 : 0}" aria-valuemax="${group.similarity < 0 ? 0 : 1}" aria-valuenow="${group.similarity}" aria-valuetext="${number(Number(group.similarity.toFixed(3)))}; шкала от ${group.similarity < 0 ? '−1 до 0' : '0 до +1'}"><span class="similarity-fill" style="width:${Math.abs(group.similarity) * 100}%"></span></div><div class="similarity-axis"><span>${group.similarity < 0 ? '−1' : '0'}</span><span>${group.similarity < 0 ? '0' : '+1'}</span></div></div>` : '<p class="similarity-undefined">Сходство не определено</p>'}
    </article>`;
  }
  function results() {
    state.index = total - 1;
    save();
    const scores = engine.score(data, state.answers);
    const ranking = engine.rank(data, scores);
    const top = ranking.slice(0, 3);
    const preferences = data.scales.map((scale, index) => ({ ...scale, score: scores[index], order: index }))
      .sort((a, b) => b.score - a.score || a.order - b.order);
    const uniformNote = scores.every(value => value === 0)
      ? 'Пока ни один интерес не отмечен. Можно вернуться к карточкам и выбрать то, что хотелось бы попробовать.'
      : 'Все направления получили одинаковый положительный балл. Интересы охватывают разные области, без одного ведущего направления.';
    const tied = ranking.length > 3 && Math.abs(ranking[2].similarity - ranking[3].similarity) < 1e-10;
    main.innerHTML = `<section class="results-shell">
      <div class="results-toolbar"><a class="back-link" href="#survey">${icon('left')} Вернуться к ответам</a></div>
      <section class="recommendations" aria-labelledby="recommendations-title"><h1 id="recommendations-title">${ranking.length ? 'Какие занятия тебе подходят' : 'Какие занятия можно попробовать'}</h1>
        ${!ranking.length ? `<p class="neutral-note">${uniformNote} По такому профилю выбрать три ближайшие группы нельзя. Ниже — три разных примера для знакомства, без рейтинга.</p>` : '<p class="ranking-note">Сходство показывает, какие направления выделяются в твоём профиле. Оно не измеряет общий уровень интереса или способности.' + (tied ? ' Есть группы с равным сходством; их порядок условный.' : '') + '</p>'}
        <div class="recommendation-grid">${(ranking.length ? top : ['engineering', 'design', 'helping'].map(id => data.groups.find(group => group.id === id))).map((group, i) => recommendationCard(group, i, ranking.length > 0)).join('')}</div>
      </section>
      <section class="profile-panel" aria-labelledby="profile-title"><h2 id="profile-title">Твои предпочтения</h2><p>Каждое направление представлено ${maxScore} вариантами. За каждый палец вверх — один балл, без отметки — ноль. Несколько направлений могут одновременно получить высокие баллы. Отсутствие отметок не означает, что профессии этого направления тебе не подходят.</p>
        <div class="scale-chart" role="img" aria-label="Профиль предпочтений: ${preferences.map(scale => esc(scale.title) + ' ' + scale.score + ' из ' + maxScore).join('; ')}">
          ${preferences.map(scale => `<div class="scale-row"><span class="scale-name">${esc(scale.title)}</span><div class="scale-track"><div class="scale-bar positive" style="width:${scale.score / maxScore * 100}%;left:0"></div></div><b class="scale-value ${scale.score > 0 ? 'positive-text' : ''}">${scale.score}</b></div>`).join('')}
        </div>
      </section>
      <div class="results-bottom"><button class="button secondary" data-action="reset">Начать заново</button></div>
    </section>`;
    bindReset();
  }
  function bindReset() { main.querySelectorAll('[data-action="reset"]').forEach(b => b.addEventListener('click', () => { resetTrigger = b; document.getElementById('reset-dialog').showModal(); })); }
  let resetTrigger;
  document.getElementById('cancel-reset').addEventListener('click', () => { document.getElementById('reset-dialog').close(); resetTrigger?.focus(); });
  document.getElementById('confirm-reset').addEventListener('click', () => {
    state = initialState(); save();
    document.getElementById('reset-dialog').close();
    route('survey'); announce('Ответы очищены. Можно начать заново.');
  });
  function focusTitle() { main.querySelector('h1')?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function route(page) { if (location.hash === '#' + page) render(); else location.hash = page; }
  function render(initial) {
    const page = location.hash.slice(1);
    if (page === 'results' && completed() === total) results();
    else if (page === 'survey' || page === 'results') {
      if (page === 'results') { state.index = firstPending(); save(); }
      survey();
    }
    else home();
    document.body.dataset.page = page === 'results' && completed() === total ? 'results' : page === 'survey' || page === 'results' ? 'survey' : 'home';
    document.title = (document.body.dataset.page === 'survey' ? `Вопрос ${state.index + 1} — ` : document.body.dataset.page === 'results' ? 'Твой результат — ' : '') + 'Компас профессий — найди своё направление';
    if (!initial && ['survey', 'results', ''].includes(page)) { main.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    else if (page && !['survey', 'results'].includes(page)) requestAnimationFrame(() => document.getElementById(page)?.scrollIntoView({ behavior: initial ? 'instant' : 'smooth' }));
  }
  window.addEventListener('hashchange', () => render(false));
  render(true);
})();

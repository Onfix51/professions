(function (root) {
  'use strict';
  function validate(data) {
    const ids = data.scales.map(s => s.id);
    if (ids.length !== 13 || new Set(ids).size !== 13) throw new Error('Нужны 13 уникальных шкал.');
    if (data.blocks.length !== 13 || data.situations.length !== 13) throw new Error('Нужны 13 тематических карточек.');
    const positions = new Map(ids.map(id => [id, [0, 0, 0, 0]]));
    const pairs = new Map();
    data.blocks.forEach((block, i) => {
      const question = data.situations[i];
      if (block.length !== 4 || new Set(block).size !== 4 || block.some(id => !ids.includes(id)) || !question.title || !question.context || !Array.isArray(question.options) || question.options.length !== 4 || !Array.from(question.options).every(option => typeof option === 'string' && option.trim())) throw new Error('Неверный блок ' + (i + 1));
      block.forEach((id, position) => { positions.get(id)[position]++; });
      block.forEach((id, j) => block.slice(j + 1).forEach(other => {
        const key = [id, other].sort((a, b) => a - b).join('-');
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }));
    });
    if (pairs.size !== 78 || [...pairs.values()].some(count => count !== 1)) throw new Error('Каждая пара шкал должна встречаться ровно один раз.');
    if ([...positions.values()].some(counts => counts.some(count => count !== 1))) throw new Error('Каждая шкала должна встречаться один раз на каждой позиции.');
    if (!Array.isArray(data.facets) || data.facets.length !== data.blocks.length) throw new Error('Нужна карта проявлений шкал для всех вопросов.');
    const facetsByScale = new Map(ids.map(id => [id, []]));
    data.facets.forEach((row, i) => {
      if (!Array.isArray(row) || row.length !== 4 || !Array.from(row).every(value => typeof value === 'string' && value.trim())) throw new Error('Неверная карта проявлений в вопросе ' + (i + 1));
      row.forEach((facet, j) => facetsByScale.get(data.blocks[i][j]).push(facet));
    });
    if ([...facetsByScale.values()].some(facets => facets.length !== 4 || new Set(facets).size !== 4)) throw new Error('Для каждой шкалы нужны четыре разных проявления.');
    if (data.groups.length < 3 || new Set(data.groups.map(g => g.id)).size !== data.groups.length) throw new Error('Нужны хотя бы 3 группы с уникальными id.');
    data.groups.forEach(g => {
      if (!g.title || !g.description || !Array.isArray(g.examples) || g.examples.length !== 3) throw new Error('Неверное описание группы: ' + g.id);
      if (g.vector.length !== ids.length || g.vector.some(v => !Number.isFinite(v) || v < 0 || v > 5) || Math.hypot(...center(g.vector)) === 0) throw new Error('Неверный вектор: ' + g.id);
    });
    const tags = new Map(data.tags.map(tag => [tag.id, tag]));
    if (tags.size !== data.tags.length || !data.tags.length || data.tags.some(tag => !['subject', 'setting'].includes(tag.type) || !tag.title || !tag.label)) throw new Error('Неверный справочник тегов.');
    const validTags = (values, type) => Array.isArray(values) && new Set(values).size === values.length && values.every(id => tags.has(id) && (!type || tags.get(id).type === type));
    if (!Array.isArray(data.filterQuestions) || data.filterQuestions.length !== 0) throw new Error('Дополнительные вопросы не предусмотрены.');
    if (!data.professions.length || new Set(data.professions.map(p => p.id)).size !== data.professions.length) throw new Error('Нужны профессии с уникальными id.');
    data.professions.forEach(p => {
      if (!p.title || !data.groups.some(g => g.id === p.groupId) || !validTags(p.tags) || !p.tags.some(id => tags.get(id).type === 'subject') || !p.tags.some(id => tags.get(id).type === 'setting')) throw new Error('Неверная профессия: ' + p.id);
    });
    if (data.groups.some(group => !data.professions.some(p => p.groupId === group.id))) throw new Error('У каждой группы должны быть профессии.');
    data.groups.forEach(group => {
      const examples = data.professions.filter(p => p.groupId === group.id).slice(0, 3);
      if (examples.length !== 3 || examples.some((p, i) => p.title !== group.examples[i])) throw new Error('Примеры не соответствуют группе: ' + group.id);
    });
  }
  function isAnswer(answer) {
    return Array.isArray(answer) && answer.length === 4 && Array.from(answer).every(value => value === 0 || value === 1);
  }
  function center(vector) {
    const mean = vector.reduce((sum, v) => sum + v, 0) / vector.length;
    return vector.map(v => v - mean);
  }
  function score(data, answers) {
    if (!Array.isArray(answers) || answers.length !== data.blocks.length || !Array.from(answers).every(isAnswer)) throw new Error('Ответь на все ситуации.');
    const scores = data.scales.map(() => 0);
    const ids = data.scales.map(s => s.id);
    answers.forEach((answer, i) => {
      answer.forEach((value, j) => { scores[ids.indexOf(data.blocks[i][j])] += value; });
    });
    return scores;
  }
  function cosine(a, b) {
    const norm = Math.hypot(...a) * Math.hypot(...b);
    if (norm < 1e-12) return null;
    return Math.max(-1, Math.min(1, a.reduce((s, v, i) => s + v * b[i], 0) / norm));
  }
  function rank(data, scores) {
    const profile = center(scores);
    if (Math.hypot(...profile) < 1e-12) return [];
    return data.groups.map(p => ({ ...p, similarity: cosine(profile, center(p.vector)) }))
      .sort((a, b) => b.similarity - a.similarity || a.id.localeCompare(b.id));
  }
  function normalizeFilters(data, filters) {
    return Object.fromEntries(data.filterQuestions.map(question => {
      const values = filters && Array.isArray(filters[question.id]) ? filters[question.id] : [];
      return [question.id, question.options.filter(id => values.includes(id))];
    }));
  }
  function tagProfile(data, filters) {
    const selected = normalizeFilters(data, filters);
    return data.filterQuestions.flatMap(question => {
      const values = selected[question.id];
      // Пустой выбор и выбор всего нейтральны: не добавляют баллов совпадения.
      return values.length === question.options.length ? [] : values;
    });
  }
  function rankProfessions(data, groupId, filters) {
    const preferred = new Set(tagProfile(data, filters));
    return data.professions.filter(profession => profession.groupId === groupId)
      .map(profession => {
        const matches = profession.tags.filter(id => preferred.has(id));
        return { ...profession, matches, matchCount: matches.length };
      })
      // Равенство сохраняет исходный порядок примеров в справочнике.
      .sort((a, b) => b.matchCount - a.matchCount);
  }
  root.SurveyEngine = { validate, isAnswer, center, score, cosine, rank, normalizeFilters, tagProfile, rankProfessions };
})(typeof window !== 'undefined' ? window : globalThis);

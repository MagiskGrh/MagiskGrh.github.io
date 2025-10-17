// Productivity Hub — client logic
// Storage schema (localStorage key: 'phub:v1')
// {
//   todos: [{id, text, done, createdAt}],
//   notes: [{id, title, body, updatedAt}],
//   habits: [{id, name, history:["YYYY-MM-DD"], updatedAt}],
//   settings: { accent: "#22d3ee", amoled: false, lastTab: "todo" }
// }

const STORE_KEY = 'phub:v1';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function today() { return new Date().toISOString().slice(0,10); }
function ymdStr(d) { return new Date(d).toISOString().slice(0,10); }

// HTML escape helper (safe)
function safeHtml(s){
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return (s || '').replace(/[&<>"']/g, c => map[c]);
}

let state = load();
hydrateTheme();

// NAVIGATION
const tabs = ['todo','notes','habits','settings'];
const setTab = (name) => {
  tabs.forEach(t => {
    const tab = $(`#tab-${t}`); const btn = $(`#nav-${t}`);
    const on = t === name;
    tab?.classList.toggle('active', on);
    btn?.classList.toggle('active', on);
    btn?.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  state.settings.lastTab = name; save();
  if (location.hash !== `#${name}`) location.hash = `#${name}`;
};
window.addEventListener('hashchange', () => {
  const name = location.hash.replace('#','');
  if (tabs.includes(name)) setTab(name);
});
setTab(location.hash.replace('#','') || state.settings.lastTab || 'todo');

// QUICK ADD
$('#quick-add')?.addEventListener('click', () => {
  setTab('todo');
  $('#todo-input')?.focus();
});

// TODOS
const todoForm = $('#todo-form');
const todoInput = $('#todo-input');
const todoFilter = $('#todo-filter');
const todoList = $('#todo-list');

todoForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = (todoInput.value || '').trim();
  if (!text) return;
  state.todos.unshift({ id: uid(), text, done: false, createdAt: Date.now() });
  todoInput.value = '';
  save();
  renderTodos();
});

todoFilter?.addEventListener('change', renderTodos);

function renderTodos() {
  const filter = todoFilter.value;
  let items = [...state.todos];
  if (filter === 'active') items = items.filter(t => !t.done);
  if (filter === 'done') items = items.filter(t => t.done);
  todoList.innerHTML = '';
  for (const t of items) {
    const li = document.createElement('li');
    li.className = `item ${t.done ? 'done' : ''}`;
    li.innerHTML = `
      <input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Готово" />
      <div>
        <div class="text">${safeHtml(t.text)}</div>
        <div class="meta">${new Date(t.createdAt).toLocaleString()}</div>
      </div>
      <div class="actions">
        <button class="icon" data-act="up" title="Вверх">▲</button>
        <button class="icon" data-act="del" title="Удалить">✕</button>
      </div>
    `;
    const [chk] = li.getElementsByTagName('input');
    chk.addEventListener('change', () => { t.done = chk.checked; save(); renderTodos(); });
    li.querySelector('[data-act="del"]').addEventListener('click', () => { state.todos = state.todos.filter(x => x.id !== t.id); save(); renderTodos(); });
    li.querySelector('[data-act="up"]').addEventListener('click', () => { const i = state.todos.findIndex(x=>x.id===t.id); if (i>0) { const [it]=state.todos.splice(i,1); state.todos.splice(i-1,0,it); save(); renderTodos(); }});
    todoList.appendChild(li);
  }
}

// NOTES
const notesGrid = $('#notes-grid');
const noteSearch = $('#note-search');
$('#new-note')?.addEventListener('click', () => {
  const now = Date.now();
  state.notes.unshift({ id: uid(), title: 'Новая заметка', body: '', updatedAt: now });
  save();
  renderNotes();
});
noteSearch?.addEventListener('input', renderNotes);

function renderNotes() {
  const q = (noteSearch.value || '').toLowerCase();
  notesGrid.innerHTML = '';
  const items = state.notes.filter(n => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  for (const n of items) {
    const card = document.createElement('div');
    card.className = 'note';
    card.innerHTML = `
      <input class="title input" value="${safeHtml(n.title)}" />
      <textarea class="body input body" placeholder="Текст…">${safeHtml(n.body)}</textarea>
      <div class="row">
        <span class="muted">${new Date(n.updatedAt).toLocaleString()}</span>
        <button class="btn secondary" data-act="del">Удалить</button>
      </div>
    `;
    const title = card.querySelector('.title');
    const body = card.querySelector('.body');
    let saveTimer;
    function queueSave() {
      n.title = title.value; n.body = body.value; n.updatedAt = Date.now();
      clearTimeout(saveTimer); saveTimer = setTimeout(() => { save(); renderNotes(); }, 400);
    }
    title.addEventListener('input', queueSave);
    body.addEventListener('input', queueSave);
    card.querySelector('[data-act="del"]').addEventListener('click', () => { state.notes = state.notes.filter(x => x.id !== n.id); save(); renderNotes(); });
    notesGrid.appendChild(card);
  }
}

// HABITS (daily) with streaks and last 7 days view
const habitForm = $('#habit-form');
const habitInput = $('#habit-input');
const habitList = $('#habit-list');

habitForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = (habitInput.value || '').trim(); if (!name) return;
  state.habits.push({ id: uid(), name, history: [], updatedAt: Date.now() });
  habitInput.value = '';
  save();
  renderHabits();
});

function renderHabits() {
  habitList.innerHTML = '';
  for (const h of state.habits) {
    const li = document.createElement('li');
    const doneToday = h.history.includes(today());
    const streak = calcStreak(h.history);
    li.className = 'item';
    li.innerHTML = `
      <input type="checkbox" ${doneToday ? 'checked' : ''} aria-label="Выполнено сегодня" />
      <div>
        <div class="text">${safeHtml(h.name)}</div>
        <div class="row">
          <div class="streak">Серия: ${streak}</div>
          <div class="week" aria-label="Последние 7 дней"></div>
        </div>
      </div>
      <div class="actions">
        <button class="icon" data-act="del" title="Удалить">✕</button>
      </div>
    `;
    // week dots
    const week = li.querySelector('.week');
    for (let i = 6; i >= 0; i--) {
      const d = ymdStr(Date.now() - i*24*3600*1000);
      const dot = document.createElement('div');
      dot.className = 'dot' + (h.history.includes(d) ? ' on' : '');
      week.appendChild(dot);
    }
    const [chk] = li.getElementsByTagName('input');
    chk.addEventListener('change', () => {
      const todayStr = today();
      const has = h.history.includes(todayStr);
      if (chk.checked && !has) h.history.push(todayStr);
      if (!chk.checked && has) h.history = h.history.filter(d => d !== todayStr);
      h.updatedAt = Date.now();
      save(); renderHabits();
    });
    li.querySelector('[data-act="del"]').addEventListener('click', () => { state.habits = state.habits.filter(x => x.id !== h.id); save(); renderHabits(); });
    habitList.appendChild(li);
  }
}

function calcStreak(history) {
  if (!history?.length) return 0;
  const set = new Set(history);
  let s = 0; let d = new Date();
  while (set.has(ymdStr(d))) { s++; d = new Date(d.getTime() - 24*3600*1000); }
  return s;
}

// SETTINGS: accent + AMOLED, export/import/clear
const swatches = $$('.swatch');
const amoled = $('#toggle-amoled');
swatches.forEach(el => el.style.setProperty('--swatch', el.dataset.color));
swatches.forEach(el => el.addEventListener('click', () => { state.settings.accent = el.dataset.color; save(); hydrateTheme(); }));
if (amoled) { amoled.checked = !!state.settings.amoled; amoled.addEventListener('change', () => { state.settings.amoled = amoled.checked; save(); hydrateTheme(); }); }

$('#export-json')?.addEventListener('click', () => {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `productivity-hub-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

$('#import-json')?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') throw new Error('Неверный файл');
    const ok = confirm('Импорт заменить текущие данные?');
    if (ok) {
      state = {
        todos: data.todos || [],
        notes: data.notes || [],
        habits: data.habits || [],
        settings: { accent: data.settings?.accent || '#22d3ee', amoled: !!data.settings?.amoled, lastTab: data.settings?.lastTab || 'todo' }
      };
      save(true);
      hydrateTheme();
      setTab(state.settings.lastTab || 'todo');
      renderAll();
    }
  } catch (err) {
    alert('Ошибка импорта: ' + err.message);
  } finally {
    e.target.value = '';
  }
});

$('#clear-data')?.addEventListener('click', () => {
  if (!confirm('Удалить все данные? Это действие нельзя отменить.')) return;
  state = { todos: [], notes: [], habits: [], settings: { accent: '#22d3ee', amoled: false, lastTab: 'todo' } };
  save(true); hydrateTheme(); renderAll(); setTab('todo');
});

// THEME
function hydrateTheme() {
  document.documentElement.style.setProperty('--accent', state.settings?.accent || '#22d3ee');
  document.documentElement.classList.toggle('amoled', !!state.settings?.amoled);
}

// STORAGE
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { todos: [], notes: [], habits: [], settings: { accent: '#22d3ee', amoled: false, lastTab: 'todo' } };
    const data = JSON.parse(raw);
    return {
      todos: data.todos || [],
      notes: data.notes || [],
      habits: data.habits || [],
      settings: { accent: data.settings?.accent || '#22d3ee', amoled: !!data.settings?.amoled, lastTab: data.settings?.lastTab || 'todo' }
    };
  } catch {
    return { todos: [], notes: [], habits: [], settings: { accent: '#22d3ee', amoled: false, lastTab: 'todo' } };
  }
}
function save(overwrite=false) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch(e){ console.error('save error', e); }
}

function renderTodosIfVisible(){ if ($('#tab-todo')?.classList.contains('active')) renderTodos(); }
function renderNotesIfVisible(){ if ($('#tab-notes')?.classList.contains('active')) renderNotes(); }
function renderHabitsIfVisible(){ if ($('#tab-habits')?.classList.contains('active')) renderHabits(); }
function renderAll(){ renderTodos(); renderNotes(); renderHabits(); }

// Helpers
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

// initial render
renderAll();

// TAB BUTTONS
$$('.tabbtn').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));

// REGISTER SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  });
}

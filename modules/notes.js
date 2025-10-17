import { load, save, downloadJSON, uploadJSON } from './utils.js';

export function renderNotes(container) {
  const notes = load('notes', []);

  container.innerHTML = \`
    <section class="card">
      <h2>📝 Заметки</h2>
      <div class="input-row">
        <input id="note-title" type="text" placeholder="Заголовок заметки..." />
      </div>
      <textarea id="note-body" placeholder="Текст заметки..."></textarea>
      <div class="input-row">
        <button id="note-save">Сохранить</button>
        <button class="secondary" id="note-export">Экспорт</button>
        <label class="switch secondary btn">
          Импорт <input type="file" id="note-import" accept="application/json" />
        </label>
      </div>
    </section>
    <section class="card">
      <ul class="list" id="note-list"></ul>
    </section>
  \`;

  const list = container.querySelector('#note-list');
  const title = container.querySelector('#note-title');
  const body = container.querySelector('#note-body');

  function render() {
    list.innerHTML = '';
    notes.slice().reverse().forEach((n, idx) => {
      const li = document.createElement('li');
      const i = notes.length - 1 - idx;
      li.innerHTML = \`
        <div class="left">
          <strong>\${n.title || 'Без названия'}</strong>
        </div>
        <span class="badge">\${new Date(n.created).toLocaleString()}</span>
      \`;
      li.addEventListener('click', () => { title.value = n.title || ''; body.value = n.body || ''; });
      li.addEventListener('dblclick', () => { notes.splice(i,1); save('notes', notes); render(); });
      list.appendChild(li);
    });
  }

  container.querySelector('#note-save').addEventListener('click', () => {
    const t = title.value.trim(); const b = body.value.trim();
    if (!t && !b) return;
    notes.push({ title: t, body: b, created: Date.now() });
    title.value = ''; body.value = '';
    save('notes', notes); render();
  });

  container.querySelector('#note-export').addEventListener('click', () => {
    downloadJSON(notes, 'notes-export.json');
  });

  container.querySelector('#note-import').addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        save('notes', data); render();
      }
    } catch {}
  });

  render();
}

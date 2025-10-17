import { load, save } from './utils.js';

function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = last.getDate();
  const arr = [];
  for (let d = 1; d <= days; d++) arr.push(d);
  return arr;
}

export function renderHabits(container) {
  const state = load('habits', { habits: ['Вода', 'Спорт'], data: {} });
  const today = new Date();
  const ym = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  const days = getMonthMatrix(today.getFullYear(), today.getMonth());

  container.innerHTML = \`
    <section class="card">
      <h2>📆 Привычки — \${today.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</h2>
      <div class="input-row">
        <input id="habit-input" type="text" placeholder="Новая привычка..." />
        <button id="habit-add">Добавить</button>
      </div>
      <div id="habit-list"></div>
    </section>
  \`;

  const list = container.querySelector('#habit-list');

  function render() {
    list.innerHTML = '';
    state.habits.forEach((h, idx) => {
      const key = `${ym}:${h}`;
      const row = document.createElement('div');
      row.className = 'card';
      row.innerHTML = \`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong>\${h}</strong>
          <button class="danger" data-remove="\${idx}">Удалить</button>
        </div>
        <div class="grid"></div>
      \`;
      const grid = row.querySelector('.grid');
      const doneSet = new Set(state.data[key] || []);
      days.forEach(d => {
        const cell = document.createElement('div');
        cell.className = 'cell' + (doneSet.has(d) ? ' done' : '');
        cell.textContent = d;
        cell.addEventListener('click', () => {
          if (doneSet.has(d)) doneSet.delete(d); else doneSet.add(d);
          state.data[key] = Array.from(doneSet);
          save('habits', state); render();
        });
        grid.appendChild(cell);
      });
      row.querySelector('button[data-remove]').addEventListener('click', () => {
        state.habits.splice(idx, 1);
        save('habits', state); render();
      });
      list.appendChild(row);
    });
  }

  container.querySelector('#habit-add').addEventListener('click', () => {
    const val = container.querySelector('#habit-input').value.trim();
    if (!val) return;
    state.habits.push(val);
    save('habits', state); render();
    container.querySelector('#habit-input').value='';
  });

  render();
}

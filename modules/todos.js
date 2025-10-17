import { load, save } from './utils.js';

export function renderTodos(container) {
  const todos = load('todos', []);

  container.innerHTML = `
    <section class="card">
      <h2>✅ Дела</h2>
      <div class="input-row">
        <input id="todo-input" type="text" placeholder="Новая задача..." />
        <button id="todo-add">Добавить</button>
      </div>
      <ul class="list" id="todo-list"></ul>
      <p class="helper">Нажми на чекбокс, чтобы отметить выполнение. Долгий тап по задаче — удалить.</p>
    </section>
  `;

  const list = container.querySelector('#todo-list');
  const input = container.querySelector('#todo-input');
  const addBtn = container.querySelector('#todo-add');

  function render() {
    list.innerHTML = '';
    todos.forEach((t, i) => {
      const li = document.createElement('li');
      li.innerHTML = \`
        <div class="left">
          <span class="checkbox \${t.done ? 'checked' : ''}">✔</span>
          <span>\${t.text}</span>
        </div>
        <span class="badge">\${new Date(t.created).toLocaleDateString()}</span>
      \`;
      li.querySelector('.checkbox').addEventListener('click', () => {
        t.done = !t.done; save('todos', todos); render();
      });
      let pressTimer;
      li.addEventListener('touchstart', () => pressTimer = setTimeout(() => { todos.splice(i,1); save('todos', todos); render(); }, 600));
      ['touchend','touchmove','touchcancel','mouseup','mouseleave'].forEach(ev => li.addEventListener(ev, () => clearTimeout(pressTimer)));
      li.addEventListener('dblclick', () => { todos.splice(i,1); save('todos', todos); render(); });
      list.appendChild(li);
    });
  }

  addBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, done: false, created: Date.now() });
    save('todos', todos); input.value=''; render();
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });

  render();
}

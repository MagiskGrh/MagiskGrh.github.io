import { clearAll, downloadBackup, restoreBackup } from './utils.js';

export function renderSettings(container) {
  container.innerHTML = `
    <section class="card">
      <h2>⚙️ Настройки</h2>
      <div class="input-row">
        <button id="export" class="secondary">Экспорт всех данных</button>
        <label class="btn secondary">
          Импорт <input id="import" type="file" accept="application/json" />
        </label>
      </div>
      <button id="reset" class="danger">Сбросить все данные</button>
      <p class="helper">Данные хранятся локально на устройстве. Экспортируй бэкап, чтобы перенести на другое устройство.</p>
    </section>
  `;

  container.querySelector('#export').addEventListener('click', () => downloadBackup());
  container.querySelector('#import').addEventListener('change', (e) => restoreBackup(e.target.files?.[0]));
  container.querySelector('#reset').addEventListener('click', () => {
    if (confirm('Точно удалить все локальные данные?')) clearAll();
  });
}

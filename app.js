import { renderTodos } from './modules/todos.js';
import { renderNotes } from './modules/notes.js';
import { renderHabits } from './modules/habits.js';
import { renderSettings } from './modules/settings.js';

const content = document.getElementById('content');
const tabs = document.querySelectorAll('.bottom-nav button');

function setActive(tabId) {
  tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
}

export function showSection(tabId) {
  setActive(tabId);
  if (tabId === 'todos') renderTodos(content);
  if (tabId === 'notes') renderNotes(content);
  if (tabId === 'habits') renderHabits(content);
  if (tabId === 'settings') renderSettings(content);
  location.hash = tabId;
}

tabs.forEach(b => b.addEventListener('click', () => showSection(b.dataset.tab)));

window.addEventListener('DOMContentLoaded', () => {
  // Default tab based on hash or todos
  const initial = location.hash?.replace('#','') || 'todos';
  showSection(initial);
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }
});

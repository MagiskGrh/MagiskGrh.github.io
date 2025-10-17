const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.textContent = task;
    li.onclick = () => toggleTask(index);
    taskList.appendChild(li);
  });
}

function toggleTask(index) {
  tasks.splice(index, 1);
  saveTasks();
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

addBtn.onclick = () => {
  const text = taskInput.value.trim();
  if (text) {
    tasks.push(text);
    saveTasks();
    taskInput.value = '';
  }
};

renderTasks();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

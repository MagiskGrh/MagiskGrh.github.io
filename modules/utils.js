export function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; }
  catch { return def; }
}
export function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
export function uploadJSON() {
  return new Promise((resolve) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = async () => resolve(JSON.parse(await inp.files[0].text()));
    inp.click();
  });
}
export function downloadBackup() {
  const keys = ['todos', 'notes', 'habits'];
  const obj = {};
  keys.forEach(k => { obj[k] = load(k, null); });
  downloadJSON(obj, 'prod-hub-backup.json');
}
export async function restoreBackup(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    Object.keys(obj || {}).forEach(k => {
      if (['todos','notes','habits'].includes(k)) save(k, obj[k]);
    });
    alert('Импорт завершён. Обнови вкладки для отображения.');
  } catch(e) {
    alert('Не удалось импортировать файл.');
  }
}
export function clearAll() {
  ['todos','notes','habits'].forEach(k => localStorage.removeItem(k));
  alert('Данные очищены.');
}

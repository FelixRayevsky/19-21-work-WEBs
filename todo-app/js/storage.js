const TASKS_KEY = 'todo_tasks';
const FILTER_KEY = 'todo_filter';

// Задачи из LocalStorage
export const loadTasks = () => JSON.parse(localStorage.getItem(TASKS_KEY)) || [];

// Сохранение текущего списка в LocalStorage
export const saveTasks = (tasks) => localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

// Чтение фильтра
export const loadFilter = () => sessionStorage.getItem(FILTER_KEY) || 'all';

// Сохранение фильтра
export const saveFilter = (filter) => sessionStorage.setItem(FILTER_KEY, filter);
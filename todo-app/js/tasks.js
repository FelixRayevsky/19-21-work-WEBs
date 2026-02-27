let tasks = []; // массив задач

export const initializeTasks = (initialTasks) => { tasks = [...initialTasks]; };
export const getTasks = () => tasks;

// Добавление задачи в массив
export const addTask = (text, priority = "medium") => {
    const task = {
        id: Date.now().toString(),
        text: text.trim(),
        completed: false,
        priority: priority,
        createdAt: new Date().toISOString()
    };
    tasks.push(task);
    return task;
};

// Изменение приоритета
export const updatePriority = (id, newPriority) => {
    const task = tasks.find(t => t.id === id);
    if (task) task.priority = newPriority;
};

// (выполнено/не выполнено)
export const toggleTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (task) task.completed = !task.completed;
};

// Удаление задачи из массива
export const deleteTask = (id) => {
    tasks = tasks.filter((t) => t.id !== id);
};

// Фильтрация
export const clearCompleted = () => {
    tasks = tasks.filter((t) => !t.completed);
};

// Получение отфильтрованного списка задач
export const getFilteredTasks = (filter) => {
    if (filter === "active") return tasks.filter((t) => !t.completed);
    if (filter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
};
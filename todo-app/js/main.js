import * as api from './api.js';
import * as tasksRepo from './tasks.js';
import * as storage from './storage.js';

let currentFilter = storage.loadFilter();

// Инициализация элементов
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const taskList = document.getElementById('taskList');
const filtersContainer = document.getElementById('filters');
const stats = document.getElementById('stats');
const loadSamplesBtn = document.getElementById('loadSamples');
const clearCompletedBtn = document.getElementById('clearCompleted');

// Загрузка начальных данных
tasksRepo.initializeTasks(storage.loadTasks());
renderTasks();

// обновление интерфейса
function saveAndRender() {
    storage.saveTasks(tasksRepo.getTasks());
    renderTasks();
}

// Главная функция отрисовки списка задач
function renderTasks() {
    const tasks = tasksRepo.getFilteredTasks(currentFilter);
    taskList.innerHTML = '';

    const priorityColors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        li.className = 'group bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-zinc-800 hover:border-zinc-600';
        
        const colorClass = priorityColors[task.priority] || 'bg-zinc-600';

        li.innerHTML = `
            <div class="w-1.5 h-10 rounded-full ${colorClass}"></div>
            <input type="checkbox" ${task.completed ? 'checked' : ''} class="w-6 h-6 rounded-lg border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20 transition-all cursor-pointer">
            <span class="flex-1 text-lg ${task.completed ? 'task-completed' : ''} task-text">${task.text}</span>
            <button class="delete-btn opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 transition-all">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;

        // Даббл клик для смены приоритета
        li.addEventListener('dblclick', (e) => {
            if (e.target.type !== 'checkbox' && !e.target.closest('.delete-btn')) {
                startPriorityEdit(task, li, li.querySelector('.task-text'));
            }
        });

        taskList.appendChild(li);
    });

    const all = tasksRepo.getTasks();
    const completed = all.filter(t => t.completed).length;
    stats.textContent = `${all.length} задач / ${completed} выполнено`;
}

// Функция редактирования приоритета
function startPriorityEdit(task, li, taskTextElement) {
    const select = document.createElement('select');
    select.className = 'bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-sm focus:outline-none';
    
    ['low', 'medium', 'high'].forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
        if (task.priority === p) opt.selected = true;
        select.appendChild(opt);
    });

    taskTextElement.insertAdjacentElement('afterend', select);
    select.focus();

    const save = () => {
        if (select.value !== task.priority) {
            tasksRepo.updatePriority(task.id, select.value);
            saveAndRender();
        } else {
            select.remove();
        }
    };

    select.addEventListener('change', save);
    select.addEventListener('blur', save);
}

// добавление задачи
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;
    const task = tasksRepo.addTask(text, priority);
    
    try { await api.createTaskOnServer(text); } catch (err) { console.error(err); }
    
    taskInput.value = '';
    prioritySelect.value = 'medium';
    saveAndRender();
});

// проверка выполнения
taskList.addEventListener('change', async (e) => {
    if (e.target.type === 'checkbox') {
        const id = e.target.closest('li').dataset.id;
        tasksRepo.toggleTask(id);
        const task = tasksRepo.getTasks().find(t => t.id === id);
        if (task && id.startsWith('server-')) {
            try { await api.updateTaskOnServer(id.replace('server-', ''), task.completed); } catch (err) { console.error(err); }
        }
        saveAndRender();
    }
});

// удаление
taskList.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
        const id = delBtn.closest('li').dataset.id;
        tasksRepo.deleteTask(id);
        if (id.startsWith('server-')) {
            try { await api.deleteTaskOnServer(id.replace('server-', '')); } catch (err) { console.error(err); }
        }
        saveAndRender();
    }
});

// Переключение фильтров
filtersContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (btn) {
        currentFilter = btn.dataset.filter;
        storage.saveFilter(currentFilter);
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderTasks();
    }
});

// Загрузка данных с сервера
loadSamplesBtn.addEventListener('click', async () => {
    loadSamplesBtn.disabled = true;
    loadSamplesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
    try {
        const serverTasks = await api.fetchSampleTasks();
        const existingTexts = new Set(tasksRepo.getTasks().map(t => t.text.toLowerCase()));
        serverTasks.forEach(st => {
            if (!existingTexts.has(st.title.toLowerCase())) {
                const newTask = tasksRepo.addTask(st.title, 'medium');
                newTask.completed = st.completed;
                newTask.id = `server-${st.id}`;
            }
        });
        saveAndRender();
    } finally {
        loadSamplesBtn.disabled = false;
        loadSamplesBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Загрузить с сервера';
    }
});

// Очистка 
clearCompletedBtn.addEventListener('click', () => {
    if (confirm('Очистить выполненные задачи?')) {
        tasksRepo.clearCompleted();
        saveAndRender();
    }
});
 // Task Management Module
class TaskManager {
    constructor() {
        this.tasks = [];
        this.categories = new Set();
        this.templates = [];
        this.loadTasks();
    }

    // Загрузка задач
    loadTasks() {
        const savedTasks = localStorage.getItem('redTimerTasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
            this.updateCategories();
        }
    }

    // Сохранение задач
    saveTasks() {
        localStorage.setItem('redTimerTasks', JSON.stringify(this.tasks));
    }

    // Обновление категорий
    updateCategories() {
        this.categories = new Set(this.tasks.map(task => task.category).filter(Boolean));
    }

    // Добавление задачи
    addTask(task) {
        const newTask = {
            id: Date.now(),
            created: new Date().toISOString(),
            completed: false,
            priority: 'medium',
            ...task
        };
        this.tasks.push(newTask);
        this.updateCategories();
        this.saveTasks();
        return newTask;
    }

    // Обновление задачи
    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.updateCategories();
            this.saveTasks();
            return this.tasks[taskIndex];
        }
        return null;
    }

    // Удаление задачи
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.updateCategories();
        this.saveTasks();
    }

    // Получение задач по фильтру
    getTasks(filter = {}) {
        return this.tasks.filter(task => {
            if (filter.completed !== undefined && task.completed !== filter.completed) return false;
            if (filter.category && task.category !== filter.category) return false;
            if (filter.priority && task.priority !== filter.priority) return false;
            if (filter.search) {
                const searchLower = filter.search.toLowerCase();
                return task.title.toLowerCase().includes(searchLower) ||
                       task.description.toLowerCase().includes(searchLower);
            }
            return true;
        });
    }

    // Создание шаблона
    createTemplate(template) {
        const newTemplate = {
            id: Date.now(),
            ...template
        };
        this.templates.push(newTemplate);
        localStorage.setItem('redTimerTemplates', JSON.stringify(this.templates));
        return newTemplate;
    }

    // Создание задачи из шаблона
    createFromTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            const { id, ...taskData } = template;
            return this.addTask(taskData);
        }
        return null;
    }

    // Установка приоритета
    setPriority(taskId, priority) {
        return this.updateTask(taskId, { priority });
    }

    // Отметка выполнения
    toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            return this.updateTask(taskId, { completed: !task.completed });
        }
        return null;
    }

    // Получение статистики
    getStats() {
        return {
            total: this.tasks.length,
            completed: this.tasks.filter(t => t.completed).length,
            byPriority: {
                high: this.tasks.filter(t => t.priority === 'high').length,
                medium: this.tasks.filter(t => t.priority === 'medium').length,
                low: this.tasks.filter(t => t.priority === 'low').length
            },
            byCategory: Array.from(this.categories).reduce((acc, category) => {
                acc[category] = this.tasks.filter(t => t.category === category).length;
                return acc;
            }, {})
        };
    }

    // Экспорт задач
    exportTasks(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.tasks, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV();
        }
    }

    // Конвертация в CSV
    convertToCSV() {
        const headers = ['ID', 'Title', 'Description', 'Category', 'Priority', 'Completed', 'Created'];
        const rows = this.tasks.map(task => {
            return [
                task.id,
                task.title,
                task.description,
                task.category,
                task.priority,
                task.completed,
                task.created
            ].join(',');
        });
        return [headers.join(','), ...rows].join('\n');
    }
}

export default TaskManager;
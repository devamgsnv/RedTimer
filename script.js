// AI функциональность
const AI = {
    analyzeProductivity: function() {
        const today = new Date().toISOString().split('T')[0];
        const todayStats = stats.dailyStats[today] || 0;
        const averagePomodoros = Object.values(stats.dailyStats).reduce((a, b) => a + b, 0) / Object.keys(stats.dailyStats).length;
        
        let productivityMessage = '';
        if (todayStats > averagePomodoros) {
            productivityMessage = 'Отличная продуктивность сегодня! Продолжайте в том же духе.';
        } else if (todayStats < averagePomodoros) {
            productivityMessage = 'Сегодня вы немного отстаете от среднего показателя. Попробуйте сделать больше перерывов.';
        } else {
            productivityMessage = 'Вы работаете стабильно. Это хорошо!';
        }
        
        return productivityMessage;
    },

    analyzeTaskCompletion: function() {
        const completedTasks = tasks.filter(task => task.completed);
        const completionTimes = completedTasks.map(task => {
            const created = new Date(task.createdAt);
            const completed = new Date(task.completedAt);
            return (completed - created) / 1000 / 60;
        });

        const averageTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
        return {
            averageTime,
            totalCompleted: completedTasks.length
        };
    },

    generateRecommendations: function() {
        const recommendations = [];
        const taskAnalysis = this.analyzeTaskCompletion();
        
        if (taskAnalysis.averageTime > 25) {
            recommendations.push('Ваши задачи занимают больше времени, чем стандартный помодоро. Попробуйте разбить их на меньшие части.');
        }
        
        const productivityMessage = this.analyzeProductivity();
        recommendations.push(productivityMessage);
        
        if (stats.totalFocusTime > 240) {
            recommendations.push('Вы много работаете. Рекомендуем сделать длинный перерыв.');
        }
        
        return recommendations;
    },

    suggestNextPomodoro: function() {
        const taskAnalysis = this.analyzeTaskCompletion();
        const recommendations = this.generateRecommendations();
        
        return {
            suggestedDuration: taskAnalysis.averageTime > 25 ? 35 : 25,
            recommendations: recommendations
        };
    }
};

// Основные переменные
let timeLeft;
let timerId = null;
let isRunning = false;
let currentMode = 'pomodoro';
let currentPage = 'timer';

// Настройки времени (в минутах)
const TIMES = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
};

// Статистика
let stats = {
    completedPomodoros: 0,
    totalFocusTime: 0,
    dailyStats: {},
    streak: 0
};

// События календаря
let events = JSON.parse(localStorage.getItem('pomodoroEvents')) || [];

// DOM элементы
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const pomodoroButton = document.getElementById('pomodoro');
const shortBreakButton = document.getElementById('shortBreak');
const longBreakButton = document.getElementById('longBreak');
const completedPomodorosDisplay = document.getElementById('completedPomodoros');
const totalFocusTimeDisplay = document.getElementById('totalFocusTime');
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const themeSwitch = document.querySelector('.theme-switch');
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-links li');

// Звуковые эффекты
const timerCompleteSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
const breakCompleteSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');

// Инициализация календаря
const calendar = flatpickr("#calendar", {
    inline: true,
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    locale: "ru",
    onChange: function(selectedDates, dateStr) {
        showEventsForDate(dateStr);
    }
});

// Создание элемента уведомления
function createNotificationElement() {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-bell"></i>
        <span class="notification-text"></span>
    `;
    document.body.appendChild(notification);
    return notification;
}

const notificationElement = createNotificationElement();

// Загрузка сохраненных данных
function loadStats() {
    const savedStats = localStorage.getItem('pomodoroStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
        updateStatsDisplay();
    }
}

// Сохранение статистики
function saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// Обновление отображения статистики
function updateStatsDisplay() {
    completedPomodorosDisplay.textContent = stats.completedPomodoros;
    totalFocusTimeDisplay.textContent = stats.totalFocusTime;
    document.getElementById('streak').textContent = stats.streak;
    updateProductivityChart();
}

// Функции таймера
function updateDisplay(minutes, seconds) {
    minutesDisplay.textContent = String(minutes).padStart(2, '0');
    secondsDisplay.textContent = String(seconds).padStart(2, '0');
    
    // Обновление кругового прогресса
    const totalSeconds = TIMES[currentMode] * 60;
    const progress = (timeLeft / totalSeconds) * 283;
    document.querySelector('.timer-progress').style.strokeDashoffset = 283 - progress;
}

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timerId);
        isRunning = false;
        handleTimerComplete();
        return;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    updateDisplay(minutes, seconds);
    timeLeft--;
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerId = setInterval(updateTimer, 1000);
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
    }
}

function pauseTimer() {
    clearInterval(timerId);
    isRunning = false;
    startButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';
}

function resetTimer() {
    clearInterval(timerId);
    isRunning = false;
    setTime(TIMES[currentMode]);
    startButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';
}

function setTime(minutes) {
    timeLeft = minutes * 60;
    updateDisplay(minutes, 0);
}

// Улучшенная функция уведомлений
function showNotification(title, body, type = 'info') {
    // Браузерное уведомление
    if (Notification.permission === 'granted') {
        new Notification(title, { 
            body,
            icon: '/favicon.ico'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { 
                    body,
                    icon: '/favicon.ico'
                });
            }
        });
    }

    // Внутреннее уведомление
    const notificationText = notificationElement.querySelector('.notification-text');
    notificationText.textContent = body;
    
    // Добавляем иконку в зависимости от типа уведомления
    const icon = notificationElement.querySelector('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-bell';
    
    // Показываем уведомление
    notificationElement.classList.add('show');
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        notificationElement.classList.remove('show');
    }, 3000);

    // Воспроизводим звук
    if (type === 'success') {
        breakCompleteSound.play();
    } else {
        timerCompleteSound.play();
    }
}

// Обновленная функция завершения таймера
function handleTimerComplete() {
    const timerCircle = document.querySelector('.timer-circle');
    timerCircle.classList.add('complete');
    
    setTimeout(() => {
        timerCircle.classList.remove('complete');
    }, 500);

    if (currentMode === 'pomodoro') {
        stats.completedPomodoros++;
        stats.totalFocusTime += TIMES.pomodoro;
        updateStatsDisplay();
        saveStats();

        // Получаем рекомендации от AI
        const aiSuggestions = AI.suggestNextPomodoro();
        const message = `Время сделать перерыв!\n\n${aiSuggestions.recommendations.join('\n')}`;
        
        showNotification('Pomodoro завершен!', message, 'success');
        switchMode('shortBreak');
    } else {
        const aiSuggestions = AI.suggestNextPomodoro();
        const message = `Время вернуться к работе!\n\n${aiSuggestions.recommendations.join('\n')}`;
        
        showNotification('Перерыв завершен!', message, 'info');
        switchMode('pomodoro');
    }
    resetTimer();
}

// Переключение режимов
function switchMode(mode) {
    currentMode = mode;
    [pomodoroButton, shortBreakButton, longBreakButton].forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(mode).classList.add('active');
    resetTimer();
}

// Управление задачами
let tasks = JSON.parse(localStorage.getItem('pomodoroTasks')) || [];

function saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span>${task.text}</span>
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
    `;

    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        li.classList.toggle('completed', task.completed);
        saveTasks();
    });

    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        li.remove();
        tasks = tasks.filter(t => t !== task);
        saveTasks();
    });

    if (task.completed) {
        li.classList.add('completed');
    }

    return li;
}

// Обновленная функция добавления задачи
function addTask(text) {
    if (!text.trim()) return;
    
    const task = {
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    tasks.push(task);
    const taskElement = createTaskElement(task);
    taskList.appendChild(taskElement);
    saveTasks();
    
    // Добавляем анимацию появления
    taskElement.style.animation = 'fadeIn 0.3s ease';
    
    // Очищаем поле ввода
    taskInput.value = '';

    // Получаем рекомендации от AI для новой задачи
    const aiSuggestions = AI.suggestNextPomodoro();
    if (aiSuggestions.recommendations.length > 0) {
        showNotification('AI Рекомендация', aiSuggestions.recommendations[0], 'info');
    }
}

// Управление событиями календаря
function addEvent(event) {
    events.push(event);
    localStorage.setItem('pomodoroEvents', JSON.stringify(events));
    showEventsForDate(event.date);
}

function showEventsForDate(date) {
    const dateEvents = events.filter(event => event.date.startsWith(date.split(' ')[0]));
    // Обновление отображения событий для выбранной даты
}

// График продуктивности
function updateProductivityChart() {
    const ctx = document.getElementById('productivityChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(stats.dailyStats),
            datasets: [{
                label: 'Завершенные помодоро',
                data: Object.values(stats.dailyStats),
                borderColor: '#6c5ce7',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

// Переключение страниц
function switchPage(page) {
    currentPage = page;
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
}

// Переключение темы
function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Обработчики событий
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

pomodoroButton.addEventListener('click', () => switchMode('pomodoro'));
shortBreakButton.addEventListener('click', () => switchMode('shortBreak'));
longBreakButton.addEventListener('click', () => switchMode('longBreak'));

// Обновленный обработчик для кнопки добавления задачи
addTaskButton.addEventListener('click', () => {
    const text = taskInput.value;
    addTask(text);
});

// Обновленный обработчик для Enter в поле ввода задачи
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const text = taskInput.value;
        addTask(text);
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        switchPage(link.dataset.page);
    });
});

themeSwitch.addEventListener('click', toggleTheme);

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setTime(TIMES.pomodoro);
    pauseButton.style.display = 'none';
    
    // Загрузка сохраненных задач
    tasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });

    // Загрузка темы
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    // Запрос разрешения на уведомления
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}); 
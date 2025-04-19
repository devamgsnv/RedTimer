// Notifications Module
class SmartNotifications {
    constructor() {
        this.notifications = [];
        this.preferences = this.loadPreferences();
        this.checkPermission();
    }

    // Загрузка предпочтений
    loadPreferences() {
        const savedPrefs = localStorage.getItem('redTimerNotificationPrefs');
        return savedPrefs ? JSON.parse(savedPrefs) : {
            enabled: true,
            sound: true,
            desktop: true,
            smartReminders: true,
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
            }
        };
    }

    // Сохранение предпочтений
    savePreferences() {
        localStorage.setItem('redTimerNotificationPrefs', JSON.stringify(this.preferences));
    }

    // Проверка разрешений
    async checkPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.preferences.enabled = permission === 'granted';
            this.savePreferences();
        }
    }

    // Создание уведомления
    createNotification(title, options = {}) {
        if (!this.preferences.enabled) return;

        if (this.isQuietHours()) return;

        const defaultOptions = {
            icon: '/assets/icon.png',
            badge: '/assets/badge.png',
            silent: !this.preferences.sound
        };

        const notification = new Notification(title, { ...defaultOptions, ...options });
        this.notifications.push(notification);

        if (this.preferences.sound) {
            this.playSound();
        }

        return notification;
    }

    // Проверка тихого часа
    isQuietHours() {
        if (!this.preferences.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMinute] = this.preferences.quietHours.start.split(':').map(Number);
        const [endHour, endMinute] = this.preferences.quietHours.end.split(':').map(Number);
        
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        return currentTime >= startTime || currentTime <= endTime;
    }

    // Воспроизведение звука
    playSound() {
        const audio = new Audio('/assets/notification.mp3');
        audio.play().catch(error => console.log('Error playing sound:', error));
    }

    // Умное напоминание о перерыве
    scheduleBreakReminder(workDuration) {
        const breakTime = this.calculateOptimalBreakTime(workDuration);
        setTimeout(() => {
            this.createNotification('Время перерыва!', {
                body: 'Рекомендуется сделать перерыв для поддержания продуктивности.',
                tag: 'break-reminder'
            });
        }, breakTime);
    }

    // Расчет оптимального времени перерыва
    calculateOptimalBreakTime(workDuration) {
        // Базовая формула: 5 минут перерыва на каждые 25 минут работы
        return Math.floor(workDuration / 25) * 5 * 60 * 1000;
    }

    // Настройка тихого часа
    setQuietHours(enabled, start, end) {
        this.preferences.quietHours = {
            enabled,
            start,
            end
        };
        this.savePreferences();
    }

    // Обновление предпочтений
    updatePreferences(newPrefs) {
        this.preferences = { ...this.preferences, ...newPrefs };
        this.savePreferences();
    }
}

export default SmartNotifications; 
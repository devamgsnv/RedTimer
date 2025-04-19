// Personalization Module
class Personalization {
    constructor() {
        this.preferences = this.loadPreferences();
        this.themes = this.loadThemes();
        this.applyTheme(this.preferences.currentTheme);
    }

    // Загрузка предпочтений
    loadPreferences() {
        const savedPrefs = localStorage.getItem('redTimerPreferences');
        return savedPrefs ? JSON.parse(savedPrefs) : {
            currentTheme: 'light',
            soundEnabled: true,
            notificationSound: 'default',
            timerIntervals: {
                work: 25,
                shortBreak: 5,
                longBreak: 15
            },
            autoStartBreaks: false,
            autoStartPomodoros: false,
            showNotifications: true
        };
    }

    // Сохранение предпочтений
    savePreferences() {
        localStorage.setItem('redTimerPreferences', JSON.stringify(this.preferences));
    }

    // Загрузка тем
    loadThemes() {
        return {
            light: {
                primary: '#ff4444',
                secondary: '#ffffff',
                background: '#f5f5f5',
                text: '#333333',
                accent: '#ff6b6b'
            },
            dark: {
                primary: '#ff4444',
                secondary: '#2d2d2d',
                background: '#1a1a1a',
                text: '#ffffff',
                accent: '#ff6b6b'
            },
            custom: {}
        };
    }

    // Применение темы
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });

        this.preferences.currentTheme = themeName;
        this.savePreferences();
    }

    // Создание пользовательской темы
    createCustomTheme(name, colors) {
        this.themes.custom[name] = colors;
        localStorage.setItem('redTimerThemes', JSON.stringify(this.themes));
    }

    // Обновление интервалов таймера
    updateTimerIntervals(intervals) {
        this.preferences.timerIntervals = {
            ...this.preferences.timerIntervals,
            ...intervals
        };
        this.savePreferences();
    }

    // Обновление звуковых настроек
    updateSoundSettings(settings) {
        this.preferences.soundEnabled = settings.enabled ?? this.preferences.soundEnabled;
        this.preferences.notificationSound = settings.sound ?? this.preferences.notificationSound;
        this.savePreferences();
    }

    // Получение текущих настроек
    getCurrentSettings() {
        return {
            ...this.preferences,
            availableThemes: Object.keys(this.themes),
            currentThemeColors: this.themes[this.preferences.currentTheme]
        };
    }

    // Сброс настроек
    resetSettings() {
        this.preferences = this.loadPreferences();
        this.themes = this.loadThemes();
        this.applyTheme('light');
        this.savePreferences();
    }

    // Экспорт настроек
    exportSettings() {
        return {
            preferences: this.preferences,
            themes: this.themes
        };
    }

    // Импорт настроек
    importSettings(settings) {
        if (settings.preferences) {
            this.preferences = settings.preferences;
        }
        if (settings.themes) {
            this.themes = settings.themes;
        }
        this.savePreferences();
        this.applyTheme(this.preferences.currentTheme);
    }
}

export default Personalization; 
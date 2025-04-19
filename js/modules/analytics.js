 // Analytics Module
class Analytics {
    constructor() {
        this.stats = {
            daily: {},
            weekly: {},
            monthly: {}
        };
        this.heatmapData = {};
        this.loadStats();
    }

    // Сохранение статистики
    saveStats() {
        localStorage.setItem('redTimerStats', JSON.stringify(this.stats));
    }

    // Загрузка статистики
    loadStats() {
        const savedStats = localStorage.getItem('redTimerStats');
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
        }
    }

    // Добавление завершенной сессии
    addSession(duration, type) {
        const date = new Date().toISOString().split('T')[0];
        if (!this.stats.daily[date]) {
            this.stats.daily[date] = {
                totalTime: 0,
                sessions: 0,
                types: {}
            };
        }
        this.stats.daily[date].totalTime += duration;
        this.stats.daily[date].sessions++;
        this.stats.daily[date].types[type] = (this.stats.daily[date].types[type] || 0) + 1;
        
        this.updateHeatmap(date, duration);
        this.saveStats();
    }

    // Обновление тепловой карты
    updateHeatmap(date, duration) {
        const dayOfWeek = new Date(date).getDay();
        if (!this.heatmapData[dayOfWeek]) {
            this.heatmapData[dayOfWeek] = {};
        }
        this.heatmapData[dayOfWeek][date] = (this.heatmapData[dayOfWeek][date] || 0) + duration;
    }

    // Получение статистики за период
    getStatsForPeriod(startDate, endDate) {
        const stats = {
            totalTime: 0,
            sessions: 0,
            types: {}
        };

        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            if (this.stats.daily[dateStr]) {
                stats.totalTime += this.stats.daily[dateStr].totalTime;
                stats.sessions += this.stats.daily[dateStr].sessions;
                Object.entries(this.stats.daily[dateStr].types).forEach(([type, count]) => {
                    stats.types[type] = (stats.types[type] || 0) + count;
                });
            }
        }

        return stats;
    }

    // Экспорт статистики
    exportStats(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.stats, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV();
        }
    }

    // Конвертация в CSV
    convertToCSV() {
        const headers = ['Date', 'Total Time', 'Sessions', 'Types'];
        const rows = Object.entries(this.stats.daily).map(([date, data]) => {
            return [
                date,
                data.totalTime,
                data.sessions,
                Object.entries(data.types).map(([type, count]) => `${type}:${count}`).join(';')
            ].join(',');
        });
        return [headers.join(','), ...rows].join('\n');
    }
}

export default Analytics;
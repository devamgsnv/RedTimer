 // Integrations Module
class Integrations {
    constructor() {
        this.integrations = {
            googleCalendar: null,
            trello: null,
            notion: null
        };
        this.loadIntegrations();
    }

    // Загрузка настроек интеграций
    loadIntegrations() {
        const savedIntegrations = localStorage.getItem('redTimerIntegrations');
        if (savedIntegrations) {
            this.integrations = JSON.parse(savedIntegrations);
        }
    }

    // Сохранение настроек интеграций
    saveIntegrations() {
        localStorage.setItem('redTimerIntegrations', JSON.stringify(this.integrations));
    }

    // Google Calendar интеграция
    async setupGoogleCalendar() {
        try {
            // Здесь будет код для OAuth аутентификации
            const response = await gapi.client.init({
                apiKey: 'YOUR_API_KEY',
                clientId: 'YOUR_CLIENT_ID',
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                scope: 'https://www.googleapis.com/auth/calendar'
            });
            this.integrations.googleCalendar = response;
            this.saveIntegrations();
            return true;
        } catch (error) {
            console.error('Google Calendar integration error:', error);
            return false;
        }
    }

    // Добавление события в Google Calendar
    async addToGoogleCalendar(event) {
        if (!this.integrations.googleCalendar) return false;

        try {
            const response = await gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': {
                    'summary': event.title,
                    'description': event.description,
                    'start': {
                        'dateTime': event.startTime,
                        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                    'end': {
                        'dateTime': event.endTime,
                        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                    }
                }
            });
            return response;
        } catch (error) {
            console.error('Error adding event to Google Calendar:', error);
            return false;
        }
    }

    // Trello интеграция
    async setupTrello() {
        try {
            // Здесь будет код для Trello OAuth
            const response = await Trello.authorize({
                type: 'popup',
                name: 'RedTimer',
                scope: { read: true, write: true },
                expiration: 'never',
                success: () => {
                    this.integrations.trello = true;
                    this.saveIntegrations();
                }
            });
            return true;
        } catch (error) {
            console.error('Trello integration error:', error);
            return false;
        }
    }

    // Добавление задачи в Trello
    async addToTrello(task) {
        if (!this.integrations.trello) return false;

        try {
            const response = await Trello.post('/cards', {
                name: task.title,
                desc: task.description,
                idList: task.listId
            });
            return response;
        } catch (error) {
            console.error('Error adding task to Trello:', error);
            return false;
        }
    }

    // Notion интеграция
    async setupNotion() {
        try {
            // Здесь будет код для Notion OAuth
            const response = await fetch('https://api.notion.com/v1/oauth/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.NOTION_CLIENT_SECRET}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: 'YOUR_AUTH_CODE'
                })
            });
            const data = await response.json();
            this.integrations.notion = data.access_token;
            this.saveIntegrations();
            return true;
        } catch (error) {
            console.error('Notion integration error:', error);
            return false;
        }
    }

    // Добавление страницы в Notion
    async addToNotion(page) {
        if (!this.integrations.notion) return false;

        try {
            const response = await fetch('https://api.notion.com/v1/pages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.integrations.notion}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parent: { database_id: page.databaseId },
                    properties: {
                        Name: {
                            title: [
                                {
                                    text: {
                                        content: page.title
                                    }
                                }
                            ]
                        },
                        Description: {
                            rich_text: [
                                {
                                    text: {
                                        content: page.description
                                    }
                                }
                            ]
                        }
                    }
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding page to Notion:', error);
            return false;
        }
    }

    // Экспорт данных
    async exportData(format = 'json') {
        const data = {
            tasks: JSON.parse(localStorage.getItem('redTimerTasks')),
            stats: JSON.parse(localStorage.getItem('redTimerStats')),
            settings: JSON.parse(localStorage.getItem('redTimerSettings'))
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data);
        }
    }

    // Конвертация в CSV
    convertToCSV(data) {
        const csvRows = [];
        
        // Tasks
        csvRows.push('Tasks');
        csvRows.push('ID,Title,Description,Category,Priority,Completed,Created');
        data.tasks.forEach(task => {
            csvRows.push([
                task.id,
                task.title,
                task.description,
                task.category,
                task.priority,
                task.completed,
                task.created
            ].join(','));
        });

        // Stats
        csvRows.push('\nStats');
        csvRows.push('Date,Total Time,Sessions');
        Object.entries(data.stats.daily).forEach(([date, stats]) => {
            csvRows.push([
                date,
                stats.totalTime,
                stats.sessions
            ].join(','));
        });

        return csvRows.join('\n');
    }
}

export default Integrations;
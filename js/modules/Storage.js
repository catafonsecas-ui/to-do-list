export class Storage {
    constructor(key = 'my_tasks') {
        if (!this.isLocalStorageAvailable()) {
            throw new Error('Local storage is not available');
        }
        this.STORAGE_KEY = key;
    }

    isLocalStorageAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    getTasks() {
        try {
            const tasksJson = localStorage.getItem(this.STORAGE_KEY) || '[]';
            const tasks = JSON.parse(tasksJson);
            
            tasks.forEach(task => {
                if (!task.id) {
                    task.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                }
            });
            
            return tasks;
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    saveTasks(tasks) {
        try {
            const cleanTasks = tasks.map(task => ({
                id: task.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                text: task.text || '',
                completed: Boolean(task.completed),
                deadline: task.deadline || null,
                priority: task.priority || 'medium',
                project: task.project || null,
                subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
                description: task.description || '',
                reminder: task.reminder || null
            }));
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanTasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    getProjects() {
        try {
            const projectsJson = localStorage.getItem('my_projects') || '[]';
            return JSON.parse(projectsJson);
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    saveProjects(projects) {
        try {
            localStorage.setItem('my_projects', JSON.stringify(projects));
        } catch (error) {
            console.error('Error saving projects:', error);
        }    
    }
}

export class Storage {
    constructor(key = 'mis_tareas') {
        this.STORAGE_KEY = key;
    }

    getTasks() {
        try {
            const tasksJson = localStorage.getItem(this.STORAGE_KEY) || '[]';
            const tasks = JSON.parse(tasksJson);
            
            // Asegurarse de que cada tarea tenga un ID
            tasks.forEach(task => {
                if (!task.id) {
                    task.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                }
            });
            
            return tasks;
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            return [];
        }
    }

    saveTasks(tasks) {
        try {
            // Asegurarse de que todas las tareas son objetos Task válidos
            const cleanTasks = tasks.map(task => ({
                id: task.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                texto: task.texto || '',
                completada: Boolean(task.completada),
                deadline: task.deadline || null,
                prioridad: task.prioridad || 'media',
                proyecto: task.proyecto || null,
                subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
                descripcion: task.descripcion || '',
                recordatorio: task.recordatorio || null
            }));
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanTasks));
        } catch (error) {
            console.error('Error al guardar tareas:', error);
        }
    }

    getLastProject() {
        return localStorage.getItem('ultima_categoria') || '';
    }

    saveLastProject(project) {
        localStorage.setItem('ultima_categoria', project);
    }
}
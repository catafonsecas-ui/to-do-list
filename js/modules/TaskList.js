import { Task } from './Task.js';
import { Storage } from './Storage.js';

export class TaskList {
    constructor(notifications) {
        this.storage = new Storage();
        this.notifications = notifications;
        this.tareas = [];
        this.projects = [];
        this.filtro = 'all';
        this.orden = 'manual';
        this.proyectoFiltro = 'all';
        this.loadTasks();
        this.loadProjects();
    }

    loadTasks() {
        const loadedTasks = this.storage.getTasks();
        if (Array.isArray(loadedTasks)) {
            this.tareas = loadedTasks.map(taskData => {
                const task = new Task(taskData.texto);
                Object.assign(task, taskData);
                return task;
            });
        }
    }

    loadProjects() {
        const loadedProjects = this.storage.getProjects();
        if (Array.isArray(loadedProjects)) {
            this.projects = loadedProjects;
        }
    }

    addTask(details) {
        console.log('TaskList - addTask received details:', details);
        const task = new Task(details.texto);
        task.deadline = details.deadline;
        task.prioridad = details.prioridad;
        task.recordatorio = details.recordatorio;
        task.proyecto = details.proyecto;
        this.tareas.push(task);
        this.save();
        console.log('TaskList - Task added:', task);
        return task;
    }

    toggleTask(taskId) {
        const task = this.tareas.find(t => t.id === taskId);
        if (task) {
            task.toggle();
            this.save();
        }
    }

    removeTask(taskId) {
        this.tareas = this.tareas.filter(t => t.id !== taskId);
        this.save();
    }

    updateTaskText(taskId, text) {
        const task = this.tareas.find(t => t.id === taskId);
        if (task) {
            task.updateText(text);
            this.save();
        }
    }

    updateTaskDetails(taskId, details) {
        const task = this.tareas.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, details);
            this.save();
        }
    }

    addSubtask(taskId, subtaskText) {
        const task = this.tareas.find(t => t.id === taskId);
        if (task) {
            task.addSubtask(subtaskText);
            this.save();
        }
    }

    toggleSubtask(taskId, subtaskIndex) {
        const task = this.tareas.find(t => t.id === taskId);
        if (task) {
            task.toggleSubtask(subtaskIndex);
            this.save();
        }
    }

    updateSubtask(taskId, subtaskIndex, subtaskText) {
        const task = this.tareas.find(t => t.id === taskId);
        if (task) {
            task.updateSubtask(subtaskIndex, subtaskText);
            this.save();
        }
    }

    removeSubtask(taskId, subtaskIndex) {
        const task = this.tareas.find(t => t.id === taskId);
        if (task) {
            task.removeSubtask(subtaskIndex);
            this.save();
        }
    }

    clearCompleted() {
        this.tareas = this.tareas.filter(t => !t.completada);
        this.save();
    }

    getFilteredAndSortedTasks() {
        let tasks = [...this.tareas];

        // Apply filters
        if (this.filtro === 'today') {
            const today = new Date().toISOString().slice(0, 10);
            tasks = tasks.filter(t => t.deadline && t.deadline.slice(0, 10) === today);
        } else if (this.filtro === 'upcoming') {
            const today = new Date().toISOString().slice(0, 10);
            tasks = tasks.filter(t => t.deadline && t.deadline.slice(0, 10) > today);
        }

        if (this.proyectoFiltro !== 'all') {
            tasks = tasks.filter(t => t.proyecto === this.proyectoFiltro);
        }

        // Apply sorting
        if (this.orden === 'fecha') {
            tasks.sort((a, b) => (a.deadline || 'zz').localeCompare(b.deadline || 'zz'));
        } else if (this.orden === 'prioridad') {
            const priorityOrder = { 'alta': 1, 'media': 2, 'baja': 3 };
            tasks.sort((a, b) => (priorityOrder[a.prioridad] || 4) - (priorityOrder[b.prioridad] || 4));
        }

        return tasks;
    }

    getUniqueProjects() {
        return this.projects;
    }

    setFilter(filter) {
        this.filtro = filter;
    }

    setOrder(order) {
        this.orden = order;
    }

    setProjectFilter(project) {
        this.proyectoFiltro = project;
    }

    addProject(projectName) {
        if (!this.projects.includes(projectName)) {
            this.projects.push(projectName);
            this.saveProjects();
        }
    }

    save() {
        this.storage.saveTasks(this.tareas);
    }

    saveProjects() {
        this.storage.saveProjects(this.projects);
    }
}

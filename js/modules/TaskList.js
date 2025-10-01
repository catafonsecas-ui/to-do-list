import { Task } from './Task.js';
import { Storage } from './Storage.js';

export class TaskList {
    constructor(notifications) {
        this.storage = new Storage();
        this.notifications = notifications;
        this.tasks = [];
        this.projects = [];
        this.filter = 'all';
        this.sort = 'manual';
        this.projectFilter = 'all';
        this.loadTasks();
        this.loadProjects();
    }

    loadTasks() {
        const loadedTasks = this.storage.getTasks();
        if (Array.isArray(loadedTasks)) {
            this.tasks = loadedTasks.map(taskData => {
                const task = new Task(taskData.text);
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
        const task = new Task(details.text);
        task.deadline = details.deadline;
        task.priority = details.priority;
        task.reminder = details.reminder;
        task.project = details.project;
        this.tasks.push(task);
        this.save();
        console.log('TaskList - Task added:', task);
        return task;
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.toggle();
            this.save();
        }
    }

    removeTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.save();
    }

    updateTaskText(taskId, text) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.updateText(text);
            this.save();
        }
    }

    updateTaskDetails(taskId, details) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, details);
            this.save();
        }
    }

    addSubtask(taskId, subtaskText) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.addSubtask(subtaskText);
            this.save();
        }
    }

    toggleSubtask(taskId, subtaskIndex) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.toggleSubtask(subtaskIndex);
            this.save();
        }
    }

    updateSubtask(taskId, subtaskIndex, subtaskText) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.updateSubtask(subtaskIndex, subtaskText);
            this.save();
        }
    }

    removeSubtask(taskId, subtaskIndex) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.removeSubtask(subtaskIndex);
            this.save();
        }
    }

    getFilteredAndSortedTasks() {
        let tasks = [...this.tasks];

        // Apply filters
        if (this.filter === 'today') {
            const today = new Date().toISOString().slice(0, 10);
            tasks = tasks.filter(t => t.deadline && t.deadline.slice(0, 10) === today);
        } else if (this.filter === 'upcoming') {
            const today = new Date().toISOString().slice(0, 10);
            tasks = tasks.filter(t => t.deadline && t.deadline.slice(0, 10) > today);
        } else if (this.filter === 'high') {
            tasks = tasks.filter(t => t.priority === 'high' && !t.completed);
        } else if (this.filter === 'medium') {
            tasks = tasks.filter(t => t.priority === 'medium' && !t.completed);
        } else if (this.filter === 'low') {
            tasks = tasks.filter(t => t.priority === 'low' && !t.completed);
        } else if (this.filter === 'completed') {
            tasks = tasks.filter(t => t.completed);
        }

        if (this.projectFilter !== 'all') {
            tasks = tasks.filter(t => t.project === this.projectFilter);
        }

        // Apply sorting
        console.log('TaskList - getFilteredAndSortedTasks: current sort is', this.sort);
        if (this.sort === 'dueDate') {
            tasks.sort((a, b) => (a.deadline || 'zz').localeCompare(b.deadline || 'zz'));
        } else if (this.sort === 'priority') {
            const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
            tasks.sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4));
        } else if (this.sort === 'project') {
            tasks.sort((a, b) => (a.project || 'zz').localeCompare(b.project || 'zz'));
        } else if (this.sort === 'project') {
            tasks.sort((a, b) => (a.project || 'zz').localeCompare(b.project || 'zz'));
        }

        return tasks;
    }

    getUniqueProjects() {
        return this.projects;
    }

    setFilter(filter) {
        this.filter = filter;
    }

    setSort(sort) {
        console.log('TaskList - setSort called with:', sort);
        this.sort = sort;
    }

    setProjectFilter(project) {
        this.projectFilter = project;
    }

    addProject(projectName) {
        if (!this.projects.includes(projectName)) {
            this.projects.push(projectName);
            this.saveProjects();
        }
    }

    updateProjectName(oldName, newName) {
        const projectIndex = this.projects.indexOf(oldName);
        if (projectIndex !== -1) {
            this.projects[projectIndex] = newName;
        }
    
        this.tasks.forEach(task => {
            if (task.project === oldName) {
                task.project = newName;
            }
        });
    
        this.save();
        this.saveProjects();
    }

    deleteProject(projectName) {
        this.projects = this.projects.filter(p => p !== projectName);
    
        this.tasks.forEach(task => {
            if (task.project === projectName) {
                task.project = '';
            }
        });
    
        this.save();
        this.saveProjects();
    }

    save() {
        this.storage.saveTasks(this.tasks);
    }

    saveProjects() {
        this.storage.saveProjects(this.projects);
    }
}
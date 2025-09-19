import { Task } from './Task.js';
import { Storage } from './Storage.js';
import { Notifications } from './Notifications.js';

export class TaskList {
    constructor() {
        console.log('Inicializando TaskList');
        this.storage = new Storage();
        this.notifications = new Notifications();
        this.tareas = [];  // Inicializamos el array vacío
        this.filtro = 'todas';
        this.orden = 'manual';
        this.proyectoFiltro = 'todas';
        this.dragIndex = null;
        
        // Cargamos las tareas después de inicializar todo
        this.loadTasks();
        console.log('Tareas cargadas:', this.tareas);
        
        // Iniciamos las notificaciones después de cargar las tareas
        this.notifications.startChecking(this);
    }

    loadTasks() {
        try {
            console.log('Intentando cargar tareas desde Storage');
            const loadedTasks = this.storage.getTasks();
            console.log('Tareas obtenidas de Storage:', loadedTasks);
            
            if (!Array.isArray(loadedTasks)) {
                console.error('Las tareas cargadas no son un array');
                this.tareas = [];
                return;
            }

            // Limpiar localStorage si hay datos corruptos
            if (loadedTasks.some(task => typeof task !== 'object' || task === null)) {
                console.error('Datos corruptos detectados en localStorage');
                this.storage.saveTasks([]);
                this.tareas = [];
                return;
            }

            this.tareas = loadedTasks.map(taskData => {
                try {
                    // Verificar y limpiar los datos
                    const cleanData = {
                        texto: String(taskData.texto || '').trim(),
                        deadline: taskData.deadline ? new Date(taskData.deadline).toISOString() : null,
                        prioridad: ['alta', 'media', 'baja'].includes(taskData.prioridad) ? taskData.prioridad : 'media',
                        proyecto: taskData.proyecto ? String(taskData.proyecto).trim() : null
                    };

                    // Si no hay texto, ignorar la tarea
                    if (!cleanData.texto) {
                        console.error('Tarea sin texto:', taskData);
                        return null;
                    }

                    const task = new Task(
                        cleanData.texto,
                        cleanData.deadline,
                        cleanData.prioridad,
                        cleanData.proyecto
                    );

                    // Restaurar y validar todas las propiedades adicionales
                    task.id = taskData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    task.completada = Boolean(taskData.completada);
                    task.subtasks = Array.isArray(taskData.subtasks) ? 
                        taskData.subtasks.filter(st => st && typeof st === 'object' && st.texto).map(st => ({
                            texto: String(st.texto).trim(),
                            completada: Boolean(st.completada)
                        })) : [];
                    task.descripcion = taskData.descripcion ? String(taskData.descripcion).trim() : '';
                    task.recordatorio = taskData.recordatorio ? new Date(taskData.recordatorio).toISOString() : null;

                    return task;
                } catch (error) {
                    console.error('Error al procesar tarea:', taskData, error);
                    return null;
                }
            }).filter(task => task !== null); // Eliminar tareas inválidas

            console.log('Tareas procesadas y cargadas:', this.tareas);
        } catch (error) {
            console.error('Error al cargar tareas:', error);
            this.tareas = [];
        }
    }

    addTask(texto, deadline, prioridad, proyecto) {
        console.log('Creando nueva tarea:', { texto, deadline, prioridad, proyecto });
        const task = new Task(texto, deadline, prioridad, proyecto);
        console.log('Tarea creada:', task);
        this.tareas.push(task);
        console.log('Tareas actualizadas:', this.tareas);
        this.save();
        return task;
    }

    removeTask(index) {
        console.log('Intentando eliminar tarea en índice:', index);
        console.log('Tareas antes de eliminar:', this.tareas);
        
        if (index >= 0 && index < this.tareas.length) {
            const removedTask = this.tareas.splice(index, 1)[0];
            console.log('Tarea eliminada:', removedTask);
            console.log('Tareas después de eliminar:', this.tareas);
            this.save();
            return true;
        }
        console.log('Índice fuera de rango:', index, 'longitud de tareas:', this.tareas.length);
        return false;
    }

    clearCompleted() {
        this.tareas = this.tareas.filter(t => !t.completada);
        this.save();
    }

    getFilteredAndSortedTasks() {
        console.log('Obteniendo tareas filtradas y ordenadas');
        console.log('Tareas originales:', this.tareas);

        if (!Array.isArray(this.tareas)) {
            console.error('this.tareas no es un array');
            return [];
        }

        let listaTareas = this.tareas.map((t, index) => {
            if (!(t instanceof Task)) {
                console.error('Elemento no es instancia de Task:', t);
                return null;
            }
            return {...t, index};
        }).filter(t => t !== null);

        console.log('Tareas mapeadas:', listaTareas);

        // Aplicar filtros
        listaTareas = listaTareas.filter(t => {
            if (t.hidden && !t.texto) return false; // Ocultar tareas especiales de proyecto
            if (this.filtro === 'pendientes' && t.completada) return false;
            if (this.filtro === 'completadas' && !t.completada) return false;
            if (this.proyectoFiltro !== 'todas' && t.proyecto !== this.proyectoFiltro) return false;
            return true;
        });

        // Aplicar ordenamiento
        if (this.orden === 'fecha') {
            listaTareas.sort((a, b) => {
                if (!a.deadline && !b.deadline) return a.index - b.index;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                const dateA = new Date(a.deadline);
                const dateB = new Date(b.deadline);
                const cmp = dateA - dateB;
                return cmp !== 0 ? cmp : (a.index - b.index);
            });
        } else if (this.orden === 'prioridad') {
            const prioridadOrden = { alta: 1, media: 2, baja: 3 };
            listaTareas.sort((a, b) => {
                const aP = prioridadOrden[a.prioridad] ?? 4;
                const bP = prioridadOrden[b.prioridad] ?? 4;
                if (aP !== bP) return aP - bP;
                if (a.deadline && b.deadline) {
                    const cmp = a.deadline.localeCompare(b.deadline);
                    return cmp !== 0 ? cmp : (a.index - b.index);
                }
                if (a.deadline && !b.deadline) return -1;
                if (!a.deadline && b.deadline) return 1;
                return a.index - b.index;
            });
        }

        return listaTareas;
    }

    getUniqueProjects() {
        const projects = Array.from(new Set(
            this.tareas
                .filter(t => t.proyecto && (!t.hidden || t.texto))
                .map(t => t.proyecto)
        )).sort();
        console.log('Proyectos únicos encontrados:', projects);
        return projects;
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

    updateTaskPosition(fromIndex, toIndex) {
        if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0) {
            const [moved] = this.tareas.splice(fromIndex, 1);
            this.tareas.splice(toIndex, 0, moved);
            this.save();
            return true;
        }
        return false;
    }

    save() {
        this.storage.saveTasks(this.tareas);
    }

    addProject(projectName) {
        console.log('Intentando añadir nuevo proyecto:', projectName);
        if (!projectName || projectName.trim() === '') {
            console.error('Nombre de proyecto vacío');
            return false;
        }

        projectName = projectName.trim();
        const projects = this.getUniqueProjects();
        
        if (projects.includes(projectName)) {
            console.log('El proyecto ya existe:', projectName);
            return false;
        }

        // Crear una tarea especial para mantener el proyecto
        const task = new Task('', null, 'media', projectName);
        task.hidden = true;
        this.tareas.push(task);
        this.save();
        
        console.log('Proyecto añadido:', projectName);
        return true;
    }
}
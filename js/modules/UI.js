export class UI {
    constructor(taskList) {
        this.taskList = taskList;
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.form = document.getElementById('form');
        this.input = document.getElementById('taskInput');
        this.dateInput = document.getElementById('dateInput');
        this.timeInput = document.getElementById('timeInput');
        this.priorityInput = document.getElementById('priorityInput');
        this.projectInput = document.getElementById('projectInput');
        this.reminderInput = document.getElementById('reminderInput');
        
        this.lista = document.getElementById('lista');
        this.clearBtn = document.getElementById('clearCompleted');
        this.filterSelect = document.getElementById('filter');
        this.projectFilter = document.getElementById('projectFilter');
        this.sortSelect = document.getElementById('sort');

        // Si algún elemento no existe, mostrar error
        const elements = [this.form, this.input, this.dateInput, this.timeInput,
                         this.priorityInput, this.reminderInput, this.lista,
                         this.clearBtn, this.filterSelect, this.projectFilter,
                         this.sortSelect];
                         
        elements.forEach((el, i) => {
            if (!el) console.error(`Elemento #${i} no encontrado`);
        });
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', e => this.handleSubmit(e));
        this.clearBtn.addEventListener('click', () => this.handleClearCompleted());
        this.filterSelect.addEventListener('change', () => this.handleFilterChange());
        this.sortSelect.addEventListener('change', () => this.handleSortChange());
        this.projectFilter.addEventListener('change', () => this.handleProjectFilterChange());

        this.dateInput.addEventListener('change', () => {
            this.reminderInput.disabled = !this.dateInput.value;
            if (!this.dateInput.value) {
                this.reminderInput.value = '';
            }
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        try {
            const texto = this.input.value.trim();
            if (!texto) {
                this.showFeedback('Por favor, escribe el texto de la tarea');
                return;
            }

            const fecha = this.dateInput.value;
            const hora = this.timeInput.value;
            const deadline = fecha ? (hora ? `${fecha}T${hora}` : fecha) : null;
            const prioridad = this.priorityInput.value || 'media';
            const proyecto = this.getProjectValue();

            const task = this.taskList.addTask(texto, deadline, prioridad, proyecto);
            
            if (this.reminderInput.value && deadline) {
                task.recordatorio = this.taskList.notifications.calculateNextReminder(
                    deadline,
                    this.reminderInput.value
                );
            }

            this.taskList.save();
            this.resetForm();
            this.showFeedback('Tarea creada');
            this.render();
        } catch (error) {
            console.error('Error al crear tarea:', error);
            this.showFeedback('Error al crear la tarea');
        }
    }

    getProjectValue() {
        const projectSelect = document.getElementById('projectSelect');
        if (!projectSelect) return null;
        
        if (projectSelect.value === '__nueva__') {
            const proyecto = this.projectInput.value.trim();
            if (proyecto) {
                const proyectos = this.taskList.getUniqueProjects();
                const existente = proyectos.find(p => p.toLowerCase() === proyecto.toLowerCase());
                return existente || proyecto;
            }
        } else if (projectSelect.value) {
            return projectSelect.value;
        }
        return null;
    }

    resetForm() {
        this.form.reset();
        this.reminderInput.disabled = true;
    }

    handleClearCompleted() {
        if (confirm('¿Seguro que quieres borrar todas las tareas completadas?')) {
            this.taskList.clearCompleted();
            this.render();
            this.showFeedback('Tareas completadas eliminadas');
        }
    }

    handleFilterChange() {
        this.taskList.setFilter(this.filterSelect.value);
        this.render();
    }

    handleSortChange() {
        this.taskList.setOrder(this.sortSelect.value);
        this.render();
    }

    handleProjectFilterChange() {
        this.taskList.setProjectFilter(this.projectFilter.value);
        this.render();
    }

    render() {
        this.updateProjectSelects();
        this.renderTasks();
    }

    updateProjectSelects() {
        const proyectos = this.taskList.getUniqueProjects();
        
        // Actualizar select de proyectos en el formulario
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect) {
            projectSelect.innerHTML = `
                <option value="">Sin proyecto</option>
                ${proyectos.map(p => `<option value="${p}">${p}</option>`).join('')}
                <option value="__nueva__">+ Nueva categoría...</option>
            `;
        }

        // Actualizar filtro de proyectos
        this.projectFilter.innerHTML = `
            <option value="todas">Todas</option>
            ${proyectos.map(p => `<option value="${p}">${p}</option>`).join('')}
        `;
    }

    renderTasks() {
        this.lista.innerHTML = '';
        const tasks = this.taskList.getFilteredAndSortedTasks();
        tasks.forEach((task, index) => {
            const taskElement = this.createTaskElement(task, index);
            this.lista.appendChild(taskElement);
        });
    }

    createTaskElement(task, index) {
        const li = document.createElement('li');
        li.dataset.taskId = task.id;
        li.dataset.index = index;
        if (task.completada) li.classList.add('done');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completada;
        checkbox.addEventListener('change', () => {
            task.toggle();
            this.taskList.save();
            this.render();
            this.showFeedback(task.completada ? '¡Tarea completada!' : 'Tarea pendiente');
        });

        const texto = document.createElement('span');
        texto.textContent = task.texto;
        texto.classList.add('texto');

        const deadline = document.createElement('span');
        deadline.textContent = task.deadline ? new Date(task.deadline).toLocaleString() : '(sin fecha)';
        deadline.classList.add('deadline');
        if (task.deadline && new Date(task.deadline) < new Date() && !task.completada) {
            deadline.classList.add('overdue');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '❌';
        deleteBtn.className = 'btn-borrar';
        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Seguro que quieres borrar esta tarea?')) {
                this.taskList.removeTask(index);
                this.render();
                this.showFeedback('Tarea eliminada');
            }
        });

        li.appendChild(checkbox);
        li.appendChild(texto);
        li.appendChild(deadline);
        if (task.proyecto) {
            const proyecto = document.createElement('span');
            proyecto.textContent = `[${task.proyecto}]`;
            proyecto.classList.add('proyecto');
            li.appendChild(proyecto);
        }
        li.appendChild(deleteBtn);

        return li;
    }

    showFeedback(message) {
        const feedback = document.getElementById('feedback-msg');
        if (feedback) {
            feedback.textContent = message;
            feedback.style.opacity = 1;
            clearTimeout(feedback._timeout);
            feedback._timeout = setTimeout(() => {
                feedback.style.opacity = 0;
            }, 3000);
        }
    }
}
export class UI {
    constructor(taskList) {
        this.taskList = taskList;
        this.draggedIndex = null;
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
        this.projectSelect = document.getElementById('projectSelect');
        this.projectInputContainer = document.getElementById('projectInputContainer');
        
        this.lista = document.getElementById('lista');
        this.clearBtn = document.getElementById('clearCompleted');
        this.filterSelect = document.getElementById('filter');
        this.projectFilter = document.getElementById('projectFilter');
        this.sortSelect = document.getElementById('sort');

        // Si algún elemento no existe, mostrar error
        const elements = [this.form, this.input, this.dateInput, this.timeInput,
                         this.priorityInput, this.reminderInput, this.lista,
                         this.clearBtn, this.filterSelect, this.projectFilter,
                         this.sortSelect, this.projectSelect, this.projectInputContainer];
                         
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

        // Manejar cambios en el selector de proyectos usando delegación de eventos
        this.form.addEventListener('change', e => {
            if (e.target.id === 'projectSelect') {
                if (e.target.value === '__nueva__') {
                    this.projectInputContainer.style.display = 'block';
                    this.projectInput.focus();
                } else {
                    this.projectInputContainer.style.display = 'none';
                    this.projectInput.value = '';
                }
            }
        });

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

    showFeedback(mensaje, tipo = 'success') {
        const el = document.getElementById('feedback-msg');
        if (el) {
            el.textContent = mensaje;
            el.className = `feedback ${tipo}`;
            // Trigger reflow to enable transition
            setTimeout(() => {
                el.classList.add('show');
            }, 10);

            setTimeout(() => {
                el.classList.remove('show');
            }, 3000);
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
        this.projectInputContainer.style.display = 'none';
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

    createTaskElement(task, filteredIndex) { // Renamed 'index' to 'filteredIndex' for clarity
        const li = document.createElement('li');
        li.dataset.taskId = task.id;
        li.dataset.index = task.index; // Use original index
        li.style.display = 'block'; // Override flex display for the main container li
        if (task.completada) li.classList.add('done');

        // Make the li draggable
        li.draggable = true;

        // Drag and Drop Event Listeners
        li.addEventListener('dragstart', (e) => {
            this.draggedIndex = task.index; // Store the original index of the dragged task
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', task.index); // Pass the original index
            li.classList.add('dragging');
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            if (e.target.closest('li') === li) return; // Don't highlight self
            e.dataTransfer.dropEffect = 'move';
            // Add visual feedback for drop target
            const targetLi = e.target.closest('li');
            if (targetLi && targetLi.dataset.index !== undefined) {
                targetLi.classList.add('drag-over');
            }
        });

        li.addEventListener('dragleave', (e) => {
            // Remove visual feedback
            const targetLi = e.target.closest('li');
            if (targetLi) {
                targetLi.classList.remove('drag-over');
            }
        });

        li.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const toIndex = parseInt(li.dataset.index, 10); // Get target's original index

            // Clean up drag-over class from all elements
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

            if (fromIndex !== toIndex) {
                this.taskList.updateTaskPosition(fromIndex, toIndex);
                this.render();
            }
        });

        li.addEventListener('dragend', (e) => {
            li.classList.remove('dragging');
            // Clean up drag-over class from all elements
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            this.draggedIndex = null;
        });


        // Container for the main task row
        const mainTaskRow = document.createElement('div');
        mainTaskRow.style.display = 'flex';
        mainTaskRow.style.alignItems = 'center';
        mainTaskRow.style.gap = '8px';
        mainTaskRow.style.width = '100%';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completada;
        checkbox.addEventListener('change', () => {
            this.taskList.tareas[task.index].toggle();
            this.taskList.save();
            this.render();
            this.showFeedback(task.completada ? '¡Tarea completada!' : 'Tarea pendiente');
        });

        const texto = document.createElement('span');
        texto.textContent = task.texto;
        texto.classList.add('texto');
        texto.addEventListener('click', () => {
            texto.contentEditable = true;
            texto.focus();
        });
        texto.addEventListener('blur', () => {
            texto.contentEditable = false;
            this.taskList.updateTaskText(task.index, texto.textContent);
        });
        
        const deadline = document.createElement('span');
        deadline.textContent = task.deadline ? new Date(task.deadline).toLocaleString() : '(sin fecha)';
        deadline.classList.add('deadline');
        if (task.deadline && new Date(task.deadline) < new Date() && !task.completada) {
            deadline.classList.add('overdue');
        }

        mainTaskRow.appendChild(checkbox);
        mainTaskRow.appendChild(texto);
        mainTaskRow.appendChild(deadline);

        if (task.recordatorio) {
            const reminder = document.createElement('span');
            reminder.textContent = `🔔 ${new Date(task.recordatorio).toLocaleString()}`;
            reminder.classList.add('reminder');
            mainTaskRow.appendChild(reminder);
        }

        if (task.proyecto) {
            const proyecto = document.createElement('span');
            proyecto.textContent = `[${task.proyecto}]`;
            proyecto.classList.add('proyecto');
            mainTaskRow.appendChild(proyecto);
        }
        const spacer = document.createElement('div');
        spacer.style.flexGrow = '1';
        mainTaskRow.appendChild(spacer);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '❌';
        deleteBtn.className = 'btn-borrar';
        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Seguro que quieres borrar esta tarea?')) {
                this.taskList.removeTask(task.index);
                this.render();
                this.showFeedback('Tarea eliminada');
            }
        });
        mainTaskRow.appendChild(deleteBtn);
        
        li.appendChild(mainTaskRow);

        // --- SUBTASKS ---
        const subtaskContainer = document.createElement('div');
        subtaskContainer.style.marginLeft = '40px';
        subtaskContainer.style.marginTop = '10px';

        if (task.subtasks && task.subtasks.length > 0) {
            const subtaskList = document.createElement('ul');
            task.subtasks.forEach((subtask, subtaskIndex) => {
                const subtaskLi = document.createElement('li');
                // Reset some styles inherited from parent li
                subtaskLi.style.display = 'flex';
                subtaskLi.style.alignItems = 'center';
                subtaskLi.style.gap = '8px';
                subtaskLi.style.border = 'none';
                subtaskLi.style.background = 'transparent';
                subtaskLi.style.boxShadow = 'none';

                if (subtask.completada) subtaskLi.classList.add('done');

                const subtaskCheckbox = document.createElement('input');
                subtaskCheckbox.type = 'checkbox';
                subtaskCheckbox.checked = subtask.completada;
                subtaskCheckbox.addEventListener('change', () => {
                    this.taskList.tareas[task.index].toggleSubtask(subtaskIndex);
                    this.taskList.save();
                    this.render();
                });

                const subtaskTexto = document.createElement('span');
                subtaskTexto.textContent = subtask.texto;
                subtaskTexto.style.flexGrow = '1';
                subtaskTexto.addEventListener('click', () => {
                    subtaskTexto.contentEditable = true;
                    subtaskTexto.focus();
                });
                subtaskTexto.addEventListener('blur', () => {
                    subtaskTexto.contentEditable = false;
                    this.taskList.tareas[task.index].updateSubtask(subtaskIndex, subtaskTexto.textContent);
                    this.taskList.save();
                });

                const subtaskDeleteBtn = document.createElement('button');
                subtaskDeleteBtn.textContent = '❌';
                subtaskDeleteBtn.className = 'btn-borrar';
                subtaskDeleteBtn.addEventListener('click', () => {
                    this.taskList.tareas[task.index].removeSubtask(subtaskIndex);
                    this.taskList.save();
                    this.render();
                });
                
                subtaskLi.appendChild(subtaskCheckbox);
                subtaskLi.appendChild(subtaskTexto);
                subtaskLi.appendChild(subtaskDeleteBtn);
                subtaskList.appendChild(subtaskLi);
            });
            subtaskContainer.appendChild(subtaskList);
        }

        // "Add Subtask" form
        const addSubtaskForm = document.createElement('form');
        addSubtaskForm.style.display = 'flex';
        addSubtaskForm.style.gap = '4px';
        addSubtaskForm.style.marginTop = '5px';
        const addSubtaskInput = document.createElement('input');
        addSubtaskInput.type = 'text';
        addSubtaskInput.placeholder = 'Nueva subtarea...';
        addSubtaskInput.style.flexGrow = '1';
        const addSubtaskBtn = document.createElement('button');
        addSubtaskBtn.type = 'submit';
        addSubtaskBtn.textContent = 'Añadir';
        
        addSubtaskForm.appendChild(addSubtaskInput);
        addSubtaskForm.appendChild(addSubtaskBtn);

        addSubtaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const subtaskText = addSubtaskInput.value.trim();
            if (subtaskText) {
                this.taskList.tareas[task.index].addSubtask(subtaskText);
                this.taskList.save();
                this.render();
                addSubtaskInput.value = '';
            }
        });

        subtaskContainer.appendChild(addSubtaskForm);
        li.appendChild(subtaskContainer);

        return li;
    }
}
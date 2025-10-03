class UI {
    constructor(taskList, notifications) {
        this.taskList = taskList;
        this.notifications = notifications;
        this.app = document.getElementById('app');

        // Modal elements
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.modal = document.getElementById('new-task-modal');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.modalAddTaskBtn = document.getElementById('modal-add-task-btn');
        
        this.modalNewTaskInput = document.getElementById('modal-new-task-input');
        this.modalNewTaskPriority = document.getElementById('modal-new-task-priority');
        this.modalNewTaskProject = document.getElementById('modal-new-task-project');
        this.modalNewTaskDeadline = document.getElementById('modal-new-task-deadline');
        this.modalNewTaskReminder = document.getElementById('modal-new-task-reminder');

        this.newProjectForm = document.getElementById('new-project-form');
        this.newProjectNameInput = document.getElementById('new-project-name');
        this.addNewProjectBtn = document.getElementById('add-new-project-btn');

        this.sortDropdown = document.getElementById('sort');

        // Event listeners
        this.addTaskBtn.addEventListener('click', () => this.openModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.modalAddTaskBtn.addEventListener('click', () => this.addTaskHandler());
        this.modalNewTaskProject.addEventListener('change', () => this.handleProjectChange());
        this.addNewProjectBtn.addEventListener('click', () => this.addNewProject());
        this.sortDropdown.addEventListener('change', () => this.handleSortChange());

        // New filter event listeners
        document.getElementById('filter-high').addEventListener('click', (e) => {
            e.preventDefault();
            this.taskList.setFilter('high');
            this.render();
        });
        document.getElementById('filter-medium').addEventListener('click', (e) => {
            e.preventDefault();
            this.taskList.setFilter('medium');
            this.render();
        });
        document.getElementById('filter-low').addEventListener('click', (e) => {
            e.preventDefault();
            this.taskList.setFilter('low');
            this.render();
        });
        document.getElementById('filter-completed').addEventListener('click', (e) => {
            e.preventDefault();
            this.taskList.setFilter('completed');
            this.render();
        });

        // Existing filter event listeners (ensure they are present and correct)
        document.getElementById('filter-all').addEventListener('click', (e) => {
            e.preventDefault();
            this.taskList.setFilter('all');
            this.render();
        });
        document.getElementById('filter-today').addEventListener('click', (e) => {
            e.preventDefault();
            this.taskList.setFilter('today');
            this.render();
        });
        document.getElementById('filter-upcoming').addEventListener('click', (e) => {
            e.preventDefault();
            this.taskList.setFilter('upcoming');
            this.render();
        });

        const setPriorityColor = () => {
            this.modalNewTaskPriority.classList.remove('priority-high', 'priority-medium', 'priority-low');
            this.modalNewTaskPriority.classList.add(`priority-${this.modalNewTaskPriority.value}`);
        };

        this.modalNewTaskPriority.addEventListener('change', setPriorityColor);

        // Set initial color
        setPriorityColor();
    }

    openModal() {
        this.renderProjects(); // Update projects in modal dropdown
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    addTaskHandler() {
        const taskText = this.modalNewTaskInput.value.trim();
        const priority = this.modalNewTaskPriority.value;
        let project = this.modalNewTaskProject.value;
        const deadline = this.modalNewTaskDeadline.value;
        const reminder = this.modalNewTaskReminder.value;

        if (taskText) {
            if (project === 'new-project') {
                const newProjectName = this.newProjectNameInput.value.trim();
                if (newProjectName) {
                    this.taskList.addProject(newProjectName);
                    project = newProjectName;
                } else {
                    // Handle case where new project name is empty
                    this.notifications.showFeedback('Project name cannot be empty.', 'error');
                    return;
                }
            }
            this.taskList.addTask({ text: taskText, priority: priority, project: project, deadline: deadline, reminder: reminder });
            this.render();
            this.closeModal();
            // Clear modal form fields
            this.modalNewTaskInput.value = '';
            this.modalNewTaskDeadline.value = '';
            this.modalNewTaskReminder.value = '';
            this.newProjectNameInput.value = '';
            this.newProjectForm.style.display = 'none';
        }
    }

    handleProjectChange() {
        if (this.modalNewTaskProject.value === 'new-project') {
            this.newProjectForm.style.display = 'block';
        } else {
            this.newProjectForm.style.display = 'none';
        }
    }

    addNewProject() {
        const newProjectName = this.newProjectNameInput.value.trim();
        if (newProjectName) {
            this.taskList.addProject(newProjectName);
            this.renderProjects();
            this.modalNewTaskProject.value = newProjectName;
            this.newProjectForm.style.display = 'none';
            this.newProjectNameInput.value = '';
        }
    }

    handleSortChange() {
        const sortBy = this.sortDropdown.value;
        this.taskList.setSort(sortBy);
        this.render();
    }

    render() {
        this.renderProjects();
        const tasks = this.taskList.getFilteredAndSortedTasks();
        const taskListElement = document.getElementById('lista');
        taskListElement.innerHTML = '';

        // Handle active class for main filters
        document.querySelectorAll('.filter-list a').forEach(link => {
            link.classList.remove('active');
        });
        const activeFilterLink = document.getElementById(`filter-${this.taskList.filter}`);
        if (activeFilterLink) {
            activeFilterLink.classList.add('active');
        }

        tasks.forEach(task => {
            const taskElement = document.createElement('li');
            if (task.completed) {
                taskElement.classList.add('completed');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                this.taskList.toggleTask(task.id);
                this.render();
            });

            const taskText = document.createElement('span');
            taskText.classList.add('texto');
            taskText.textContent = task.text;
            this.createEditable(taskText, task, 'text', 'text');

            const priorityContainer = document.createElement('span');
            const priorityCircle = document.createElement('span');
            priorityCircle.classList.add('priority-circle', `priority-${task.priority}`);
            const taskPriority = document.createElement('span');
            taskPriority.textContent = task.priority;
            this.createEditable(taskPriority, task, 'priority', 'select', ['high', 'medium', 'low']);
            priorityContainer.appendChild(priorityCircle);
            priorityContainer.appendChild(taskPriority);

            const taskProject = document.createElement('span');
            taskProject.textContent = task.project || 'No project';
            this.createTaskProjectEditable(taskProject, task);

            const taskDeadline = document.createElement('span');
            taskDeadline.textContent = this.formatDeadline(task.deadline);
            this.createEditable(taskDeadline, task, 'deadline', 'date');

            const taskReminderContainer = document.createElement('span');
            const reminderIcon = document.createElement('i');
            reminderIcon.classList.add('fas', 'fa-bell');
            const reminderText = document.createElement('span');

            if (task.reminder) {
                reminderText.textContent = task.reminder;
                taskReminderContainer.appendChild(reminderIcon);
                taskReminderContainer.appendChild(reminderText);
            } else {
                reminderText.textContent = 'add reminder';
                taskReminderContainer.appendChild(reminderText);
            }
            this.createEditable(reminderText, task, 'reminder', 'select', ['', '5min', '15min', '30min', '1hour', '2hours', '1day', '2days', '1week']);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-btn');
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.addEventListener('click', () => {
                this.taskList.removeTask(task.id);
                this.render();
            });

            taskElement.appendChild(checkbox);
            taskElement.appendChild(taskText);
            taskElement.appendChild(priorityContainer);
            taskElement.appendChild(taskProject);
            taskElement.appendChild(taskDeadline);
            taskElement.appendChild(taskReminderContainer);
            taskElement.appendChild(deleteButton);

            const subtaskListElement = document.createElement('ul');
            subtaskListElement.classList.add('subtask-list');
            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach((subtask, index) => {
                    const subtaskElement = document.createElement('li');
                    subtaskElement.classList.add('subtask-item');

                    const subtaskCheckbox = document.createElement('input');
                    subtaskCheckbox.type = 'checkbox';
                    subtaskCheckbox.checked = subtask.completed;
                    subtaskCheckbox.addEventListener('change', () => {
                        this.taskList.toggleSubtask(task.id, index);
                        this.render();
                    });

                    const subtaskText = document.createElement('span');
                    subtaskText.textContent = subtask.text;
                    if (subtask.completed) {
                        subtaskText.classList.add('completed');
                    }

                    const deleteSubtaskButton = document.createElement('button');
                    deleteSubtaskButton.classList.add('delete-btn');
                    deleteSubtaskButton.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteSubtaskButton.addEventListener('click', () => {
                        this.taskList.removeSubtask(task.id, index);
                        this.render();
                    });

                    subtaskElement.appendChild(subtaskCheckbox);
                    subtaskElement.appendChild(subtaskText);
                    subtaskElement.appendChild(deleteSubtaskButton);
                    subtaskListElement.appendChild(subtaskElement);
                });
            }

            const addSubtaskButton = document.createElement('button');
            addSubtaskButton.textContent = '+ Add Subtask';
            addSubtaskButton.classList.add('add-subtask-btn');
            addSubtaskButton.addEventListener('click', () => {
                const subtaskInput = document.createElement('input');
                subtaskInput.type = 'text';
                subtaskInput.placeholder = 'New Subtask';
                subtaskInput.classList.add('subtask-input');
                subtaskInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        if (subtaskInput.value.trim()) {
                            this.taskList.addSubtask(task.id, subtaskInput.value.trim());
                            this.render();
                        }
                    }
                });
                subtaskListElement.appendChild(subtaskInput);
                subtaskInput.focus();
            });

            taskElement.appendChild(subtaskListElement);
            taskElement.appendChild(addSubtaskButton);

            taskListElement.appendChild(taskElement);
        });
    }

    renderProjects() {
        const projects = this.taskList.getUniqueProjects();
        const projectListElement = document.getElementById('project-list');
        const modalNewTaskProjectElement = document.getElementById('modal-new-task-project');

        if (projectListElement) {
            projectListElement.innerHTML = '';
            // Add "All" filter to sidebar
            const allProjectsElement = document.createElement('li');
            const allProjectsLink = document.createElement('a');
            allProjectsLink.href = '#';
            allProjectsLink.textContent = 'All';
            if (this.taskList.projectFilter === 'all') {
                allProjectsLink.classList.add('active');
            }
            allProjectsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.taskList.setProjectFilter('all');
                this.render();
            });
            allProjectsElement.appendChild(allProjectsLink);
            projectListElement.appendChild(allProjectsElement);

            projects.forEach(project => {
                // Add project to sidebar list
                const projectElement = document.createElement('li');
                const projectLink = document.createElement('a');
                projectLink.href = '#';
                
                if (this.taskList.projectFilter === project) {
                    projectLink.classList.add('active');
                }

                projectLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.taskList.setProjectFilter(project);
                    this.render();
                });
                
                const projectText = document.createElement('span');
                projectText.textContent = project;
                this.createProjectEditable(projectText, project);

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-btn');
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.taskList.deleteProject(project);
                    this.render();
                });

                projectLink.appendChild(projectText);
                projectElement.appendChild(projectLink);
                projectElement.appendChild(deleteButton);
                projectListElement.appendChild(projectElement);
            });
        }

        if (modalNewTaskProjectElement) {
            modalNewTaskProjectElement.innerHTML = '';
            // Add "No project" option to new task project dropdown
            const noProjectOption = document.createElement('option');
            noProjectOption.value = '';
            noProjectOption.textContent = 'No project';
            modalNewTaskProjectElement.appendChild(noProjectOption);

            projects.forEach(project => {
                // Add project to new task project dropdown
                const projectOption = document.createElement('option');
                projectOption.value = project;
                projectOption.textContent = project;
                modalNewTaskProjectElement.appendChild(projectOption);
            });

            // Add "Create new project" option
            const newProjectOption = document.createElement('option');
            newProjectOption.value = 'new-project';
            newProjectOption.textContent = 'Create new project...';
            modalNewTaskProjectElement.appendChild(newProjectOption);
        }
    }

    createEditable(element, task, property, type, options = []) {
        element.addEventListener('click', () => {
            const originalElement = element; // Store the original element to restore on cancel
            const oldValue = element.textContent;
            console.log('oldValue:', oldValue);
            let input;

            if (type === 'select') {
                input = document.createElement('select');
                input.id = `edit-${task.id}-${property}`;
                input.name = `edit-${task.id}-${property}`;
                options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    if (option === oldValue) {
                        opt.selected = true;
                    }
                    input.appendChild(opt);
                });
            } else if (type === 'date') {
                const originalDate = task[property] ? new Date(task[property]) : null;
                const oldDateValue = originalDate ? originalDate.toISOString().slice(0, 10) : '';
                const oldTimeValue = originalDate ? originalDate.toISOString().slice(11, 16) : '';

                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.value = oldDateValue;
                dateInput.classList.add('editing');
                dateInput.id = `edit-date-${task.id}-${property}`;
                dateInput.name = `edit-date-${task.id}-${property}`;

                const timeInput = document.createElement('input');
                timeInput.type = 'time';
                timeInput.value = oldTimeValue;
                timeInput.classList.add('editing');
                timeInput.id = `edit-time-${task.id}-${property}`;
                timeInput.name = `edit-time-${task.id}-${property}`;

                const container = document.createElement('span');
                container.appendChild(dateInput);
                container.appendChild(timeInput);
                input = container;

                // Focus on the date input first
                dateInput.focus();

                const saveDateTime = () => {
                    const newDate = dateInput.value;
                    const newTime = timeInput.value;
                    const newValue = newDate ? `${newDate}${newTime ? 'T' + newTime : ''}` : null;
                    console.log('newDate:', newDate);
                    console.log('newTime:', newTime);
                    console.log('newValue:', newValue);
                    this.taskList.updateTaskDetails(task.id, { [property]: newValue });
                    this.render();
                };

                const cancelDateTime = () => {
                    this.render(); // Re-render to show original value
                };

                dateInput.addEventListener('blur', saveDateTime, true);
                timeInput.addEventListener('blur', saveDateTime, true);
                dateInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveDateTime();
                    else if (e.key === 'Escape') cancelDateTime();
                });
                timeInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveDateTime();
                    else if (e.key === 'Escape') cancelDateTime();
                });

                originalElement.replaceWith(container);
                return; // Exit to prevent default blur/keydown listeners

            } else {
                input = document.createElement('input');
                input.type = type;
                input.value = oldValue;
                input.id = `edit-${task.id}-${property}`;
                input.name = `edit-${task.id}-${property}`;
            }

            originalElement.replaceWith(input);
            if (input.focus) input.focus();
            input.classList.add('editing');

            const save = () => {
                const newValue = input.value;
                console.log('newValue:', newValue);
                this.taskList.updateTaskDetails(task.id, { [property]: newValue });
                this.render();
            };

            const cancel = () => {
                this.render(); // Re-render to show original value
            };

            input.addEventListener('blur', save, true);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    save();
                } else if (e.key === 'Escape') {
                    cancel();
                }
            });
        });
    }

    createProjectEditable(element, oldProjectName) {
        element.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the link's click event
            const originalElement = element;
            const oldValue = oldProjectName;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = oldValue;
            
            originalElement.replaceWith(input);
            input.focus();
            
            const save = () => {
                const newValue = input.value.trim();
                if (newValue && newValue !== oldValue) {
                    this.taskList.updateProjectName(oldValue, newValue);
                    this.render();
                } else {
                    this.render();
                }
            };
            
            input.addEventListener('blur', save);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    save();
                } else if (e.key === 'Escape') {
                    this.render();
                }
            });
        });
    }

    createTaskProjectEditable(element, task) {
        element.addEventListener('click', () => {
            const originalElement = element;
            const oldValue = task.project;
            
            const projects = this.taskList.getUniqueProjects();
            const options = ['', ...projects, 'new-project'];
            
            const select = document.createElement('select');
            options.forEach(option => {
                const opt = document.createElement('option');
                if (option === 'new-project') {
                    opt.value = 'new-project';
                    opt.textContent = 'Create new project...';
                } else {
                    opt.value = option;
                    opt.textContent = option || 'No project';
                }
                if (option === oldValue) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });
            
            originalElement.replaceWith(select);
            select.focus();
            
            select.addEventListener('change', () => {
                const newValue = select.value;
                if (newValue === 'new-project') {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = 'New project name';
                    select.replaceWith(input);
                    input.focus();
                    
                    const handleNewProject = (event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            const newProject = input.value.trim();
                            if (newProject) {
                                this.taskList.addProject(newProject);
                                this.taskList.updateTaskDetails(task.id, { project: newProject });
                                this.render();
                            }
                        }
                    };
                    input.addEventListener('keydown', handleNewProject);
                    input.addEventListener('blur', () => {
                        this.render();
                    });
                    
                } else {
                    this.taskList.updateTaskDetails(task.id, { project: newValue });
                    this.render();
                }
            });
        });
    }

    showNewProjectInput(callback) {
        this.projectInputContainer.style.display = 'block';
        this.projectInput.focus();
    
        const handleNewProject = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const newProject = this.projectInput.value.trim();
                if (newProject) {
                    this.taskList.addProject(newProject);
                    this.projectInput.value = '';
                    this.projectInputContainer.style.display = 'none';
                    if (callback) {
                        callback(newProject);
                    }
                }
                this.projectInput.removeEventListener('keydown', handleNewProject);
            }
        };
        this.projectInput.addEventListener('keydown', handleNewProject);
    }

    formatDeadline(deadline) {
        if (!deadline) {
            return 'no deadline';
        }
    
        const date = new Date(deadline);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
    
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
    }
}

export { UI };
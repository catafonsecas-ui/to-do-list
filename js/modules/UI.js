class UI {
    constructor(taskList) {
        this.taskList = taskList;
        this.app = document.getElementById('app');
        this.form = document.getElementById('form');
        this.newTaskBtn = document.getElementById('new-task-btn');
        this.newTaskInput = document.getElementById('new-task-input');
        this.newTaskPriority = document.getElementById('new-task-priority');
        this.newTaskProject = document.getElementById('new-task-project');
        this.newTaskDeadline = document.getElementById('new-task-deadline');
        this.projectInputContainer = document.getElementById('projectInputContainer');
        this.projectInput = document.getElementById('projectInput');

        const addTaskHandler = () => {
            const taskText = this.newTaskInput.value.trim();
            const priority = this.newTaskPriority.value;
            const project = this.newTaskProject.value;
            const deadline = this.newTaskDeadline.value;
            if (taskText) {
                this.taskList.addTask({ text: taskText, priority: priority, project: project, deadline: deadline });
                this.render();
                this.newTaskInput.value = '';
                this.newTaskDeadline.value = '';
            }
        };

        this.newTaskBtn.addEventListener('click', addTaskHandler);

        this.newTaskInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addTaskHandler();
            }
        });

        this.newTaskProject.addEventListener('change', () => {
            if (this.newTaskProject.value === 'new-project') {
                this.showNewProjectInput((newProject) => {
                    this.renderProjects();
                    this.newTaskProject.value = newProject;
                });
            }
        });

        const setPriorityColor = () => {
            this.newTaskPriority.classList.remove('priority-high', 'priority-medium', 'priority-low');
            this.newTaskPriority.classList.add(`priority-${this.newTaskPriority.value}`);
        };

        this.newTaskPriority.addEventListener('change', setPriorityColor);

        // Set initial color
        setPriorityColor();
    }

    render() {
        this.renderProjects();
        const tasks = this.taskList.getFilteredAndSortedTasks();
        console.log('Rendering tasks:', tasks);
        const taskListElement = document.getElementById('lista');
        taskListElement.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = document.createElement('li');

            const taskText = document.createElement('span');
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
            taskDeadline.textContent = task.deadline || 'no deadline';
            this.createEditable(taskDeadline, task, 'deadline', 'date');

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                this.taskList.removeTask(task.id);
                this.render();
            });

            taskElement.appendChild(taskText);
            taskElement.appendChild(priorityContainer);
            taskElement.appendChild(taskProject);
            taskElement.appendChild(taskDeadline);
            taskElement.appendChild(deleteButton);
            taskListElement.appendChild(taskElement);
        });
    }

    renderProjects() {
        const projects = this.taskList.getUniqueProjects();
        const projectListElement = document.getElementById('project-list');
        const newTaskProjectElement = document.getElementById('new-task-project');

        projectListElement.innerHTML = '';
        newTaskProjectElement.innerHTML = '';

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


        // Add "No project" option to new task project dropdown
        const noProjectOption = document.createElement('option');
        noProjectOption.value = '';
        noProjectOption.textContent = 'No project';
        newTaskProjectElement.appendChild(noProjectOption);

        projects.forEach(project => {
            // Add project to sidebar list
            const projectElement = document.createElement('li');
            const projectLink = document.createElement('a');
            projectLink.href = '#';
            
            const projectText = document.createElement('span');
            projectText.textContent = project;
            this.createProjectEditable(projectText, project);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.taskList.deleteProject(project);
                this.render();
            });

            projectLink.appendChild(projectText);
            projectElement.appendChild(projectLink);
            projectElement.appendChild(deleteButton);
            projectListElement.appendChild(projectElement);

            // Add project to new task project dropdown
            const projectOption = document.createElement('option');
            projectOption.value = project;
            projectOption.textContent = project;
            newTaskProjectElement.appendChild(projectOption);
        });

        // Add "Create new project" option
        const newProjectOption = document.createElement('option');
        newProjectOption.value = 'new-project';
        newProjectOption.textContent = 'Create new project...';
        newTaskProjectElement.appendChild(newProjectOption);
    }

    createEditable(element, task, property, type, options = []) {
        element.addEventListener('click', () => {
            const originalElement = element; // Store the original element to restore on cancel
            const oldValue = element.textContent;
            console.log('oldValue:', oldValue);
            let input;

            if (type === 'select') {
                input = document.createElement('select');
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

                const timeInput = document.createElement('input');
                timeInput.type = 'time';
                timeInput.value = oldTimeValue;
                timeInput.classList.add('editing');

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
        console.log('Creating editable project for task:', task);
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
                    this.showNewProjectInput((newProject) => {
                        this.taskList.updateTaskDetails(task.id, { project: newProject });
                        this.render();
                    });
                } else {
                    this.taskList.updateTaskDetails(task.id, { project: newValue });
                    this.render();
                }
            });
            
            select.addEventListener('blur', () => {
                this.render();
            });
        });
    }

    showFeedback(message, type = 'info') {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `feedback ${type}`;
        feedbackElement.textContent = message;
        this.app.prepend(feedbackElement);
        setTimeout(() => {
            feedbackElement.remove();
        }, 3000);
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
}

export { UI };
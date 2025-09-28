class UI {
    constructor(taskList) {
        this.taskList = taskList;
        this.app = document.getElementById('app');
        this.form = document.getElementById('form');
        this.newTaskBtn = document.getElementById('new-task-btn');
        this.newTaskInput = document.getElementById('new-task-input');
        this.newTaskPriority = document.getElementById('new-task-priority');

        const addTaskHandler = () => {
            const taskText = this.newTaskInput.value.trim();
            const priority = this.newTaskPriority.value;
            if (taskText) {
                this.taskList.addTask({ text: taskText, priority: priority });
                this.render();
                this.newTaskInput.value = '';
            }
        };

        this.newTaskBtn.addEventListener('click', addTaskHandler);

        this.newTaskInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addTaskHandler();
            }
        });
    }

    render() {
        const tasks = this.taskList.getFilteredAndSortedTasks();
        const taskListElement = document.getElementById('lista');
        taskListElement.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = document.createElement('li');

            const taskText = document.createElement('span');
            taskText.textContent = task.text;
            this.createEditable(taskText, task, 'text', 'text');

            const taskPriority = document.createElement('span');
            taskPriority.textContent = task.priority;
            this.createEditable(taskPriority, task, 'priority', 'select', ['high', 'medium', 'low']);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                this.taskList.removeTask(task.id);
                this.render();
            });

            taskElement.appendChild(taskText);
            taskElement.appendChild(taskPriority);
            taskElement.appendChild(deleteButton);
            taskListElement.appendChild(taskElement);
        });
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

    showFeedback(message, type = 'info') {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `feedback ${type}`;
        feedbackElement.textContent = message;
        this.app.prepend(feedbackElement);
        setTimeout(() => {
            feedbackElement.remove();
        }, 3000);
    }
}

export { UI };
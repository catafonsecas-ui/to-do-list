export class Notifications {
    constructor() {
        this.checkInterval = 10000; // Check every 10 seconds for testing
        this.intervalId = null;
        this.lastCheck = null;
        this.hasRequestedPermission = false;
        this.init();
    }

    async checkPermission() {
        if (!("Notification" in window)) {
            this.showFeedback("This browser does not support notifications.");
            return false;
        }

        if (Notification.permission === "granted") {
            return true;
        }

        if (Notification.permission !== "denied" && !this.hasRequestedPermission) {
            this.hasRequestedPermission = true;
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                this.showFeedback("Notifications enabled! You will receive reminders for your tasks.");
                return true;
            } else {
                this.showFeedback("Notifications are disabled. You will not receive reminders.");
                return false;
            }
        }

        return Notification.permission === "granted";
    }

    async init() {
        // Show welcome dialog and request permissions
        const dialog = document.createElement('dialog');
        dialog.style.padding = '20px';
        dialog.style.borderRadius = '8px';
        dialog.style.border = '1px solid #ccc';
        dialog.style.maxWidth = '400px';

        const content = document.createElement('div');
        content.innerHTML = `
            <h3 style="margin-top:0">Task Reminders</h3>
            <p>To remind you about your pending tasks, we need your permission to show notifications.</p>
            <p>Notifications will help you to:</p>
            <ul>
                <li>Remember upcoming tasks</li>
                <li>Not forget important dates</li>
                <li>Keep up to date with your pendientes</li>
            </ul>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
                <button id="later">Later</button>
                <button id="allow" style="background:#2a7be4;color:white;border:none;padding:8px 16px;border-radius:4px">
                    Enable notifications
                </button>
            </div>
        `;
        
        dialog.appendChild(content);
        document.body.appendChild(dialog);

        if (!("Notification" in window)) {
            this.showFeedback("This browser does not support notifications.");
            return false;
        }

        if (Notification.permission === "granted") {
            this.showFeedback("Notifications are enabled");
            return true;
        }

        if (Notification.permission !== "denied" && !this.hasRequestedPermission) {
            dialog.showModal();

            dialog.querySelector('#allow').addEventListener('click', async () => {
                this.hasRequestedPermission = true;
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    this.showFeedback("Notifications enabled! You will receive reminders for your tasks.");
                } else {
                    this.showFeedback("Notifications are disabled. You will not receive reminders.");
                }
                dialog.close();
            });

            dialog.querySelector('#later').addEventListener('click', () => {
                this.showFeedback("You can enable notifications later from the 🔔 icon");
                dialog.close();
            });
        }

        return Notification.permission === "granted";
    }

    startChecking(taskList) {
        // Request permissions immediately
        this.checkPermission().then(granted => {
            if (granted) {
                // Stop the previous interval if it exists
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                }

                // Start new interval
                this.intervalId = setInterval(() => {
                    this.checkTasks(taskList).finally(() => {
                        this.lastCheck = new Date();
                    });
                }, this.checkInterval);

                // Do a first check immediately
                this.checkTasks(taskList).finally(() => {
                    this.lastCheck = new Date();
                });
            }
        });
    }

    stopChecking() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    showFeedback(message, type = 'success') {
        const el = document.getElementById('feedback-msg');
        if (el) {
            el.textContent = message;
            el.className = `feedback ${type}`;
            // Trigger reflow to enable transition
            setTimeout(() => {
                el.classList.add('show');
            }, 10);

            setTimeout(() => {
                el.classList.remove('show');
            }, 5000);
        }
    }

    async checkTasks(taskList) {
        if (Notification.permission !== "granted") return;

        const now = new Date();
        console.log('Checking tasks at', now, 'Last check was', this.lastCheck);

        const tasks = taskList.tasks.filter(task => {
            if (task.completed || !task.deadline || !task.reminder) return false;

            const reminderTime = new Date(task.reminder);
            console.log('Checking task:', task.text, 'Reminder time:', reminderTime);

            let shouldNotify = false;
            if (this.lastCheck) {
                shouldNotify = reminderTime >= this.lastCheck && reminderTime <= now;
                console.log('  - Condition (with lastCheck):', shouldNotify);
            } else {
                const timeDiff = now - reminderTime;
                shouldNotify = timeDiff >= 0 && timeDiff < this.checkInterval;
                console.log('  - Condition (first check):', shouldNotify);
            }
            return shouldNotify;
        });

        tasks.forEach(task => {
            this.showNotification(task);
        });
    }

    showNotification(task) {
        try {
            console.log('Showing notification for:', task.text);
            
            const notification = new Notification("Task Reminder", {
                body: `The task "${task.text}" is due ${this.formatDeadline(task.deadline)}`,
                icon: "/favicon.ico",
                tag: `task-${task.id}`, // Avoid duplicates
                requireInteraction: true, // The notification remains until the user interacts
                silent: false // Ensure there is sound
            });

            // Also show in feedback
            this.showFeedback(`🔔 Reminder: The task "${task.text}" is due ${this.formatDeadline(task.deadline)}`);

            notification.onclick = () => {
                window.focus();
                // Highlight the specific task
                const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                if (taskElement) {
                    taskElement.scrollIntoView({ behavior: 'smooth' });
                    taskElement.classList.add('highlight');
                    setTimeout(() => taskElement.classList.remove('highlight'), 2000);
                }
            };
        } catch (error) {
            console.error('Error showing notification:', error);
            this.showFeedback('Error showing notification. Please check permissions.');
        }
    }

    formatDeadline(deadline) {
        const date = new Date(deadline);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return "today";
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return "tomorrow";
        } else {
            return `on ${date.toLocaleDateString()}`;
        }
    }

    calculateNextReminder(deadline, reminderType) {
        console.log('Calculating reminder for deadline:', deadline);
        console.log('Reminder type:', reminderType);
        
        const deadlineDate = new Date(deadline);
        console.log('Parsed deadline date:', deadlineDate);
        
        // If the date is not valid, return null
        if (isNaN(deadlineDate.getTime())) {
            console.error('Invalid date');
            return null;
        }

        const date = new Date(deadlineDate);
        switch (reminderType) {
            case "5min":
                date.setMinutes(date.getMinutes() - 5);
                break;
            case "15min":
                date.setMinutes(date.getMinutes() - 15);
                break;
            case "30min":
                date.setMinutes(date.getMinutes() - 30);
                break;
            case "1hour":
                date.setHours(date.getHours() - 1);
                break;
            case "2hours":
                date.setHours(date.getHours() - 2);
                break;
            case "1day":
                date.setDate(date.getDate() - 1);
                break;
            case "2days":
                date.setDate(date.getDate() - 2);
                break;
            case "1week":
                date.setDate(date.getDate() - 7);
                break;
        }

        console.log('Calculated reminder date:', date);
        return date.toISOString();
    }
}

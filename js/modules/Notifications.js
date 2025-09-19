export class Notifications {
    constructor() {
        this.checkInterval = 10000; // Revisar cada 10 segundos para pruebas
        this.intervalId = null;
        this.lastCheck = null;
        this.hasRequestedPermission = false;
        this.init();
    }

    async checkPermission() {
        if (!("Notification" in window)) {
            this.showFeedback("Este navegador no soporta notificaciones.");
            return false;
        }

        if (Notification.permission === "granted") {
            return true;
        }

        if (Notification.permission !== "denied" && !this.hasRequestedPermission) {
            this.hasRequestedPermission = true;
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                this.showFeedback("¡Notificaciones activadas! Recibirás recordatorios para tus tareas.");
                return true;
            } else {
                this.showFeedback("Las notificaciones están desactivadas. No recibirás recordatorios.");
                return false;
            }
        }

        return Notification.permission === "granted";
    }

    async init() {
        // Mostrar diálogo de bienvenida y solicitud de permisos
        const dialog = document.createElement('dialog');
        dialog.style.padding = '20px';
        dialog.style.borderRadius = '8px';
        dialog.style.border = '1px solid #ccc';
        dialog.style.maxWidth = '400px';

        const content = document.createElement('div');
        content.innerHTML = `
            <h3 style="margin-top:0">Recordatorios de Tareas</h3>
            <p>Para poder recordarte sobre tus tareas pendientes, necesitamos tu permiso para mostrar notificaciones.</p>
            <p>Las notificaciones te ayudarán a:</p>
            <ul>
                <li>Recordar tareas próximas a vencer</li>
                <li>No olvidar fechas importantes</li>
                <li>Mantenerte al día con tus pendientes</li>
            </ul>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px">
                <button id="later">Más tarde</button>
                <button id="allow" style="background:#2a7be4;color:white;border:none;padding:8px 16px;border-radius:4px">
                    Activar notificaciones
                </button>
            </div>
        `;
        
        dialog.appendChild(content);
        document.body.appendChild(dialog);

        if (!("Notification" in window)) {
            this.showFeedback("Este navegador no soporta notificaciones.");
            return false;
        }

        if (Notification.permission === "granted") {
            this.showFeedback("Las notificaciones están activadas");
            return true;
        }

        if (Notification.permission !== "denied" && !this.hasRequestedPermission) {
            dialog.showModal();

            dialog.querySelector('#allow').addEventListener('click', async () => {
                this.hasRequestedPermission = true;
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    this.showFeedback("¡Notificaciones activadas! Recibirás recordatorios para tus tareas.");
                } else {
                    this.showFeedback("Las notificaciones están desactivadas. No recibirás recordatorios.");
                }
                dialog.close();
            });

            dialog.querySelector('#later').addEventListener('click', () => {
                this.showFeedback("Puedes activar las notificaciones más tarde desde el ícono 🔔");
                dialog.close();
            });
        }

        return Notification.permission === "granted";
    }

    startChecking(taskList) {
        // Solicitar permisos inmediatamente
        this.checkPermission().then(granted => {
            if (granted) {
                // Detener el intervalo anterior si existe
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                }

                // Iniciar nuevo intervalo
                this.intervalId = setInterval(() => {
                    this.checkTasks(taskList).finally(() => {
                        this.lastCheck = new Date();
                    });
                }, this.checkInterval);

                // Hacer una primera revisión inmediata
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

    showFeedback(message) {
        const el = document.getElementById('feedback-msg');
        if (el) {
            el.textContent = message;
            el.style.opacity = 1;
            clearTimeout(el._timeout);
            el._timeout = setTimeout(() => { el.style.opacity = 0; }, 5000);
        }
    }

    async checkTasks(taskList) {
        if (Notification.permission !== "granted") return;

        const now = new Date();
        const tasks = taskList.tareas.filter(task => {
            // No notificar tareas completadas o sin recordatorio
            if (task.completada || !task.deadline || !task.recordatorio) return false;

            const recordatorioTime = new Date(task.recordatorio);
            
            // Verificar si el recordatorio debe mostrarse ahora
            if (this.lastCheck) {
                // El recordatorio debe estar entre la última verificación y ahora
                return recordatorioTime >= this.lastCheck && recordatorioTime <= now;
            } else {
                // Primera verificación: mostrar si el recordatorio está dentro del intervalo actual
                const timeDiff = now - recordatorioTime;
                return timeDiff >= 0 && timeDiff < this.checkInterval;
            }
        });

        tasks.forEach(task => {
            this.showNotification(task);
        });
    }

    showNotification(task) {
        try {
            console.log('Mostrando notificación para:', task.texto);
            
            const notification = new Notification("Recordatorio de tarea", {
                body: `La tarea "${task.texto}" vence ${this.formatDeadline(task.deadline)}`,
                icon: "/favicon.ico",
                tag: `task-${task.id}`, // Evita duplicados
                requireInteraction: true, // La notificación permanece hasta que el usuario interactúe
                silent: false // Asegura que haya sonido
            });

            // Mostrar también en el feedback
            this.showFeedback(`🔔 Recordatorio: La tarea "${task.texto}" vence ${this.formatDeadline(task.deadline)}`);

            notification.onclick = () => {
                window.focus();
                // Resaltar la tarea específica
                const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                if (taskElement) {
                    taskElement.scrollIntoView({ behavior: 'smooth' });
                    taskElement.classList.add('highlight');
                    setTimeout(() => taskElement.classList.remove('highlight'), 2000);
                }
            };
        } catch (error) {
            console.error('Error al mostrar la notificación:', error);
            this.showFeedback('Error al mostrar la notificación. Por favor, verifica los permisos.');
        }
    }

    formatDeadline(deadline) {
        const date = new Date(deadline);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return "hoy";
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return "mañana";
        } else {
            return `el ${date.toLocaleDateString()}`;
        }
    }

    calculateNextReminder(deadline, reminderType) {
        console.log('Calculando recordatorio para deadline:', deadline);
        console.log('Tipo de recordatorio:', reminderType);
        
        const deadlineDate = new Date(deadline);
        console.log('Fecha límite parseada:', deadlineDate);
        
        // Si la fecha no es válida, retornar null
        if (isNaN(deadlineDate.getTime())) {
            console.error('Fecha inválida');
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

        console.log('Fecha de recordatorio calculada:', date);
        return date.toISOString();
    }
}